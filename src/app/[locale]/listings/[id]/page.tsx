import { redirect } from "next/navigation";

export default async function LegacyListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/supply`);
}
