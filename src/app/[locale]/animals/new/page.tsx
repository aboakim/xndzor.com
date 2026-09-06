import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AnimalForm } from "@/components/AnimalForm";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function NewAnimalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/animals/new`);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="section form-page">
      <h1>{t("postAnimals.title")}</h1>
      <p className="lede">{t("postAnimals.lede")}</p>
      <AnimalForm defaultMarzId={user?.marzId} defaultPhone={user?.phone} />
      <p className="muted">
        <Link href="/animals">{t("nav.animals")}</Link>
      </p>
    </div>
  );
}
