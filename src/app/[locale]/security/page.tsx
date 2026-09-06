import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.security");
  const nav = await getTranslations("nav");
  const contact = await getTranslations("pages.contact");

  const tips = t.raw("tips") as {
    icon: string;
    title: string;
    items: string[];
  }[];
  const dataBody = t.raw("dataProtection.body") as string[];

  const mailSubject = encodeURIComponent(t("cta.mailSubject"));
  const mailBody = encodeURIComponent(
    t("cta.mailBody", { email: contact("email") }),
  );
  const mailHref = `mailto:${contact("email")}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="section info-page security-page">
      <Breadcrumbs
        items={[
          { href: "/", label: nav("home") },
          { label: t("title") },
        ]}
      />
      <p className="eyebrow">{t("title")}</p>
      <h1>{t("introTitle")}</h1>
      <p className="lede">{t("introBody")}</p>

      <h2>{t("tipsHeading")}</h2>
      <div className="security-tips-grid">
        {tips.map((tip) => (
          <article key={tip.title} className="security-tip-card">
            <h3>
              <span aria-hidden>{tip.icon}</span> {tip.title}
            </h3>
            <ul>
              {tip.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="security-data-panel">
        <h2>{t("dataProtection.title")}</h2>
        {dataBody.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div className="info-page-actions">
          <Link href="/privacy" className="btn ghost">
            {t("dataProtection.privacyLink")}
          </Link>
          <Link href="/terms" className="btn ghost">
            {t("dataProtection.termsLink")}
          </Link>
        </div>
      </section>

      <section className="security-cta-panel">
        <h2>{t("cta.title")}</h2>
        <p>{t("cta.body")}</p>
        <a href={mailHref} className="btn primary">
          {t("cta.button")}
        </a>
      </section>
    </div>
  );
}
