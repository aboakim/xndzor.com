import type { Metadata } from "next";
import { resolveSiteUrl, PRODUCTION_SITE_URL } from "@/lib/site-url";
import { routing } from "@/i18n/routing";

export { PRODUCTION_SITE_URL, resolveSiteUrl };

export const OG_IMAGE = {
  url: `${PRODUCTION_SITE_URL}/og-v4.png`,
  width: 1200,
  height: 630,
  alt: "Խնձոր — Xndzor",
  type: "image/png" as const,
};

const OG_LOCALE: Record<string, string> = {
  hy: "hy_AM",
  ru: "ru_RU",
  en: "en_US",
};

/** Path without locale prefix. Empty string = locale home. Leading slash optional. */
export function normalizePath(path = ""): string {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(locale: string, path = ""): string {
  const site = resolveSiteUrl();
  const p = normalizePath(path);
  return `${site}/${locale}${p}`;
}

/** hreflang map for a path (same path across locales + x-default → hy). */
export function languageAlternates(path = ""): Record<string, string> {
  const site = resolveSiteUrl();
  const p = normalizePath(path);
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${site}/${locale}${p}`;
  }
  languages["x-default"] = `${site}/hy${p}`;
  return languages;
}

export type BuildPageMetadataInput = {
  locale: string;
  /** Path without locale, e.g. `/supply` or `/supply/abc`. */
  path?: string;
  title: string;
  description: string;
  /** Absolute or site-relative image URL(s). Falls back to default OG. */
  images?: string | string[] | null;
  noIndex?: boolean;
  ogType?: "website" | "article";
};

function toOgImages(images?: string | string[] | null) {
  const list = (Array.isArray(images) ? images : images ? [images] : []).filter(Boolean);
  if (list.length === 0) return [OG_IMAGE];
  const site = resolveSiteUrl();
  return list.slice(0, 4).map((src) => {
    const url = src.startsWith("http") ? src : `${site}${src.startsWith("/") ? src : `/${src}`}`;
    return { url, width: 1200, height: 630, alt: OG_IMAGE.alt };
  });
}

/**
 * Shared page metadata: unique title/description, canonical, hreflang,
 * Open Graph + Twitter, optional noindex.
 */
export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  images,
  noIndex = false,
  ogType = "website",
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(locale, path);
  const ogImages = toOgImages(images);
  const desc = description.slice(0, 320);

  return {
    // Absolute avoids root `title.template` doubling the brand suffix.
    title: { absolute: title },
    description: desc,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: ogType,
      locale: OG_LOCALE[locale] ?? "hy_AM",
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l] ?? l),
      url,
      siteName: "Խնձոր · Xndzor",
      title,
      description: desc,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ogImages.map((img) => (typeof img === "string" ? img : img.url)),
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

/** Truncate plain text for meta / JSON-LD. */
export function truncateMeta(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function listingOfferPrice(priceAmd: number | null | undefined) {
  if (priceAmd == null || priceAmd <= 0) return undefined;
  return {
    "@type": "Offer" as const,
    priceCurrency: "AMD",
    price: String(priceAmd),
    availability: "https://schema.org/InStock",
  };
}

/** BreadcrumbList JSON-LD from UI crumbs (hrefs are locale-unprefixed). */
export function breadcrumbJsonLd(
  locale: string,
  items: { href?: string; label: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href
        ? { item: absoluteUrl(locale, item.href === "/" ? "" : item.href) }
        : {}),
    })),
  };
}
