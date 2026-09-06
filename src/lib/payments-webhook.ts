import type Stripe from "stripe";
import { prisma } from "./prisma";
import {
  fulfillPayment,
  invoiceSubscriptionId,
  logPaymentEvent,
  markPaymentFailed,
  recordRenewalInvoice,
  subscriptionPeriodEnd,
  syncSubscriptionFromStripe,
} from "./payments";

type SessionObject = Stripe.Checkout.Session;

function paymentIdFromSession(session: SessionObject): string | undefined {
  return (
    (session.metadata?.paymentId as string | undefined) ||
    session.client_reference_id ||
    undefined
  );
}

export async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  session: SessionObject,
): Promise<void> {
  const paymentId = paymentIdFromSession(session);
  if (!paymentId) {
    logPaymentEvent("webhook_session_no_payment", { sessionId: session.id });
    return;
  }

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    logPaymentEvent("webhook_session_unpaid", {
      sessionId: session.id,
      paymentId,
      paymentStatus: session.payment_status ?? "unknown",
    });
    return;
  }

  let stripeSubscriptionId: string | undefined;
  let periodEnd: Date | undefined;
  if (session.subscription) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    stripeSubscriptionId = subId;
    const sub = await stripe.subscriptions.retrieve(subId);
    periodEnd = subscriptionPeriodEnd(sub);
  }

  const result = await fulfillPayment(paymentId, {
    stripeSessionId: session.id,
    stripeSubscriptionId,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id,
    periodEnd,
  });

  logPaymentEvent("webhook_checkout_completed", {
    sessionId: session.id,
    paymentId,
    result,
  });
}

export async function handlePaymentIntentSucceeded(
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const paymentId = intent.metadata?.paymentId;
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "SUCCEEDED") return;

  const result = await fulfillPayment(paymentId, {
    stripeSessionId: payment.stripeSessionId ?? undefined,
  });

  logPaymentEvent("webhook_payment_intent_succeeded", {
    paymentIntentId: intent.id,
    paymentId,
    result,
  });
}

export async function handleSubscriptionEvent(
  sub: Stripe.Subscription,
  eventType: string,
): Promise<void> {
  if (eventType === "customer.subscription.deleted") {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { status: "CANCELED" },
    });
    logPaymentEvent("webhook_subscription_deleted", {
      stripeSubscriptionId: sub.id,
    });
    return;
  }

  await syncSubscriptionFromStripe(sub);
  logPaymentEvent("webhook_subscription_updated", {
    stripeSubscriptionId: sub.id,
    eventType,
    status: sub.status,
  });
}

export async function handleInvoicePaid(
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<void> {
  if (invoice.billing_reason === "subscription_cycle") {
    await recordRenewalInvoice(invoice, stripe);
  } else if (invoice.billing_reason === "subscription_create") {
    const subId = invoiceSubscriptionId(invoice);
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscriptionFromStripe(sub);
    }
  }

  logPaymentEvent("webhook_invoice_paid", {
    invoiceId: invoice.id,
    billingReason: invoice.billing_reason ?? "unknown",
  });
}

export async function handlePaymentIntentFailed(
  intent: Stripe.PaymentIntent,
): Promise<void> {
  const paymentId = intent.metadata?.paymentId;
  if (!paymentId) return;
  await markPaymentFailed(paymentId);
  logPaymentEvent("webhook_payment_intent_failed", {
    paymentIntentId: intent.id,
    paymentId,
  });
}
