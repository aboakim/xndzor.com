import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Noto_Sans,
  Noto_Sans_Armenian,
  Noto_Serif,
  Noto_Serif_Armenian,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";
/* Load after globals so dark tokens/overrides beat later :root and component colors */
import "./theme-dark.css";

/** Canonical production origin — required for absolute og:image URLs. */
const PRODUCTION_SITE_URL = "https://www.xndzor.com";

function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_ENV === "production" ? PRODUCTION_SITE_URL : null) ||
    PRODUCTION_SITE_URL;
  try {
    const origin = new URL(raw).origin;
    // Localhost metadataBase breaks social crawlers; prefer production canonical.
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return PRODUCTION_SITE_URL;
    }
    return origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

const siteUrl = resolveSiteUrl();
const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Խնձոր — Xndzor",
  type: "image/png" as const,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a3329",
};

const displayHy = Noto_Serif_Armenian({
  subsets: ["armenian"],
  variable: "--font-display-hy",
  weight: ["400", "700"],
});

const displayLat = Noto_Serif({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const sansHy = Noto_Sans_Armenian({
  subsets: ["armenian"],
  variable: "--font-sans-hy",
  weight: ["400", "500", "600", "700"],
});

const sans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Խնձոր — գյուղատնտեսական շուկա",
    template: "%s · Խնձոր",
  },
  description:
    "Ի՞նչ աճեցնել Հայաստանում՝ ըստ պահանջարկի։ Հողամաս, ապագա բերք, գերտրամադրության ազդանշան, նախնական վաճառք և ֆերմերի շուկա։",
  applicationName: "Խնձոր",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Խնձոր",
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "Խնձոր",
    "Xndzor",
    "xndzor.com",
    "Հայաստան",
    "ֆերմեր",
    "բերք",
    "պահանջարկ",
    "գյուղատնտեսություն",
    "գյուղատնտեսական շուկա",
  ],
  authors: [{ name: "Xndzor" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    locale: "hy_AM",
    alternateLocale: ["ru_RU", "en_US"],
    url: siteUrl,
    siteName: "Խնձոր · Xndzor",
    title: "Խնձոր — գյուղատնտեսական շուկա",
    description:
      "Ի՞նչ աճեցնել՝ ըստ պահանջարկի։ Հողամաս → ազդանշան → նախնական վաճառք։ Հայաստանի ֆերմերների համար։",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Խնձոր — Xndzor",
    description:
      "What to grow by demand. Plots, harvest, machinery, jobs — Armenia's agricultural marketplace.",
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${displayHy.variable} ${displayLat.variable} ${sansHy.variable} ${sans.variable}`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
