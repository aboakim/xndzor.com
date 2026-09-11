import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, PRODUCTION_SITE_URL } from "@/lib/seo";
import { resolveSiteUrl } from "@/lib/site-url";

/** Sitewide Organization + WebSite (+ SearchAction) JSON-LD for the active locale. */
export async function SiteJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const site = resolveSiteUrl();
  const home = absoluteUrl(locale, "");

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: t("orgName"),
      alternateName: ["Xndzor", "Խնձոր", "xndzor.com"],
      url: site,
      logo: `${PRODUCTION_SITE_URL}/icons/icon-512.png`,
      description: t("orgDescription"),
      areaServed: {
        "@type": "Country",
        name: "Armenia",
      },
      sameAs: [PRODUCTION_SITE_URL],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: t("orgName"),
      alternateName: "Xndzor",
      url: home,
      inLanguage: locale,
      description: t("orgDescription"),
      publisher: {
        "@type": "Organization",
        name: t("orgName"),
        url: site,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${absoluteUrl(locale, "/supply")}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return <JsonLd data={data} />;
}
