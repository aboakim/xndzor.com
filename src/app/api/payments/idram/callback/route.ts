import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyIdramPaymentChecksum,
  verifyIdramPrecheck,
  type IdramCallbackParams,
} from "@/lib/payments/idram";
import { fulfillPayment, logPaymentEvent, markPaymentFailed } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function parseCallbackParams(req: Request): Promise<IdramCallbackParams> {
  const out: IdramCallbackParams = {};
  const url = new URL(req.url);
  for (const [key, value] of url.searchParams.entries()) {
    (out as Record<string, string>)[key] = value;
  }
  if (req.method === "POST") {
    try {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const body = await req.text();
        for (const pair of body.split("&")) {
          const [k, v] = pair.split("=");
          if (k) (out as Record<string, string>)[decodeURIComponent(k)] = decodeURIComponent(v || "");
        }
      } else if (ct.includes("multipart/form-data")) {
        const form = await req.formData();
        for (const [key, value] of form.entries()) {
          if (typeof value === "string") (out as Record<string, string>)[key] = value;
        }
      }
    } catch {
      /* ignore parse errors */
    }
  }
  return out;
}

async function handleCallback(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`idram:callback:${ip}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!limit.ok) {
    return new NextResponse("RATE_LIMITED", { status: 429 });
  }

  const params = await parseCallbackParams(req);

  // (a) Order authenticity precheck — respond OK if bill exists and amount matches
  if (params.EDP_PRECHECK === "YES") {
    const pre = verifyIdramPrecheck(params);
    if (!pre.ok || !pre.billNo) {
      logPaymentEvent("idram_precheck_rejected", { billNo: params.EDP_BILL_NO ?? null });
      return new NextResponse("", { status: 400 });
    }
    const payment = await prisma.payment.findUnique({ where: { id: pre.billNo } });
    if (!payment || payment.provider !== "IDRAM" || payment.status !== "PENDING") {
      return new NextResponse("", { status: 400 });
    }
    const expected = payment.amountAmd.toFixed(2);
    if (params.EDP_AMOUNT && params.EDP_AMOUNT !== expected) {
      logPaymentEvent("idram_precheck_amount_mismatch", {
        paymentId: payment.id,
        expected,
        got: params.EDP_AMOUNT,
      });
      return new NextResponse("", { status: 400 });
    }
    logPaymentEvent("idram_precheck_ok", { paymentId: payment.id });
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // (b) Payment confirmation — verify checksum, fulfill entitlements
  if (!params.EDP_BILL_NO || !params.EDP_TRANS_ID) {
    return new NextResponse("", { status: 400 });
  }

  if (!verifyIdramPaymentChecksum(params)) {
    logPaymentEvent("idram_checksum_invalid", {
      billNo: params.EDP_BILL_NO,
      transId: params.EDP_TRANS_ID,
    });
    return new NextResponse("", { status: 400 });
  }

  const paymentId = params.EDP_BILL_NO.trim();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.provider !== "IDRAM") {
    return new NextResponse("", { status: 404 });
  }

  if (payment.status === "SUCCEEDED") {
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const expected = payment.amountAmd.toFixed(2);
  if (params.EDP_AMOUNT && params.EDP_AMOUNT !== expected) {
    logPaymentEvent("idram_amount_mismatch", { paymentId, expected, got: params.EDP_AMOUNT });
    return new NextResponse("", { status: 400 });
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { providerRef: params.EDP_TRANS_ID },
  });

  const result = await fulfillPayment(paymentId);
  logPaymentEvent("idram_payment_confirmed", {
    paymentId,
    transId: params.EDP_TRANS_ID,
    result,
  });

  if (result === "invalid_product" || result === "not_found") {
    await markPaymentFailed(paymentId);
    return new NextResponse("", { status: 400 });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  return handleCallback(req);
}

export async function POST(req: Request) {
  return handleCallback(req);
}
