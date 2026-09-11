import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, PRODUCTION_SITE_URL } from "@/lib/seo";
import { resolveSiteUrl } from "@/lib/site-url";
import { MARZES } from "@/lib/places";

/** Sitewide Organization + WebSite (+ SearchAction) JSON-LD for the active locale. */
export async function SiteJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const tRoot = await getTranslations({ locale });
  const site = resolveSiteUrl();
  const home = absoluteUrl(locale, "");

  const areaServed = [
    {
      "@type": "Country",
      name: "Armenia",
    },
    ...MARZES.map((id) => ({
      "@type": "AdministrativeArea",
      name: tRoot(`marzes.${id}` as "marzes.Yerevan"),
      url: absoluteUrl(locale, `/regions/${id}`),
    })),
  ];

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: t("orgName"),
      alternateName: ["Xndzor", "Խնձոր", "xndzor.com"],
      url: site,
      logo: `${PRODUCTION_SITE_URL}/icons/icon-512.png`,
      description: t("orgDescription"),
      areaServed,
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
      areaServed: {
        "@type": "Country",
        name: "Armenia",
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
