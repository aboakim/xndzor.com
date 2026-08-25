import { redirect } from "next/navigation";

export default async function ResourcesNewGone({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/jobs/new`);
}
