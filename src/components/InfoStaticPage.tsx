import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/navigation";

type PageKey = "about" | "help" | "contact" | "terms" | "privacy" | "security";

export async function InfoStaticPage({
  params,
  pageKey,
}: {
  params: Promise<{ locale: string }>;
  pageKey: PageKey;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(`pages.${pageKey}`);
  const nav = await getTranslations("footer");
  const navT = await getTranslations("nav");

  let body: string[] = [];
  try {
    body = t.raw("body") as string[];
  } catch {
    body = [];
  }

  return (
    <div className="section info-page">
      <Breadcrumbs
        items={[
          { href: "/", label: navT("home") },
          { label: t("title") },
        ]}
      />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1>{t("title")}</h1>
      <p className="lede">{t("lede")}</p>
      <div className="info-page-body">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {pageKey === "help" ? (
        <div className="info-page-actions">
          <Link href="/contact" className="btn primary">
            {nav("contact")}
          </Link>
          <Link href="/pricing" className="btn ghost">
            {navT("pricing")}
          </Link>
        </div>
      ) : null}
      {pageKey === "contact" && t.has("email") ? (
        <p className="info-page-contact">
          <a href={`mailto:${t("email")}`} className="inline-link">
            {t("email")}
          </a>
        </p>
      ) : null}
    </div>
  );
}
