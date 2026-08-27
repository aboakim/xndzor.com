import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { activatePayment } from "@/lib/monetization";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 400 });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const body = await req.text();
  const hdrs = await headers();
  const sig = hdrs.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      client_reference_id?: string | null;
      metadata?: { paymentId?: string };
      payment_status?: string;
    };
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
      const paymentId =
        session.metadata?.paymentId || session.client_reference_id || undefined;
      if (paymentId) {
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (payment && payment.status !== "SUCCEEDED") {
          await prisma.payment.update({
            where: { id: paymentId },
            data: { providerRef: session.id },
          });
          await activatePayment(paymentId);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
