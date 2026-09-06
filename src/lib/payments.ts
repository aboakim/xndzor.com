import type Stripe from "stripe";
import { prisma } from "./prisma";
import {
  amdToUsdCents,
  getProduct,
  type BoostTargetType,
  type PricingProduct,
  type ProductCode,
} from "./pricing";

export type FulfillResult = "activated" | "already" | "not_found" | "invalid_product";

export type UnlockInfo = {
  kind: PricingProduct["kind"];
  productCode: string;
  labelKey: string;
  listingHref: string | null;
  passportHref: string | null;
};

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function extendFrom(current: Date | null | undefined, days: number): Date {
  const base = current && current.getTime() > Date.now() ? current : new Date();
  return addDays(base, days);
}

export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date {
  const ends = sub.items?.data?.map((item) => item.current_period_end) ?? [];
  const maxEnd = ends.length ? Math.max(...ends) : 0;
  if (maxEnd > 0) return new Date(maxEnd * 1000);
  return addDays(new Date(sub.billing_cycle_anchor * 1000), 30);
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  if (parentSub && typeof parentSub === "object" && "id" in parentSub) {
    return parentSub.id;
  }
  return undefined;
}

export function logPaymentEvent(
  event: string,
  data: Record<string, string | number | boolean | null | undefined>,
): void {
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      scope: "payments",
      event,
      ...data,
    }),
  );
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "—";
  const [local, domain] = email.split("@");
  const masked =
    local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
  return `${masked}@${domain}`;
}

async function grantEntitlements(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  payment: { id: string; userId: string; productCode: string; metadataJson: string },
  product: PricingProduct,
  opts?: { stripeSubscriptionId?: string; stripeCustomerId?: string; periodEnd?: Date },
): Promise<void> {
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(payment.metadataJson || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }

  if (product.kind === "FARM_PRO") {
    const user = await tx.user.findUnique({ where: { id: payment.userId } });
    const until = opts?.periodEnd ?? extendFrom(user?.proUntil, product.periodDays);
    await tx.user.update({
      where: { id: payment.userId },
      data: { isPro: true, proUntil: until },
    });
    if (opts?.stripeSubscriptionId) {
      const existing = await tx.subscription.findFirst({
        where: { stripeSubscriptionId: opts.stripeSubscriptionId },
      });
      if (existing) {
        await tx.subscription.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: until,
            planCode: product.code,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            userId: payment.userId,
            planCode: product.code,
            status: "ACTIVE",
            currentPeriodEnd: until,
            stripeSubscriptionId: opts.stripeSubscriptionId,
            stripeCustomerId: opts.stripeCustomerId,
          },
        });
      }
    } else {
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          planCode: product.code,
          status: "ACTIVE",
          currentPeriodEnd: until,
        },
      });
    }
  } else if (product.kind === "BUYER_PRO") {
    const user = await tx.user.findUnique({ where: { id: payment.userId } });
    const until = opts?.periodEnd ?? extendFrom(user?.buyerProUntil, product.periodDays);
    await tx.user.update({
      where: { id: payment.userId },
      data: { buyerProUntil: until },
    });
    if (opts?.stripeSubscriptionId) {
      const existing = await tx.subscription.findFirst({
        where: { stripeSubscriptionId: opts.stripeSubscriptionId },
      });
      if (existing) {
        await tx.subscription.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: until,
            planCode: product.code,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            userId: payment.userId,
            planCode: product.code,
            status: "ACTIVE",
            currentPeriodEnd: until,
            stripeSubscriptionId: opts.stripeSubscriptionId,
            stripeCustomerId: opts.stripeCustomerId,
          },
        });
      }
    } else {
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          planCode: product.code,
          status: "ACTIVE",
          currentPeriodEnd: until,
        },
      });
    }
  } else if (product.kind === "VERIFIED_FARM") {
    const until = opts?.periodEnd ?? addDays(new Date(), product.periodDays);
    await tx.user.update({
      where: { id: payment.userId },
      data: {
        isVerifiedPaid: true,
        verifiedPaidUntil: until,
        farmVerified: true,
      },
    });
    await tx.subscription.create({
      data: {
        userId: payment.userId,
        planCode: product.code,
        status: "ACTIVE",
        currentPeriodEnd: until,
        stripeSubscriptionId: opts?.stripeSubscriptionId,
        stripeCustomerId: opts?.stripeCustomerId,
      },
    });
  } else if (product.kind === "BOOST") {
    const targetType = String(meta.targetType || "") as BoostTargetType;
    const targetId = String(meta.targetId || "");
    if (targetType && targetId) {
      const existingBoost = await tx.boost.findFirst({
        where: { paymentId: payment.id },
      });
      if (!existingBoost) {
        const endsAt = addDays(new Date(), product.periodDays);
        await tx.boost.create({
          data: {
            userId: payment.userId,
            targetType,
            targetId,
            days: product.periodDays,
            endsAt,
            source: "PAID",
            paymentId: payment.id,
          },
        });
      }
    }
  }
}

