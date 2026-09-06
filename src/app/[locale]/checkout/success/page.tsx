import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { verifyStripeCheckoutSession, resolveUnlockInfo } from "@/lib/payments";
import { redirect } from "next/navigation";
import { CheckoutSuccessPoller } from "./CheckoutSuccessPoller";

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

  if (sp.session_id && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await verifyStripeCheckoutSession(stripe, sp.session_id, session.user.id);
        const cs = await stripe.checkout.sessions.retrieve(sp.session_id);
        paymentId =
          (cs.metadata?.paymentId as string | undefined) ||
          cs.client_reference_id ||
          paymentId;
      } catch {
        // webhook may still activate
      }
    }
  }

  const payment = paymentId
    ? await prisma.payment.findFirst({
        where: { id: paymentId, userId: session.user.id },
      })
    : null;

  const unlock = payment
    ? await resolveUnlockInfo(payment, locale)
    : null;

  const unlockLabel = unlock ? t(unlock.labelKey as "success.activated") : undefined;

  return (
    <div className="section">
      <CheckoutSuccessPoller
        initialStatus={payment?.status ?? "PENDING"}
        paymentId={paymentId}
        sessionId={sp.session_id}
        unlockLabel={unlockLabel}
        listingHref={unlock?.listingHref}
        passportHref={unlock?.passportHref}
      />
    </div>
  );
}
