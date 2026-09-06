/** Canonical production origin for SEO, sitemap, and Open Graph. */
export const PRODUCTION_SITE_URL = "https://www.xndzor.com";

/**
 * Absolute site origin. Never returns localhost — social crawlers and
 * Google need a stable public URL for og:image, canonical, and sitemap.
 */
export function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_ENV === "production" ? PRODUCTION_SITE_URL : null) ||
    PRODUCTION_SITE_URL;
  try {
    const origin = new URL(raw).origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return PRODUCTION_SITE_URL;
    }
    return origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}
