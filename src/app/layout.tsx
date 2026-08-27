import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Noto_Sans,
  Noto_Sans_Armenian,
  Noto_Serif,
  Noto_Serif_Armenian,
} from "next/font/google";
import "./globals.css";

function resolveSiteUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

const siteUrl = resolveSiteUrl();

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
    default: "Գյուղատնտես — FarmOS Armenia",
    template: "%s · Գյուղատնտես",
  },
  description:
    "Ի՞նչ աճեցնել Հայաստանում՝ ըստ պահանջարկի։ Հողամաս, ապագա բերք, գերտրամադրության ազդանշան, նախնական վաճառք և ֆերմայի անձնագիր։",
  applicationName: "FarmOS Armenia",
  keywords: [
    "Գյուղատնտես",
    "FarmOS",
    "Հայաստան",
    "ֆերմեր",
    "բերք",
    "պահանջարկ",
    "գյուղատնտեսություն",
  ],
  authors: [{ name: "FarmOS Armenia" }],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "hy_AM",
    alternateLocale: ["ru_RU", "en_US"],
    url: siteUrl,
    siteName: "Գյուղատնտես · FarmOS Armenia",
    title: "Գյուղատնտես — FarmOS Armenia",
    description:
      "Ի՞նչ աճեցնել՝ ըստ պահանջարկի։ Հողամաս → ազդանշան → նախնական վաճառք։ Հայաստանի ֆերմերների համար։",
  },
  twitter: {
    card: "summary",
    title: "Գյուղատնտես — FarmOS Armenia",
    description:
      "Ի՞նչ աճեցնել՝ ըստ պահանջարկի։ Հողամաս → ազդանշան → նախնական վաճառք։",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${displayHy.variable} ${displayLat.variable} ${sansHy.variable} ${sans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
