import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProduct } from "@/lib/pricing";

/** GET payment summary for card checkout page (no secrets). */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId")?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { phone: true } } },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const product = getProduct(payment.productCode);

  return NextResponse.json({
    id: payment.id,
    amountAmd: payment.amountAmd,
    productCode: payment.productCode,
    productName: product?.code ?? payment.productCode,
    provider: payment.provider,
    status: payment.status,
    phone: payment.user.phone,
    cardLast4: payment.cardLast4,
  });
}
