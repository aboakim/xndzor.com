import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminTrafficPanel } from "@/components/AdminTrafficPanel";
import { getAdminDashboardStats } from "@/lib/admin";
import { countOnline, presenceStorageReady } from "@/lib/presence";
import { getTrafficStats } from "@/lib/traffic";
import { formatAmd } from "@/lib/utils";
import {
  AdminEmpty,
  AdminField,
  AdminRecord,
  AdminRecordList,
} from "@/components/AdminRecord";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const [stats, traffic, online, trackingReady] = await Promise.all([
    getAdminDashboardStats(),
    getTrafficStats(),
    countOnline(),
    presenceStorageReady(),
  ]);

  const cards: { label: string; value: string | number; href: string; hint?: string }[] = [
    { label: t("stats.users"), value: stats.users, href: "/admin/users" },
    { label: t("stats.recentUsers"), value: stats.recentUsers, href: "/admin/users?recent=7" },
    {
      label: t("stats.earlyBirdRemaining"),
      value: `${stats.earlyBird.remaining}/${stats.earlyBird.freeLimit}`,
      href: "/admin/users?earlyBird=1",
    },
    { label: t("stats.supplies"), value: stats.supplies, href: "/admin/listings?tab=supply" },
    { label: t("stats.demands"), value: stats.demands, href: "/admin/listings?tab=demand" },
    { label: t("stats.animals"), value: stats.animals, href: "/admin/listings?tab=animal" },
    { label: t("stats.machinery"), value: stats.machinery, href: "/admin/listings?tab=machinery" },
    { label: t("stats.catalog"), value: stats.catalog, href: "/admin/listings?tab=catalog" },
    { label: t("stats.jobs"), value: stats.jobs, href: "/admin/listings?tab=job" },
    {
      label: t("stats.futureHarvests"),
      value: stats.forwardBoard,
      hint: t("stats.futureBoardHint", {
        harvests: stats.futureHarvests,
        supplies: stats.upcomingSupplies,
      }),
      href: "/admin/listings?tab=futureHarvest",
    },
    { label: t("stats.plots"), value: stats.plots, href: "/admin/plots" },
    { label: t("stats.spaces"), value: stats.spaces, href: "/admin/listings?tab=space" },
    { label: t("stats.payments"), value: stats.payments, href: "/admin/payments" },
    {
      label: t("stats.subscriptions"),
      value: stats.subscriptions,
      href: "/admin/payments#subscriptions",
    },
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

      <AdminTrafficPanel
        initial={traffic}
        initialOnline={online}
        initialTrackingReady={trackingReady}
      />

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <Link key={card.href + card.label} href={card.href} className="admin-stat-card admin-stat-link">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            {card.hint ? <span className="tiny muted">{card.hint}</span> : null}
          </Link>
        ))}
      </div>

      <div className="admin-highlight-row">
        <Link href="/admin/payments" className="admin-stat-card admin-stat-wide admin-stat-link">
          <span>{t("stats.revenue")}</span>
          <strong>{formatAmd(stats.totalRevenueAmd, locale)} ֏</strong>
          <span className="tiny muted">
            {t("stats.succeededPayments", { count: stats.succeededPayments })}
          </span>
        </Link>
        <Link href="/admin/users?earlyBird=1" className="admin-stat-card admin-stat-wide admin-stat-link">
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
        </Link>
        <Link href="/admin/plans" className="admin-stat-card admin-stat-wide admin-stat-link">
          <span>{t("stats.activePlans")}</span>
          <strong>{stats.plans}</strong>
          <span className="tiny linkish">{t("viewPlans")}</span>
        </Link>
      </div>

      <section className="admin-activity">
        <h2>{t("recentUsersTitle")}</h2>
        {stats.recentUsersList.length === 0 ? (
          <AdminEmpty>{t("noResults")}</AdminEmpty>
        ) : (
          <AdminRecordList>
            {stats.recentUsersList.map((u) => (
              <AdminRecord
                key={u.id}
                title={
                  <>
                    <Link
                      href={
                        u.farmId
                          ? `/farms/${u.farmId}`
                          : `/admin/users?q=${encodeURIComponent(u.email)}`
                      }
                      className="linkish"
                    >
                      {u.name}
                    </Link>
                    {u.earlyBirdFree ? (
                      <span className="admin-badge">{t("earlyBirdBadge")}</span>
                    ) : null}
                  </>
                }
                subtitle={u.email}
              >
                <AdminField label={t("col.role")}>{u.role}</AdminField>
                <AdminField label={t("col.joined")}>{dateFmt.format(u.createdAt)}</AdminField>
              </AdminRecord>
            ))}
          </AdminRecordList>
        )}
        <Link href="/admin/users" className="admin-more-link">
          {t("viewAllUsers")}
        </Link>
      </section>

      <section className="admin-activity">
        <h2>{t("recentListingsTitle")}</h2>
        {stats.recentListings.length === 0 ? (
          <AdminEmpty>{t("noResults")}</AdminEmpty>
        ) : (
          <AdminRecordList>
            {stats.recentListings.map((item) => (
              <AdminRecord
                key={`${item.kind}-${item.id}`}
                title={
                  <Link href={item.href} className="linkish">
                    {item.title}
                  </Link>
                }
                subtitle={
                  <Link href={`/admin/listings?tab=${item.kind}`} className="linkish">
                    {kindLabel(item.kind)}
                  </Link>
                }
              >
                <AdminField label={t("col.owner")}>{item.ownerName}</AdminField>
                <AdminField label={t("col.status")}>{item.status}</AdminField>
                <AdminField label={t("col.created")}>{dateFmt.format(item.createdAt)}</AdminField>
              </AdminRecord>
            ))}
          </AdminRecordList>
        )}
        <Link href="/admin/listings" className="admin-more-link">
          {t("viewAllListings")}
        </Link>
      </section>
    </>
  );
}
