import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExpenseForm } from "@/components/farm-os/ExpenseForm";
import { effectiveTons } from "@/lib/yield";
import { formatAmd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/costs`);
  }

  const [expenses, plots] = await Promise.all([
    prisma.farmExpense.findMany({
      where: { userId: session.user.id },
      include: { plot: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.plot.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { yieldEstimate: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const byCat: Record<string, number> = {};
  let total = 0;
  for (const e of expenses) {
    byCat[e.category] = (byCat[e.category] || 0) + e.amountAmd;
    total += e.amountAmd;
  }

  const yieldTons = plots.reduce((s, p) => {
    if (!p.yieldEstimate) return s;
    return s + (effectiveTons(p.yieldEstimate) || 0);
  }, 0);
  const costPerKg =
    yieldTons > 0 ? Math.round(total / (yieldTons * 1000)) : null;

  return (
    <div className="section page-board fos-costs">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/today", label: t("farmOs.today.title") },
          { label: t("farmOs.costs.title") },
        ]}
      />

      <div className="section-head">
        <div>
          <h1>{t("farmOs.costs.title")}</h1>
          <p className="lede">{t("farmOs.costs.lede")}</p>
        </div>
        <Link href="/today" className="btn ghost">
          {t("farmOs.today.title")}
        </Link>
      </div>

      <div className="detail-stats">
        <div>
          <span>{t("farmOs.costs.seasonTotal")}</span>
          <strong>{formatAmd(total)} ֏</strong>
        </div>
        <div>
          <span>{t("farmOs.costs.yieldTons")}</span>
          <strong>{yieldTons ? yieldTons.toFixed(1) : "—"}</strong>
        </div>
        <div>
          <span>{t("farmOs.costs.perKg")}</span>
          <strong>{costPerKg != null ? `${formatAmd(costPerKg)} ֏` : "—"}</strong>
        </div>
      </div>

      {Object.keys(byCat).length > 0 ? (
        <ul className="fos-cat-bars">
          {Object.entries(byCat).map(([cat, amt]) => (
            <li key={cat}>
              <span>{t(`farmOs.costs.categories.${cat}` as "farmOs.costs.categories.diesel")}</span>
              <strong>{formatAmd(amt)} ֏</strong>
              <div className="fos-axis-bar" aria-hidden>
                <i style={{ width: `${Math.min(100, Math.round((amt / total) * 100))}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="fos-today-grid">
        <ExpenseForm plots={plots.map((p) => ({ id: p.id, name: p.name }))} />

        <section className="fos-panel">
          <h2>{t("farmOs.costs.recent")}</h2>
          {expenses.length === 0 ? (
            <p className="muted">{t("farmOs.costs.empty")}</p>
          ) : (
            <ul className="fos-expense-list">
              {expenses.map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>
                      {t(`farmOs.costs.categories.${e.category}` as "farmOs.costs.categories.diesel")}
                    </strong>
                    <p className="muted tiny">
                      {e.date.toISOString().slice(0, 10)}
                      {e.plot ? ` · ${e.plot.name}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <em>{formatAmd(e.amountAmd)} ֏</em>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
