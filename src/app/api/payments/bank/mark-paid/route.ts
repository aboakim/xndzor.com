import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logPaymentEvent } from "@/lib/payments";

const bodySchema = z.object({
  paymentId: z.string().min(1),
});

/**
 * User confirms they completed the bank transfer.
 * Payment stays PENDING until an admin verifies and activates.
 */
export async function POST(req: Request) {
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limit = rateLimit(`bank-mark-paid:${session.user.id}:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
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

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.paymentId },
  });
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (payment.provider !== "BANK_TRANSFER") {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }
  if (payment.status === "SUCCEEDED") {
    return NextResponse.json({ ok: true, status: "SUCCEEDED", already: true });
  }
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(payment.metadataJson || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }

  const now = new Date().toISOString();
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      metadataJson: JSON.stringify({
        ...meta,
        userMarkedPaidAt: meta.userMarkedPaidAt || now,
        userMarkedPaidAtLatest: now,
      }),
    },
  });

  logPaymentEvent("bank_user_marked_paid", {
    paymentId: payment.id,
    userId: session.user.id,
    amountAmd: payment.amountAmd,
  });

  return NextResponse.json({ ok: true, status: "PENDING", awaitingAdmin: true });
}
