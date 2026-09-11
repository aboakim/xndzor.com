import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { resolveSiteUrl } from "@/lib/site-url";
import { OG_IMAGE } from "@/lib/seo";
import "./globals.css";
/* Load after globals so dark tokens/overrides beat later :root and component colors */
import "./theme-dark.css";

const siteUrl = resolveSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a3329",
};

/** Default metadata; locale pages override via generateMetadata + buildPageMetadata. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Խնձոր (Xndzor) — գյուղատնտեսական շուկա | xndzor.com",
    template: "%s · Խնձոր",
  },
  description:
    "Խնձոր (Xndzor, xndzor.com) — Հայաստանի գյուղատնտեսական շուկա։ Ի՞նչ աճեցնել՝ ըստ պահանջարկի։ Հողամաս, ապագա բերք, գերտրամադրության ազդանշան, նախնական վաճառք և ֆերմերի շուկա։",
  applicationName: "Խնձոր",
  manifest: "/manifest.webmanifest?v=3",
  appleWebApp: {
    capable: true,
    title: "Խնձոր",
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "Խնձոր",
    "Xndzor",
    "xndzor.com",
    "www.xndzor.com",
    "Հայաստան",
    "ֆերմեր",
    "բերք",
    "պահանջարկ",
    "գյուղատնտեսություն",
    "գյուղատնտեսական շուկա",
    "Armenia agriculture marketplace",
  ],
  authors: [{ name: "Xndzor", url: siteUrl }],
  alternates: {
    canonical: siteUrl,
    languages: {
      hy: `${siteUrl}/hy`,
      ru: `${siteUrl}/ru`,
      en: `${siteUrl}/en`,
      "x-default": `${siteUrl}/hy`,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "48x48" },
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },
      { url: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    locale: "hy_AM",
    alternateLocale: ["ru_RU", "en_US"],
    url: `${siteUrl}/hy`,
    siteName: "Խնձոր · Xndzor",
    title: "Խնձոր (Xndzor) — գյուղատնտեսական շուկա | xndzor.com",
    description:
      "Խնձոր — xndzor.com։ Ի՞նչ աճեցնել՝ ըստ պահանջարկի։ Հողամաս → ազդանշան → նախնական վաճառք։ Հայաստանի ֆերմերների համար։",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Խնձոր — Xndzor | xndzor.com",
    description:
      "Xndzor (xndzor.com) — what to grow by demand. Plots, harvest, machinery, jobs — Armenia's agricultural marketplace.",
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

/**
 * Passthrough root so `[locale]/layout` can own `<html lang>`.
 * Required by next-intl App Router; metadata/viewport still export from here.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
