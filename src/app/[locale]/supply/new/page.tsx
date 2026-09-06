import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SupplyForm } from "@/components/SupplyForm";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function NewSupplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/supply/new`);
  }

  const [products, user] = await Promise.all([
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  return (
    <div className="section form-page">
      <h1>{t("postSupply.title")}</h1>
      <p className="lede">{t("postSupply.lede")}</p>
      <SupplyForm
        products={products}
        defaultMarzId={user?.marzId}
        defaultPhone={user?.phone}
      />
      <p className="muted">
        <Link href="/supply">{t("nav.supply")}</Link>
      </p>
    </div>
  );
}
