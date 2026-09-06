import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProduct } from "@/lib/pricing";
import {
  getOwnerBankDetails,
  isBankTransferConfigured,
  paymentTransferReference,
} from "@/lib/payments/bank-transfer";

/** GET bank details + payment summary for manual transfer checkout. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isBankTransferConfigured()) {
    return NextResponse.json({ error: "provider_not_configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId")?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (payment.provider !== "BANK_TRANSFER") {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }

  const bank = getOwnerBankDetails();
  if (!bank) {
    return NextResponse.json({ error: "provider_not_configured" }, { status: 503 });
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(payment.metadataJson || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }

  const transferRef =
    payment.providerRef ||
    (typeof meta.transferRef === "string" ? meta.transferRef : null) ||
    paymentTransferReference(payment.id);

  const product = getProduct(payment.productCode);

  return NextResponse.json({
    id: payment.id,
    amountAmd: payment.amountAmd,
    productCode: payment.productCode,
    productName: product?.code ?? payment.productCode,
    status: payment.status,
    transferRef,
    userMarkedPaid: Boolean(meta.userMarkedPaidAt),
    bank: {
      bankName: bank.bankName,
      account: bank.account,
      holder: bank.holder,
      note: bank.note,
      inn: bank.inn ?? null,
      bic: bank.bic ?? null,
    },
  });
}
