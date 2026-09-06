import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmPageShell } from "@/components/farm/FarmPageShell";
import { ExpenseForm } from "@/components/farm/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function FarmCostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("farm");
  const tn = await getTranslations("nav");
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/farm/costs`);
  }

  const [plots, expenses, yieldAgg] = await Promise.all([
    prisma.plot.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    prisma.farmExpense.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 100,
      include: { plot: { select: { name: true } } },
    }),
    prisma.yieldEstimate.findMany({
      where: { plot: { userId: session.user.id } },
    }),
  ]);

  const total = expenses.reduce((s, e) => s + e.amountAmd, 0);
  const byCat: Record<string, number> = {};
  for (const e of expenses) {
    byCat[e.category] = (byCat[e.category] || 0) + e.amountAmd;
  }
  const tons = yieldAgg.reduce((s, y) => {
    const tEff = y.farmerOverrideTons ?? (y.tonsMin + y.tonsMax) / 2;
    return s + tEff;
  }, 0);
  const kg = tons * 1000;
  const costPerKg = kg > 0 ? Math.round(total / kg) : null;

  return (
    <FarmPageShell
      title={t("tools.costs.title")}
      lede={t("tools.costs.desc")}
      breadcrumbs={[
        { href: "/", label: tn("home") },
        { href: "/farm", label: t("hub.title") },
        { label: t("tools.costs.title") },
      ]}
    >
      <div className="farm-stat-row">
        <div className="farm-stat">
          <strong>{total.toLocaleString()}</strong>
          <span>AMD</span>
          <em>{t("costs.seasonTotal")}</em>
        </div>
        <div className="farm-stat">
          <strong>{costPerKg != null ? costPerKg.toLocaleString() : "—"}</strong>
          <span>AMD/kg</span>
          <em>{t("costs.perKg")}</em>
        </div>
      </div>
      {costPerKg == null ? <p className="muted small">{t("costs.needYield")}</p> : null}

      <ExpenseForm plots={plots} />

      <h2 className="farm-subhead">{t("costs.byCategory")}</h2>
      <ul className="farm-cat-bars">
        {Object.entries(byCat).map(([cat, amt]) => (
          <li key={cat}>
            <span>{t(`costs.cats.${cat}` as "costs.cats.diesel")}</span>
            <div className="farm-score-bar">
              <i style={{ width: `${total ? Math.round((amt / total) * 100) : 0}%` }} />
            </div>
            <strong>{amt.toLocaleString()}</strong>
          </li>
        ))}
      </ul>

      <h2 className="farm-subhead">{t("costs.history")}</h2>
      {expenses.length === 0 ? (
        <p className="muted">{t("costs.empty")}</p>
      ) : (
        <ul className="farm-list">
          {expenses.map((e) => (
            <li key={e.id}>
              <div className="farm-list-main">
                <strong>
                  {t(`costs.cats.${e.category}` as "costs.cats.diesel")} ·{" "}
                  {e.amountAmd.toLocaleString()} AMD
                </strong>
                <p className="muted small">
                  {e.date.toLocaleDateString(locale)}
                  {e.plot ? ` · ${e.plot.name}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FarmPageShell>
  );
}
