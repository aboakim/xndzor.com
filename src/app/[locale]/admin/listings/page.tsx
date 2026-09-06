import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import type { ListingKind } from "@/lib/admin";
import { AdminListingsTable, type AdminListingRow } from "./AdminListingsTable";

const TABS: { key: ListingKind; labelKey: string; hrefPrefix: string }[] = [
  { key: "supply", labelKey: "tabSupply", hrefPrefix: "/supply" },
  { key: "demand", labelKey: "tabDemand", hrefPrefix: "/demand" },
  { key: "animal", labelKey: "tabAnimal", hrefPrefix: "/animals" },
  { key: "machinery", labelKey: "tabMachinery", hrefPrefix: "/machinery" },
  { key: "catalog", labelKey: "tabCatalog", hrefPrefix: "/shop/fertilizers" },
  { key: "job", labelKey: "tabJob", hrefPrefix: "/jobs" },
  { key: "futureHarvest", labelKey: "tabFutureHarvest", hrefPrefix: "/forward" },
];

async function fetchListings(tab: ListingKind): Promise<AdminListingRow[]> {
  const take = 80;
  switch (tab) {
    case "supply": {
      const rows = await prisma.supply.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/supply/${r.id}`,
      }));
    }
    case "demand": {
      const rows = await prisma.demand.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/demand/${r.id}`,
      }));
    }
    case "animal": {
      const rows = await prisma.animalListing.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/animals/${r.id}`,
      }));
    }
    case "machinery": {
      const rows = await prisma.machineryListing.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/machinery/${r.id}`,
      }));
    }
    case "catalog": {
      const rows = await prisma.catalogListing.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/shop/${r.category.toLowerCase()}/${r.id}`,
      }));
    }
    case "job": {
      const rows = await prisma.jobRequest.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/jobs/${r.id}`,
      }));
    }
    case "futureHarvest": {
      const rows = await prisma.futureHarvest.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        kind: tab,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/forward/${r.id}`,
      }));
    }
    default:
      return [];
  }
}

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab: tabParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const tab = (TABS.some((x) => x.key === tabParam) ? tabParam : "supply") as ListingKind;
  const rows = await fetchListings(tab);

  return (
    <>
      <h2>{t("listings")}</h2>
      <p className="lede">{t("listingsLede")}</p>

      <div className="admin-tabs" role="tablist">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/listings?tab=${item.key}`}
            className={tab === item.key ? "admin-tab active" : "admin-tab"}
            role="tab"
            aria-selected={tab === item.key}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </div>

      <AdminListingsTable rows={rows} locale={locale} tab={tab} />
    </>
  );
}
