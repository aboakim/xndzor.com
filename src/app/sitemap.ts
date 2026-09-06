import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

const siteUrl = resolveSiteUrl();

const locales = ["hy", "ru", "en"] as const;

/** High-value public routes for SEO (hy primary). */
const paths = [
  "",
  "/grow",
  "/pricing",
  "/forward",
  "/plots",
  "/demand",
  "/supply",
  "/machinery",
  "/animals",
  "/jobs",
  "/auth/register",
  "/auth/login",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Apex / www root (redirects to default locale)
  entries.push({
    url: siteUrl,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  });

  for (const locale of locales) {
    for (const path of paths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" || path === "/grow" ? "daily" : "weekly",
        priority:
          path === ""
            ? locale === "hy"
              ? 1
              : 0.95
            : path === "/grow" || path === "/pricing"
              ? 0.9
              : 0.7,
      });
    }
  }

  return entries;
}
