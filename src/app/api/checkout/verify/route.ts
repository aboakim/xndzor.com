import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { verifyStripeCheckoutSession } from "@/lib/payments";

/** Poll-friendly session verification (backup when webhook is delayed). */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id")?.trim();
  const paymentId = url.searchParams.get("paymentId")?.trim();

  if (sessionId && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const result = await verifyStripeCheckoutSession(
          stripe,
          sessionId,
          session.user.id,
        );
        const payment = await prisma.payment.findFirst({
          where: {
            userId: session.user.id,
            OR: [{ stripeSessionId: sessionId }, { id: paymentId || "" }],
          },
        });
        return NextResponse.json({
          status: payment?.status ?? "PENDING",
          result,
          paymentId: payment?.id ?? null,
        });
      } catch {
        return NextResponse.json({ error: "verify_failed" }, { status: 502 });
      }
    }
  }

  if (paymentId) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
    });
    if (!payment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      status: payment.status,
      paymentId: payment.id,
    });
  }

  return NextResponse.json({ error: "session_id_or_paymentId_required" }, { status: 400 });
}
