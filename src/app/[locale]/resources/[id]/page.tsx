import { redirect } from "next/navigation";

export default async function ResourcesIdGone({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/jobs`);
}
