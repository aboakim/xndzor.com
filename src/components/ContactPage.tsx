import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/navigation";
import { contactMailtoHref, getContactEmail } from "@/lib/contact";

export async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ subject?: string; listing?: string; title?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");
  const navT = await getTranslations("nav");
  const reportT = await getTranslations("reportListing");

  let body: string[] = [];
  try {
    body = t.raw("body") as string[];
  } catch {
    body = [];
  }

  const isReport = query.subject === "report" && query.listing;
  const isSecurity = query.subject === "security";

  const mailSubject = isReport
    ? reportT("mailSubject", { title: query.title ?? query.listing ?? "" })
    : isSecurity
      ? reportT("securityMailSubject")
      : t("mailSubject");

  const mailBody = isReport
    ? reportT("mailBody", {
        listing: query.listing ?? "",
        title: query.title ?? "",
      })
    : isSecurity
      ? reportT("securityMailBody")
      : undefined;

  const mailto = contactMailtoHref(mailSubject, mailBody);

  return (
    <div className="section info-page contact-page">
      <Breadcrumbs
        items={[
          { href: "/", label: navT("home") },
          { label: t("title") },
        ]}
      />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="lede">{t("lede")}</p>

      {isReport ? (
        <div className="contact-prefill-banner">
          <p>{reportT("prefillIntro")}</p>
          {query.title ? <p className="contact-prefill-title">{query.title}</p> : null}
          <p className="muted contact-prefill-url">{query.listing}</p>
        </div>
      ) : null}

      {isSecurity ? (
        <div className="contact-prefill-banner contact-prefill-security">
          <p>{reportT("securityPrefill")}</p>
        </div>
      ) : null}

      <div className="info-page-body">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="info-page-actions">
        <a href={mailto} className="btn primary">
          {t("emailCta")}
        </a>
        <Link href="/security" className="btn ghost">
          {navT("security")}
        </Link>
      </div>

      <p className="info-page-contact">
        <a href={`mailto:${getContactEmail()}`} className="inline-link">
          {getContactEmail()}
        </a>
      </p>
    </div>
  );
}
