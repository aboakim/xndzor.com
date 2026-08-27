import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { PageFade } from "@/components/PageFade";
import { Providers } from "@/components/Providers";

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
  const t = await getTranslations("footer");

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div className="app-shell" lang={locale}>
          <Header />
          <main className="app-main">
            <PageFade>{children}</PageFade>
          </main>
          <footer className="site-footer">
            <p>FarmOS Armenia · Գյուղատնտես</p>
            <p>{t("note")}</p>
          </footer>
          <MobileTabBar />
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
