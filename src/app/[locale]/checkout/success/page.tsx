import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { activatePayment } from "@/lib/monetization";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paymentId?: string; session_id?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  let paymentId = sp.paymentId || "";

  // Stripe return: ensure activation even if webhook is delayed (test mode)
  if (sp.session_id && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const cs = await stripe.checkout.sessions.retrieve(sp.session_id);
        const pid =
          (cs.metadata?.paymentId as string | undefined) ||
          cs.client_reference_id ||
          paymentId;
        if (pid && (cs.payment_status === "paid" || cs.status === "complete")) {
          paymentId = pid;
          const payment = await prisma.payment.findUnique({ where: { id: pid } });
          if (payment && payment.userId === session.user.id && payment.status !== "SUCCEEDED") {
            await activatePayment(pid);
          }
        }
      } catch {
        // ignore retrieve errors; webhook may still activate
      }
    }
  }

  const payment = paymentId
    ? await prisma.payment.findFirst({
        where: { id: paymentId, userId: session.user.id },
      })
    : null;

  return (
    <div className="section checkout-result-page">
      <p className="eyebrow">{t("success.eyebrow")}</p>
      <h1>{t("success.title")}</h1>
      <p className="lede">
        {payment?.status === "SUCCEEDED"
          ? t("success.activated")
          : t("success.pending")}
      </p>
      <div className="pricing-actions">
        <Link href="/account/billing" className="btn primary">
          {t("myBilling")}
        </Link>
        <Link href="/pricing" className="btn ghost">
          {t("title")}
        </Link>
      </div>
    </div>
  );
}
