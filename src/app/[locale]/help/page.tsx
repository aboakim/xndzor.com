import { InfoStaticPage } from "@/components/InfoStaticPage";

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/help", "help");
}

export default function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <InfoStaticPage params={params} pageKey="help" />;
}
