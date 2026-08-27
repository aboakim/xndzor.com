import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

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
