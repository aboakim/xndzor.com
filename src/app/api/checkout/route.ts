import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  amdToUsdCents,
  arePackagesFree,
  getEffectiveAmountAmd,
  getProduct,
  isDemoModeAllowed,
  isStripeConfigured,
  requirePaymentInProduction,
  type BoostTargetType,
  type ProductCode,
} from "@/lib/pricing";
import { assertListingOwnedBy } from "@/lib/monetization";
import { validateCsrf } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fulfillPayment, logPaymentEvent } from "@/lib/payments";
import { userQualifiesForFreePackages } from "@/lib/early-bird";
import { isIdramConfigured, buildIdramCheckoutForm } from "@/lib/payments/idram";
import { isTelcellConfigured, buildTelcellCheckoutForm } from "@/lib/payments/telcell";

const localProviderSchema = z.enum(["idram", "telcell"]);

const bodySchema = z.object({
  productCode: z.enum([
    "FARM_PRO_MONTHLY",
    "FARM_PRO_YEARLY",
    "BUYER_PRO_MONTHLY",
    "VERIFIED_FARM_YEARLY",
    "BOOST_7",
    "BOOST_30",
  ]),
  locale: z.string().min(2).max(5).optional(),
  targetType: z
    .enum(["MACHINERY", "ANIMAL", "CATALOG", "SUPPLY", "FUTURE_HARVEST"])
    .optional(),
  targetId: z.string().min(1).optional(),
  /** When true and user is Pro with quota, apply free boost instead of paying */
  useProQuota: z.boolean().optional(),
  /** Payment gateway: stripe (cards), idram, telcell */
  paymentProvider: z.union([z.literal("stripe"), localProviderSchema]).optional(),
});

function productDescription(productCode: ProductCode, amountAmd: number): string {
  return `Xndzor.com ${productCode} · ${amountAmd} AMD`;
}

export async function POST(req: Request) {
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const userLimit = rateLimit(`checkout:user:${session.user.id}`, {
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!userLimit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec) } },
    );
  }
  const ipLimit = rateLimit(`checkout:ip:${ip}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  if (!requirePaymentInProduction()) {
    logPaymentEvent("checkout_blocked_production", { userId: session.user.id });
    return NextResponse.json({ error: "payment_required_in_production" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { productCode, locale = "hy", useProQuota, paymentProvider = "stripe" } =
    parsed.data;
  const product = getProduct(productCode);
  if (!product) {
    return NextResponse.json({ error: "unknown_product" }, { status: 400 });
  }

  const demoMode = isDemoModeAllowed();
  const effectiveProvider = demoMode ? "stripe" : paymentProvider;

  const targetType = parsed.data.targetType as BoostTargetType | undefined;
  const targetId = parsed.data.targetId;

  if (product.kind === "BOOST") {
    if (!targetType || !targetId) {
      return NextResponse.json({ error: "boost_target_required" }, { status: 400 });
    }
    const owned = await assertListingOwnedBy(session.user.id, targetType, targetId);
    if (!owned) {
      return NextResponse.json({ error: "not_owner" }, { status: 403 });
    }

    if (useProQuota) {
      const { applyProQuotaBoost } = await import("@/lib/monetization");
      const err = await applyProQuotaBoost(
        session.user.id,
        targetType,
        targetId,
        product.periodDays as 7 | 30,
      );
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      return NextResponse.json({ ok: true, mode: "pro_quota" });
    }
  }

  const userFree = await userQualifiesForFreePackages(session.user.id);
  const amountAmd = getEffectiveAmountAmd(product.amountAmd, userFree);
  const metadata = {
    productCode,
    userId: session.user.id,
    locale,
    ...(targetType && targetId ? { targetType, targetId } : {}),
    ...(arePackagesFree() ? { packagesFree: true } : {}),
    ...(userFree ? { earlyBirdFree: true } : {}),
  };

  const origin = new URL(req.url).origin;
  const description = productDescription(productCode, amountAmd);

  // ── Free packages: activate immediately, skip Stripe / iDram / TelCell ───
  if (arePackagesFree() || userFree || amountAmd === 0) {
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amountAmd: 0,
        amountCharge: 0,
        currencyCharge: "amd",
        status: "PENDING",
        provider: "FREE",
        productCode: product.code,
        metadataJson: JSON.stringify(metadata),
      },
    });
    logPaymentEvent("checkout_created", {
      paymentId: payment.id,
      userId: session.user.id,
      productCode,
      provider: "FREE",
      amountAmd: 0,
    });
    const result = await fulfillPayment(payment.id);
    if (result !== "activated" && result !== "already") {
      return NextResponse.json({ error: "generic" }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      mode: "free",
      paymentId: payment.id,
    });
  }

  // ── iDram checkout ──────────────────────────────────────────────────────
  if (effectiveProvider === "idram" && isIdramConfigured()) {
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amountAmd,
        currencyCharge: "amd",
        status: "PENDING",
        provider: "IDRAM",
        productCode: product.code,
        metadataJson: JSON.stringify(metadata),
      },
    });
    logPaymentEvent("checkout_created", {
      paymentId: payment.id,
      userId: session.user.id,
      productCode,
      provider: "IDRAM",
      amountAmd,
    });
    const form = buildIdramCheckoutForm({
      paymentId: payment.id,
      amountAmd,
      description,
      locale,
    });
    return NextResponse.json({
      mode: "idram",
      paymentId: payment.id,
      redirect: form,
    });
  }

  // ── TelCell checkout ────────────────────────────────────────────────────
  if (effectiveProvider === "telcell" && isTelcellConfigured()) {
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amountAmd,
        currencyCharge: "amd",
        status: "PENDING",
        provider: "TELCELL",
        productCode: product.code,
        metadataJson: JSON.stringify(metadata),
      },
    });
    logPaymentEvent("checkout_created", {
      paymentId: payment.id,
      userId: session.user.id,
      productCode,
      provider: "TELCELL",
      amountAmd,
    });
    const form = buildTelcellCheckoutForm({
      paymentId: payment.id,
      amountAmd,
      description,
      locale,
    });
    return NextResponse.json({
      mode: "telcell",
      paymentId: payment.id,
      redirect: form,
    });
  }

  if (
    (effectiveProvider === "idram" || effectiveProvider === "telcell") &&
    !demoMode
  ) {
    return NextResponse.json({ error: "provider_not_configured" }, { status: 503 });
  }

  // ── Stripe / demo — create payment record ───────────────────────────────
  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      amountAmd,
      amountCharge: amdToUsdCents(amountAmd),
      currencyCharge: "usd",
      status: "PENDING",
      provider: isStripeConfigured() ? "STRIPE" : "DEMO",
      productCode: product.code,
      metadataJson: JSON.stringify(metadata),
    },
  });

  logPaymentEvent("checkout_created", {
    paymentId: payment.id,
    userId: session.user.id,
    productCode,
    provider: payment.provider,
    amountAmd,
  });

  const cardCheckoutUrl = `${origin}/${locale}/checkout/card?paymentId=${payment.id}`;

  // Card checkout: on-site form + ARCA OTP (demo) or Stripe Elements (production)
  if (isDemoModeAllowed() || isStripeConfigured()) {
    return NextResponse.json({
      mode: "card",
      paymentId: payment.id,
      cardCheckoutUrl,
    });
  }

  return NextResponse.json({ error: "provider_not_configured" }, { status: 503 });
}
