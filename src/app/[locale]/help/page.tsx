import { InfoStaticPage } from "@/components/InfoStaticPage";

export default function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <InfoStaticPage params={params} pageKey="help" />;
}
