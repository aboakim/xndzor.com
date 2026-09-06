import { InfoStaticPage } from "@/components/InfoStaticPage";

export default function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <InfoStaticPage params={params} pageKey="privacy" />;
}
