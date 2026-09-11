import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { MARZES } from "@/lib/places";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { seoMessagesMetadata } from "@/lib/seo-metadata";
import { marzRegionPath } from "@/lib/marz-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/regions", "regions");
}

export default async function RegionsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const items = MARZES.map((id) => ({
    id,
    href: marzRegionPath(id),
    label: t(`marzes.${id}` as "marzes.Yerevan"),
  }));

  return (
    <div className="section page-board">
      <JsonLd
        data={[
          breadcrumbJsonLd(locale, [
            { href: "/", label: t("nav.home") },
            { label: t("regions.title") },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: t("regions.title"),
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.label,
              url: absoluteUrl(locale, item.href),
            })),
          },
        ]}
      />

      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("regions.title") },
        ]}
      />

      <div className="section-head">
        <div>
          <h1>{t("regions.title")}</h1>
          <p className="lede">{t("regions.lede")}</p>
        </div>
      </div>

      <nav className="region-link-grid" aria-label={t("regions.title")}>
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="region-link-card">
            <strong>{item.label}</strong>
            <span>{t("regions.openMarz")}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
