import { InfoStaticPage } from "@/components/InfoStaticPage";

export default function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <InfoStaticPage params={params} pageKey="terms" />;
}
