import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAdminDashboardStats } from "@/lib/admin";
import { formatAmd } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
    {
      label: t("stats.earlyBirdRemaining"),
      value: `${stats.earlyBird.remaining}/${stats.earlyBird.freeLimit}`,
      href: undefined as string | undefined,
    },
    { label: t("stats.supplies"), value: stats.supplies, href: "/admin/listings?tab=supply" },
    { label: t("stats.demands"), value: stats.demands, href: "/admin/listings?tab=demand" },
    { label: t("stats.animals"), value: stats.animals, href: "/admin/listings?tab=animal" },
    { label: t("stats.machinery"), value: stats.machinery, href: "/admin/listings?tab=machinery" },
    { label: t("stats.catalog"), value: stats.catalog, href: "/admin/listings?tab=catalog" },
    { label: t("stats.jobs"), value: stats.jobs, href: "/admin/listings?tab=job" },
    {
      label: t("stats.futureHarvests"),
      value: stats.futureHarvests,
      href: "/admin/listings?tab=futureHarvest",
    },
    { label: t("stats.plots"), value: stats.plots },
    { label: t("stats.payments"), value: stats.payments, href: "/admin/payments" },
    { label: t("stats.subscriptions"), value: stats.subscriptions, href: "/admin/payments" },
  ];

  const kindLabel = (kind: string) => {
    switch (kind) {
      case "supply":
        return t("tabSupply");
      case "demand":
        return t("tabDemand");
      case "animal":
        return t("tabAnimal");
      case "machinery":
        return t("tabMachinery");
      case "catalog":
        return t("tabCatalog");
      case "job":
        return t("tabJob");
      case "futureHarvest":
        return t("tabFutureHarvest");
      default:
        return kind;
    }
  };

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
          <span>{t("stats.earlyBird")}</span>
          <strong>
            {stats.earlyBird.slotsFull
              ? t("stats.earlyBirdFull")
              : t("stats.earlyBirdOpen", {
                  remaining: stats.earlyBird.remaining,
                  limit: stats.earlyBird.freeLimit,
                })}
          </strong>
          <span className="tiny muted">
            {t("stats.earlyBirdClaimed", { count: stats.earlyBird.claimed })}
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

      <section className="admin-activity">
        <h2>{t("recentUsersTitle")}</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("col.name")}</th>
                <th>{t("col.email")}</th>
                <th>{t("col.role")}</th>
                <th>{t("col.joined")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsersList.length === 0 ? (
                <tr>
                  <td colSpan={4}>{t("noResults")}</td>
                </tr>
              ) : (
                stats.recentUsersList.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.name}
                      {u.earlyBirdFree ? (
                        <span className="admin-badge">{t("earlyBirdBadge")}</span>
                      ) : null}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{dateFmt.format(u.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Link href="/admin/users" className="tiny linkish">
          {t("viewAllUsers")}
        </Link>
      </section>

      <section className="admin-activity">
        <h2>{t("recentListingsTitle")}</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("col.kind")}</th>
                <th>{t("col.title")}</th>
                <th>{t("col.owner")}</th>
                <th>{t("col.status")}</th>
                <th>{t("col.created")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentListings.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t("noResults")}</td>
                </tr>
              ) : (
                stats.recentListings.map((item) => (
                  <tr key={`${item.kind}-${item.id}`}>
                    <td>{kindLabel(item.kind)}</td>
                    <td>{item.title}</td>
                    <td>{item.ownerName}</td>
                    <td>{item.status}</td>
                    <td>{dateFmt.format(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Link href="/admin/listings" className="tiny linkish">
          {t("viewAllListings")}
        </Link>
      </section>
    </>
  );
}
