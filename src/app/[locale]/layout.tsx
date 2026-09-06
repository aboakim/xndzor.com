import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NavigationProgress } from "@/components/NavigationProgress";
import { PageFade } from "@/components/PageFade";
import { Providers } from "@/components/Providers";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { PwaServiceWorkerRegister } from "@/components/PwaServiceWorkerRegister";

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
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div className="app-shell site-chrome" lang={locale}>
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
  );
}
