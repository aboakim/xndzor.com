import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { markPaymentCanceled } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function CheckoutCancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  const session = await getSession();
  if (sp.paymentId && session?.user?.id) {
    const payment = await prisma.payment.findFirst({
      where: { id: sp.paymentId, userId: session.user.id, status: "PENDING" },
    });
    if (payment) {
      await markPaymentCanceled(payment.id);
    }
  }

  return (
    <div className="section checkout-result-page">
      <p className="eyebrow">{t("cancel.eyebrow")}</p>
      <h1>{t("cancel.title")}</h1>
      <p className="lede">{t("cancel.lede")}</p>
      <div className="pricing-actions">
        <Link href="/pricing" className="btn primary">
          {t("title")}
        </Link>
        <Link href="/" className="btn ghost">
          {t("cancel.home")}
        </Link>
      </div>
    </div>
  );
}
