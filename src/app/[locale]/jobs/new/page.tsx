import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JobRequestForm } from "@/components/JobRequestForm";

export default async function NewJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/jobs/new`);
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <div className="section form-page">
      <h1>{t("jobsForm.pageTitle")}</h1>
      <p className="lede">{t("jobsForm.lede")}</p>
      <JobRequestForm
        defaultMarzId={one(sp.marzId) || user?.marzId}
        defaultPhone={user?.phone}
        defaultJobType={one(sp.jobType)}
        defaultTitle={one(sp.title)}
        defaultHectares={one(sp.hectares)}
      />
    </div>
  );
}
