import { redirect } from "next/navigation";

export default async function ResourcesGone({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/jobs`);
}
