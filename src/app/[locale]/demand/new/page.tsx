import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { DemandForm } from "@/components/DemandForm";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function NewDemandPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/demand/new`);
  }

  const [products, user] = await Promise.all([
    getProducts(),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  return (
    <div className="section form-page">
      <h1>{t("postDemand.title")}</h1>
      <p className="lede">{t("postDemand.lede")}</p>
      <DemandForm
        products={products}
        defaultMarzId={user?.marzId}
        defaultVillageId={user?.villageId}
        defaultPhone={user?.phone}
      />
      <p className="muted">
        <Link href="/demand">{t("demandBoard.title")}</Link>
      </p>
    </div>
  );
}
