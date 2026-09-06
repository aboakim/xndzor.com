import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  amdToUsdCents,
  getProduct,
  isDemoModeAllowed,
  isRecurringProduct,
  isStripeConfigured,
  type ProductCode,
} from "@/lib/pricing";
import { validateCsrf } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import {
  createOtpForPayment,
  isDemoOtpInResponse,
  maskPhone,
} from "@/lib/payments/card-otp";
import { logPaymentEvent } from "@/lib/payments";

const demoBodySchema = z.object({
  paymentId: z.string().min(1),
  last4: z.string().regex(/^\d{4}$/),
  cardholderName: z.string().min(2).max(80),
  expiryMonth: z.string().regex(/^\d{2}$/),
  expiryYear: z.string().regex(/^\d{2}$/),
  phone: z.string().min(8).max(20).optional(),
});

const stripeBodySchema = z.object({
  paymentId: z.string().min(1),
});

export async function POST(req: Request) {
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limit = rateLimit(`card:initiate:${session.user.id}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }
  const ipLimit = rateLimit(`card:initiate:ip:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const paymentIdRaw = (json as { paymentId?: string })?.paymentId;
  if (!paymentIdRaw) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const paymentPreview = await prisma.payment.findUnique({
    where: { id: paymentIdRaw },
    select: { provider: true, userId: true },
  });

  if (!paymentPreview || paymentPreview.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isStripeFlow =
    paymentPreview.provider === "STRIPE" && isStripeConfigured();
  const parsed = isStripeFlow
    ? stripeBodySchema.safeParse(json)
    : demoBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const paymentId = parsed.data.paymentId;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { phone: true } } },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "payment_not_pending" }, { status: 400 });
  }

  if (payment.provider !== "DEMO" && payment.provider !== "STRIPE") {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }

  // ── Stripe PaymentIntent (production cards) ─────────────────────────────
  if (payment.provider === "STRIPE" && isStripeConfigured()) {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "stripe_unavailable" }, { status: 500 });
    }

    const productCode = payment.productCode as ProductCode;
    const product = getProduct(productCode);
    if (!product) {
      return NextResponse.json({ error: "unknown_product" }, { status: 400 });
    }

    const metadata = JSON.parse(payment.metadataJson || "{}") as Record<string, string>;
    const origin = new URL(req.url).origin;

    if (isRecurringProduct(productCode)) {
      const sessionCheckout = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amdToUsdCents(product.amountAmd),
              recurring: { interval: "month" },
              product_data: {
                name: `${product.code} · ${product.amountAmd} AMD`,
                metadata: { productCode, amountAmd: String(product.amountAmd) },
              },
            },
          },
        ],
        success_url: `${origin}/${metadata.locale || "hy"}/checkout/success?paymentId=${paymentId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/${metadata.locale || "hy"}/checkout/cancel?paymentId=${paymentId}`,
        client_reference_id: paymentId,
        metadata: {
          paymentId,
          productCode,
          userId: session.user.id,
        },
        subscription_data: {
          metadata: { paymentId, productCode, userId: session.user.id },
        },
      });

      await prisma.payment.update({
        where: { id: paymentId },
        data: { providerRef: sessionCheckout.id, stripeSessionId: sessionCheckout.id },
      });

      return NextResponse.json({
        mode: "stripe_checkout",
        url: sessionCheckout.url,
      });
    }

    const intent = await stripe.paymentIntents.create({
      amount: payment.amountCharge ?? amdToUsdCents(product.amountAmd),
      currency: payment.currencyCharge || "usd",
      metadata: {
        paymentId,
        productCode,
        userId: session.user.id,
      },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { providerRef: intent.id },
    });

    logPaymentEvent("card_intent_created", {
      paymentId,
      userId: session.user.id,
      provider: "STRIPE",
    });

    return NextResponse.json({
      mode: "stripe",
      clientSecret: intent.client_secret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  }

  // ── Demo mode: simulated ARCA SMS OTP ───────────────────────────────────
  if (!isDemoModeAllowed() && payment.provider === "DEMO") {
    return NextResponse.json({ error: "demo_disabled" }, { status: 400 });
  }

  const demoData = parsed.data as z.infer<typeof demoBodySchema>;
  const { last4, cardholderName, expiryMonth, expiryYear, phone } = demoData;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { cardLast4: last4, cardholderName: cardholderName.trim() },
  });

  const userPhone = phone?.trim() || payment.user.phone;
  if (!userPhone) {
    return NextResponse.json({ error: "phone_required" }, { status: 400 });
  }

  if (phone && phone !== payment.user.phone) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: phone.trim() },
    });
  }

  const { otp } = await createOtpForPayment(paymentId);

  logPaymentEvent("card_otp_sent", {
    paymentId,
    userId: session.user.id,
    phone: maskPhone(userPhone),
    provider: "DEMO",
  });

  console.info(
    `[DEMO] ARCA OTP for payment ${paymentId} → ${maskPhone(userPhone)}: ${otp}`,
  );

  const response: Record<string, unknown> = {
    mode: "otp",
    phoneMasked: maskPhone(userPhone),
    expiresInSec: 300,
  };

  if (isDemoOtpInResponse()) {
    response.demoOtp = otp;
  }

  return NextResponse.json(response);
}
