import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProviderForm } from "@/components/ProviderForm";

export default async function NewProviderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/providers/new`);
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return (
    <div className="section form-page">
      <h1>{t("providerForm.pageTitle")}</h1>
      <p className="lede">{t("providerForm.lede")}</p>
      <ProviderForm defaultMarzId={user?.marzId} defaultPhone={user?.phone} />
    </div>
  );
}
