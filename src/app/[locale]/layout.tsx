import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Noto_Sans,
  Noto_Sans_Armenian,
  Noto_Serif,
  Noto_Serif_Armenian,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NavigationProgress } from "@/components/NavigationProgress";
import { PageFade } from "@/components/PageFade";
import { Providers } from "@/components/Providers";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { PwaServiceWorkerRegister } from "@/components/PwaServiceWorkerRegister";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

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

/** Marketplace pages hit Prisma; skip static prerender (empty SQLite on Vercel breaks build). */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "hy" | "ru" | "en")) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${displayHy.variable} ${displayLat.variable} ${sansHy.variable} ${sans.variable}`}
      >
        <SiteJsonLd locale={locale} />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="app-shell site-chrome">
              <NavigationProgress />
              <Header />
              <main className="app-main page-canvas page-canvas--ambient">
                <PageFade>{children}</PageFade>
              </main>
              <Footer />
              <MobileTabBar />
              <PwaInstallPrompt />
              <PwaServiceWorkerRegister />
            </div>
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
