import { InfoStaticPage } from "@/components/InfoStaticPage";

export default function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <InfoStaticPage params={params} pageKey="about" />;
}
