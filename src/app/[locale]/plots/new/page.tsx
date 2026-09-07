import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { PlotForm } from "@/components/PlotForm";

export const dynamic = "force-dynamic";

export default async function NewPlotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/plots/new`);
  }

  const [products, user] = await Promise.all([
    getProducts(),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  return (
    <div className="section form-page">
      <h1>{t("plots.add")}</h1>
      <p className="lede">{t("plots.addLede")}</p>
      <PlotForm products={products} defaultMarzId={user?.marzId} />
    </div>
  );
}
