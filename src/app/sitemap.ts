import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  process.env.AUTH_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of locales) {
    for (const path of paths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" || path === "/grow" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/grow" || path === "/pricing" ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
