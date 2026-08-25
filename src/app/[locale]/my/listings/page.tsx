import { redirect } from "next/navigation";

export default async function LegacyMyListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/matches`);
}
