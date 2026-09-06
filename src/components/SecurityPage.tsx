import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/navigation";
import { contactMailtoHref, getContactEmail, securityContactQuery } from "@/lib/contact";

type Tip = { icon: string; title: string; items: string[] };

export async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.security");
  const navT = await getTranslations("nav");

  const tips = t.raw("tips") as Tip[];

  const ctaHref = contactMailtoHref(
    t("cta.mailSubject"),
    t("cta.mailBody", { email: getContactEmail() }),
  );

  return (
    <div className="section security-page">
      <Breadcrumbs
        items={[
          { href: "/", label: navT("home") },
          { label: t("title") },
        ]}
      />

      <h1 className="security-title">{t("title")}</h1>

      <div className="security-intro">
        <h2>{t("introTitle")}</h2>
        <p>{t("introBody")}</p>
      </div>

      <h2 className="security-section-heading">{t("tipsHeading")}</h2>

      <div className="security-tips">
        {tips.map((tip) => (
          <article key={tip.title} className="security-tip-card">
            <div className="security-tip-head">
              <span className="security-tip-icon" aria-hidden>
                {tip.icon}
              </span>
              <h3>{tip.title}</h3>
            </div>
            <ul>
              {tip.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <article className="security-data-card">
        <h2>{t("dataProtection.title")}</h2>
        {(t.raw("dataProtection.body") as string[]).map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="security-data-links">
          {t("dataProtection.learnMore")}{" "}
          <Link href="/privacy">{t("dataProtection.privacyLink")}</Link>
          {" · "}
          <Link href="/terms">{t("dataProtection.termsLink")}</Link>
        </p>
      </article>

      <article className="security-cta-card">
        <span className="security-cta-icon" aria-hidden>
          🛡️
        </span>
        <h2>{t("cta.title")}</h2>
        <p>{t("cta.body")}</p>
        <div className="security-cta-actions">
          <Link
            href={{ pathname: "/contact", query: securityContactQuery() }}
            className="btn primary security-cta-btn"
          >
            {t("cta.button")}
          </Link>
          <a href={ctaHref} className="btn ghost security-cta-mail">
            {getContactEmail()}
          </a>
        </div>
      </article>
    </div>
  );
}
