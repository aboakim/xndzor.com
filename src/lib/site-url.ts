/** Canonical production origin for SEO, sitemap, and Open Graph. */
export const PRODUCTION_SITE_URL = "https://www.xndzor.com";

/**
 * Absolute site origin for crawlers. Always uses https://www.xndzor.com —
 * never localhost, and never the bare apex (xndzor.com) so canonicals stay consistent.
 */
export function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    PRODUCTION_SITE_URL;
  try {
    const url = new URL(raw);
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "xndzor.com" ||
      url.hostname === "www.xndzor.com"
    ) {
      return PRODUCTION_SITE_URL;
    }
    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}
