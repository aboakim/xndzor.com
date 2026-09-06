import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createOtpForPayment,
  isDemoOtpInResponse,
  maskPhone,
} from "@/lib/payments/card-otp";
import { isDemoModeAllowed } from "@/lib/pricing";
import { logPaymentEvent } from "@/lib/payments";

const bodySchema = z.object({
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
  const limit = rateLimit(`card:resend:${session.user.id}`, {
    limit: 3,
    windowMs: 5 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }
  const ipLimit = rateLimit(`card:resend:ip:${ip}`, {
    limit: 6,
    windowMs: 5 * 60 * 1000,
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

  const { paymentId } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { phone: true } } },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (payment.provider !== "DEMO" || !isDemoModeAllowed()) {
    return NextResponse.json({ error: "resend_not_available" }, { status: 400 });
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "payment_not_pending" }, { status: 400 });
  }

  const userPhone = payment.user.phone;
  if (!userPhone) {
    return NextResponse.json({ error: "phone_required" }, { status: 400 });
  }

  const { otp } = await createOtpForPayment(paymentId);

  logPaymentEvent("card_otp_resent", {
    paymentId,
    userId: session.user.id,
    phone: maskPhone(userPhone),
  });

  console.info(
    `[DEMO] ARCA OTP (resend) for payment ${paymentId} → ${maskPhone(userPhone)}: ${otp}`,
  );

  const response: Record<string, unknown> = {
    ok: true,
    phoneMasked: maskPhone(userPhone),
    expiresInSec: 300,
  };

  if (isDemoOtpInResponse()) {
    response.demoOtp = otp;
  }

  return NextResponse.json(response);
}
