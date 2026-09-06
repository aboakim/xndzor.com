import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AdminPlansTable } from "./AdminPlansTable";

export default async function AdminPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <h2>{t("plans")}</h2>
      <p className="lede">{t("plansLede")}</p>
      <AdminPlansTable
        locale={locale}
        plans={plans.map((p) => ({
          id: p.id,
          code: p.code,
          kind: p.kind,
          nameKey: p.nameKey,
          amountAmd: p.amountAmd,
          interval: p.interval,
          active: p.active,
          sortOrder: p.sortOrder,
        }))}
      />
    </>
  );
}
