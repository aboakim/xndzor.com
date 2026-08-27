import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { activatePayment } from "@/lib/monetization";
import { isStripeConfigured } from "@/lib/pricing";

/** Demo checkout: simulates successful payment when Stripe keys are absent. */
export async function POST(req: Request) {
  if (isStripeConfigured()) {
    return NextResponse.json(
      { error: "demo_disabled_when_stripe_configured" },
      { status: 400 },
    );
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let paymentId = "";
  try {
    const body = (await req.json()) as { paymentId?: string };
    paymentId = String(body.paymentId || "");
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (payment.provider !== "DEMO") {
    return NextResponse.json({ error: "not_demo" }, { status: 400 });
  }
  if (payment.status === "SUCCEEDED") {
    return NextResponse.json({ ok: true, already: true });
  }

  await activatePayment(payment.id);
  return NextResponse.json({ ok: true });
}
