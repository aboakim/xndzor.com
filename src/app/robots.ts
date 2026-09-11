import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

const siteUrl = resolveSiteUrl();
const locales = ["hy", "ru", "en"] as const;

function localePaths(suffix: string): string[] {
  return locales.map((l) => `/${l}${suffix}`);
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...localePaths("/account/"),
        ...localePaths("/admin/"),
        ...localePaths("/checkout/"),
        ...localePaths("/my/"),
        ...localePaths("/farm/"),
        ...localePaths("/diary"),
        ...localePaths("/costs"),
        ...localePaths("/auth/login"),
        ...localePaths("/auth/register"),
        "/*/edit",
        "/*/new",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
