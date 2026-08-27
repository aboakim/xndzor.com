import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  amdToUsdCents,
  getProduct,
  isStripeConfigured,
  type BoostTargetType,
  type ProductCode,
} from "@/lib/pricing";
import { assertListingOwnedBy } from "@/lib/monetization";
import { getStripe } from "@/lib/stripe";

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
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const { productCode, locale = "hy", useProQuota } = parsed.data;
  const product = getProduct(productCode);
  if (!product) {
    return NextResponse.json({ error: "unknown_product" }, { status: 400 });
  }

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

  const metadata = {
    productCode,
    userId: session.user.id,
    ...(targetType && targetId ? { targetType, targetId } : {}),
  };

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      amountAmd: product.amountAmd,
      amountCharge: amdToUsdCents(product.amountAmd),
      currencyCharge: "usd",
      status: "PENDING",
      provider: isStripeConfigured() ? "STRIPE" : "DEMO",
      productCode: product.code,
      metadataJson: JSON.stringify(metadata),
    },
  });

  const origin = new URL(req.url).origin;
  const successUrl = `${origin}/${locale}/checkout/success?paymentId=${payment.id}`;
  const cancelUrl = `${origin}/${locale}/checkout/cancel?paymentId=${payment.id}`;

  if (!isStripeConfigured()) {
    return NextResponse.json({
      mode: "demo",
      paymentId: payment.id,
      demoCheckoutUrl: `${origin}/${locale}/checkout/demo?paymentId=${payment.id}`,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "stripe_unavailable" }, { status: 500 });
  }

  const sessionCheckout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amdToUsdCents(product.amountAmd),
          product_data: {
            name: `${product.code} · ${product.amountAmd} AMD`,
            description: `FarmOS · ${product.amountAmd} AMD (charged in USD equivalent)`,
          },
        },
      },
    ],
    success_url: successUrl + "&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: cancelUrl,
    client_reference_id: payment.id,
    metadata: {
      paymentId: payment.id,
      productCode: product.code as ProductCode,
      userId: session.user.id,
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef: sessionCheckout.id },
  });

  return NextResponse.json({
    mode: "stripe",
    paymentId: payment.id,
    url: sessionCheckout.url,
  });
}