/**
 * Idempotent fulfillment — safe for webhook retries and success-page backup.
 */
export async function fulfillPayment(
  paymentId: string,
  opts?: {
    stripeSessionId?: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    periodEnd?: Date;
  },
): Promise<FulfillResult> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return "not_found";
  if (payment.status === "SUCCEEDED") return "already";

  const product = getProduct(payment.productCode);
  if (!product) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED" },
    });
    logPaymentEvent("fulfill_invalid_product", { paymentId, productCode: payment.productCode });
    return "invalid_product";
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: { not: "SUCCEEDED" } },
        data: {
          status: "SUCCEEDED",
          ...(opts?.stripeSessionId ? { stripeSessionId: opts.stripeSessionId } : {}),
          ...(opts?.stripeSessionId ? { providerRef: opts.stripeSessionId } : {}),
        },
      });
      if (claimed.count === 0) return;

      await grantEntitlements(tx, payment, product, opts);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("Unique constraint") && opts?.stripeSessionId) {
      logPaymentEvent("fulfill_idempotent_session", { paymentId, stripeSessionId: opts.stripeSessionId });
      return "already";
    }
    throw err;
  }

  const refreshed = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (refreshed?.status === "SUCCEEDED") {
    logPaymentEvent("fulfill_activated", {
      paymentId,
      userId: payment.userId,
      productCode: payment.productCode,
      stripeSessionId: opts?.stripeSessionId ?? null,
    });
    return "activated";
  }
  return "already";
}

export async function markPaymentFailed(paymentId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING" },
    data: { status: "FAILED" },
  });
  logPaymentEvent("payment_failed", { paymentId });
}

export async function markPaymentCanceled(paymentId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING" },
    data: { status: "CANCELED" },
  });
  logPaymentEvent("payment_canceled", { paymentId });
}

/** Server-side Stripe session verify (success page backup). */
export async function verifyStripeCheckoutSession(
  stripe: Stripe,
  sessionId: string,
  userId: string,
): Promise<FulfillResult> {
  const cs = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const paymentId =
    (cs.metadata?.paymentId as string | undefined) ||
    cs.client_reference_id ||
    undefined;
  if (!paymentId) return "not_found";

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== userId) return "not_found";

  if (cs.payment_status !== "paid" && cs.status !== "complete") {
    return "not_found";
  }

  let stripeSubscriptionId: string | undefined;
  let periodEnd: Date | undefined;
  if (cs.subscription) {
    const subId =
      typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id;
    stripeSubscriptionId = subId;
    const sub = await stripe.subscriptions.retrieve(subId);
    periodEnd = subscriptionPeriodEnd(sub);
  }

  return fulfillPayment(paymentId, {
    stripeSessionId: cs.id,
    stripeSubscriptionId,
    stripeCustomerId:
      typeof cs.customer === "string" ? cs.customer : cs.customer?.id,
    periodEnd,
  });
}

export async function resolveUnlockInfo(
  payment: {
    productCode: string;
    metadataJson: string;
    userId: string;
  },
  locale: string,
): Promise<UnlockInfo | null> {
  const product = getProduct(payment.productCode);
  if (!product) return null;

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(payment.metadataJson || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }

  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: { farmId: true },
  });

  let listingHref: string | null = null;
  const targetType = String(meta.targetType || "") as BoostTargetType;
  const targetId = String(meta.targetId || "");

  if (product.kind === "BOOST" && targetType && targetId) {
    listingHref = await listingPathForTarget(targetType, targetId, locale);
  }

  const passportHref = user?.farmId ? `/${locale}/farms/${user.farmId}` : null;

  const labelKeys: Record<PricingProduct["kind"], string> = {
    FARM_PRO: "pricing.success.unlockedFarmPro",
    BUYER_PRO: "pricing.success.unlockedBuyerPro",
    VERIFIED_FARM: "pricing.success.unlockedVerified",
    BOOST: "pricing.success.unlockedBoost",
  };

  return {
    kind: product.kind,
    productCode: product.code,
    labelKey: labelKeys[product.kind],
    listingHref,
    passportHref,
  };
}

