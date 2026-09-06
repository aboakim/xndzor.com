import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  decodeTelcellIssuerId,
  verifyTelcellCallbackChecksum,
  type TelcellCallbackParams,
} from "@/lib/payments/telcell";
import { fulfillPayment, logPaymentEvent, markPaymentFailed } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function parseCallbackBody(req: Request): Promise<TelcellCallbackParams> {
  const out: TelcellCallbackParams = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const body = await req.text();
      for (const pair of body.split("&")) {
        const [k, v] = pair.split("=");
        if (k) (out as Record<string, string>)[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
    } else {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") (out as Record<string, string>)[key] = value;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`telcell:callback:${ip}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!limit.ok) {
    return new NextResponse("RATE_LIMITED", { status: 429 });
  }

  const params = await parseCallbackBody(req);

  if (!verifyTelcellCallbackChecksum(params)) {
    logPaymentEvent("telcell_checksum_invalid", {
      invoice: params.invoice ?? null,
      status: params.status ?? null,
    });
    return new NextResponse("", { status: 400 });
  }

  const paymentId = params.issuer_id
    ? decodeTelcellIssuerId(params.issuer_id)
    : "";
  if (!paymentId) {
    return new NextResponse("", { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.provider !== "TELCELL") {
    return new NextResponse("", { status: 404 });
  }

  if (params.status === "REJECTED") {
    await markPaymentFailed(paymentId);
    logPaymentEvent("telcell_payment_rejected", { paymentId });
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (params.status !== "PAID") {
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const expectedSum = payment.amountAmd.toFixed(2);
  if (params.sum && params.sum !== expectedSum && params.sum !== String(payment.amountAmd)) {
    logPaymentEvent("telcell_amount_mismatch", {
      paymentId,
      expected: expectedSum,
      got: params.sum,
    });
    return new NextResponse("", { status: 400 });
  }

  if (payment.status !== "SUCCEEDED") {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerRef: params.payment_id || params.invoice || payment.providerRef,
      },
    });
    const result = await fulfillPayment(paymentId);
    logPaymentEvent("telcell_payment_confirmed", {
      paymentId,
      invoice: params.invoice ?? null,
      result,
    });
    if (result === "invalid_product" || result === "not_found") {
      await markPaymentFailed(paymentId);
      return new NextResponse("", { status: 400 });
    }
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
