import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

const siteUrl = resolveSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/hy/account/",
        "/ru/account/",
        "/en/account/",
        "/hy/admin/",
        "/ru/admin/",
        "/en/admin/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
