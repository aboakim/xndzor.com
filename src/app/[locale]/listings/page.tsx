import { redirect } from "next/navigation";

export default async function LegacyListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/supply`);
}