async function listingPathForTarget(
  targetType: BoostTargetType,
  targetId: string,
  locale: string,
): Promise<string | null> {
  switch (targetType) {
    case "MACHINERY":
      return `/${locale}/machinery/${targetId}`;
    case "ANIMAL":
      return `/${locale}/animals/${targetId}`;
    case "SUPPLY":
      return `/${locale}/supply/${targetId}`;
    case "FUTURE_HARVEST":
      return `/${locale}/forward/${targetId}`;
    case "CATALOG": {
      const row = await prisma.catalogListing.findUnique({
        where: { id: targetId },
        select: { category: true },
      });
      if (!row) return null;
      return `/${locale}/shop/${row.category}/${targetId}`;
    }
    default:
      return null;
  }
}

export async function syncSubscriptionFromStripe(
  stripeSub: Stripe.Subscription,
): Promise<void> {
  const paymentId = stripeSub.metadata?.paymentId;
  const productCode = stripeSub.metadata?.productCode as ProductCode | undefined;
  const userId = stripeSub.metadata?.userId;
  if (!userId || !productCode) return;

  const product = getProduct(productCode);
  if (!product) return;

  const periodEnd = subscriptionPeriodEnd(stripeSub);
  const status =
    stripeSub.status === "active" || stripeSub.status === "trialing"
      ? "ACTIVE"
      : stripeSub.status === "past_due"
        ? "PAST_DUE"
        : stripeSub.status === "canceled"
          ? "CANCELED"
          : "EXPIRED";

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSub.id },
    });
    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: { status, currentPeriodEnd: periodEnd, planCode: productCode },
      });
    } else {
      await tx.subscription.create({
        data: {
          userId,
          planCode: productCode,
          status,
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: stripeSub.id,
          stripeCustomerId:
            typeof stripeSub.customer === "string"
              ? stripeSub.customer
              : stripeSub.customer?.id,
        },
      });
    }

    if (status === "ACTIVE") {
      if (product.kind === "FARM_PRO") {
        await tx.user.update({
          where: { id: userId },
          data: { isPro: true, proUntil: periodEnd },
        });
      } else if (product.kind === "BUYER_PRO") {
        await tx.user.update({
          where: { id: userId },
          data: { buyerProUntil: periodEnd },
        });
      }
    }

    if (paymentId && stripeSub.status === "active") {
      await fulfillPayment(paymentId, {
        stripeSubscriptionId: stripeSub.id,
        stripeCustomerId:
          typeof stripeSub.customer === "string"
            ? stripeSub.customer
            : stripeSub.customer?.id,
        periodEnd,
      });
    }
  });

  logPaymentEvent("subscription_synced", {
    stripeSubscriptionId: stripeSub.id,
    userId,
    productCode,
    status,
  });
}

export async function recordRenewalInvoice(
  invoice: Stripe.Invoice,
  stripe: Stripe,
): Promise<void> {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId || invoice.status !== "paid") return;

  const sub = await stripe.subscriptions.retrieve(subId);
  await syncSubscriptionFromStripe(sub);

  const productCode = sub.metadata?.productCode as ProductCode | undefined;
  const userId = sub.metadata?.userId;
  if (!userId || !productCode) return;

  const product = getProduct(productCode);
  if (!product) return;

  const invoiceId = invoice.id;
  const existing = await prisma.payment.findFirst({
    where: { providerRef: invoiceId },
  });
  if (existing) return;

  await prisma.payment.create({
    data: {
      userId,
      amountAmd: product.amountAmd,
      amountCharge: invoice.amount_paid ?? amdToUsdCents(product.amountAmd),
      currencyCharge: invoice.currency || "usd",
      status: "SUCCEEDED",
      provider: "STRIPE",
      providerRef: invoiceId,
      productCode,
      metadataJson: JSON.stringify({
        type: "renewal",
        stripeSubscriptionId: subId,
        stripeInvoiceId: invoiceId,
      }),
    },
  });

  logPaymentEvent("renewal_recorded", {
    userId,
    productCode,
    invoiceId,
    stripeSubscriptionId: subId,
  });
}

export { addDays, extendFrom };
