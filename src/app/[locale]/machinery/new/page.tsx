import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MachineryForm } from "@/components/MachineryForm";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function NewMachineryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/machinery/new`);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="section form-page">
      <h1>{t("postMachinery.title")}</h1>
      <p className="lede">{t("postMachinery.lede")}</p>
      <MachineryForm defaultMarzId={user?.marzId} defaultPhone={user?.phone} />
      <p className="muted">
        <Link href="/machinery">{t("nav.machinery")}</Link>
      </p>
    </div>
  );
}
