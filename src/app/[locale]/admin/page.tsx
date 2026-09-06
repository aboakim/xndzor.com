import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAdminDashboardStats } from "@/lib/admin";
import { formatAmd } from "@/lib/utils";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: t("stats.users"), value: stats.users, href: "/admin/users" },
    { label: t("stats.recentUsers"), value: stats.recentUsers, href: "/admin/users" },
    { label: t("stats.supplies"), value: stats.supplies, href: "/admin/listings?tab=supply" },
    { label: t("stats.demands"), value: stats.demands, href: "/admin/listings?tab=demand" },
    { label: t("stats.animals"), value: stats.animals, href: "/admin/listings?tab=animal" },
    { label: t("stats.machinery"), value: stats.machinery, href: "/admin/listings?tab=machinery" },
    { label: t("stats.catalog"), value: stats.catalog, href: "/admin/listings?tab=catalog" },
    { label: t("stats.jobs"), value: stats.jobs, href: "/admin/listings?tab=job" },
    { label: t("stats.futureHarvests"), value: stats.futureHarvests, href: "/admin/listings?tab=futureHarvest" },
    { label: t("stats.plots"), value: stats.plots },
    { label: t("stats.payments"), value: stats.payments, href: "/admin/payments" },
    { label: t("stats.subscriptions"), value: stats.subscriptions, href: "/admin/payments" },
  ];

  return (
    <>
      <p className="lede">{t("dashboardLede")}</p>

      <div className="admin-stat-grid">
        {cards.map((card) =>
          card.href ? (
            <Link key={card.label} href={card.href} className="admin-stat-card admin-stat-link">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </Link>
          ) : (
            <div key={card.label} className="admin-stat-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ),
        )}
      </div>

      <div className="admin-highlight-row">
        <div className="admin-stat-card admin-stat-wide">
          <span>{t("stats.revenue")}</span>
          <strong>{formatAmd(stats.totalRevenueAmd, locale)} ֏</strong>
          <span className="tiny muted">
            {t("stats.succeededPayments", { count: stats.succeededPayments })}
          </span>
        </div>
        <div className="admin-stat-card admin-stat-wide">
          <span>{t("stats.activePlans")}</span>
          <strong>{stats.plans}</strong>
          <Link href="/admin/plans" className="tiny linkish">
            {t("viewPlans")}
          </Link>
        </div>
      </div>
    </>
  );
}
