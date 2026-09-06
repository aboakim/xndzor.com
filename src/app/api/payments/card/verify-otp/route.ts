import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyOtpForPayment } from "@/lib/payments/card-otp";
import { fulfillPayment, logPaymentEvent } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/pricing";

const bodySchema = z.object({
  paymentId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/).optional(),
  /** Set after Stripe confirmCardPayment succeeds (one-time payments) */
  stripeConfirmed: z.boolean().optional(),
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
  const limit = rateLimit(`card:verify:${session.user.id}`, {
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }
  const ipLimit = rateLimit(`card:verify:ip:${ip}`, {
    limit: 30,
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { paymentId, otp, stripeConfirmed } = parsed.data;

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (payment.status === "SUCCEEDED") {
    return NextResponse.json({ ok: true, already: true });
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "payment_not_pending" }, { status: 400 });
  }

  // ── Stripe: verify PaymentIntent succeeded ──────────────────────────────
  if (payment.provider === "STRIPE" && stripeConfirmed && payment.providerRef) {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });
    }
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "stripe_unavailable" }, { status: 500 });
    }

    const intent = await stripe.paymentIntents.retrieve(payment.providerRef);
    if (intent.status !== "succeeded") {
      return NextResponse.json({ error: "stripe_not_succeeded" }, { status: 400 });
    }

    const result = await fulfillPayment(paymentId, {
      stripeSessionId: intent.id,
    });
    logPaymentEvent("card_stripe_confirmed", { paymentId, userId: session.user.id });
    return NextResponse.json({ ok: true, result });
  }

  // ── Demo: verify ARCA OTP ───────────────────────────────────────────────
  if (payment.provider !== "DEMO") {
    return NextResponse.json({ error: "otp_required" }, { status: 400 });
  }

  if (!otp) {
    return NextResponse.json({ error: "otp_required" }, { status: 400 });
  }

  const verify = await verifyOtpForPayment(paymentId, otp);
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: 400 });
  }

  const result = await fulfillPayment(paymentId);
  logPaymentEvent("card_otp_verified", { paymentId, userId: session.user.id });

  await prisma.otpVerification.deleteMany({ where: { paymentId } });

  return NextResponse.json({ ok: true, result });
}
