import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { catalogPublicHref, type ListingKind } from "@/lib/admin";
import { upcomingSupplyWhere } from "@/lib/upcoming-supply";
import { AdminListingsTable, type AdminListingRow } from "./AdminListingsTable";

export const dynamic = "force-dynamic";

const TABS: { key: ListingKind; labelKey: string; hrefPrefix: string }[] = [
  { key: "supply", labelKey: "tabSupply", hrefPrefix: "/supply" },
  { key: "demand", labelKey: "tabDemand", hrefPrefix: "/demand" },
  { key: "animal", labelKey: "tabAnimal", hrefPrefix: "/animals" },
  { key: "machinery", labelKey: "tabMachinery", hrefPrefix: "/machinery" },
  { key: "catalog", labelKey: "tabCatalog", hrefPrefix: "/shop/fertilizers" },
  { key: "job", labelKey: "tabJob", hrefPrefix: "/jobs" },
  { key: "futureHarvest", labelKey: "tabFutureHarvest", hrefPrefix: "/forward" },
  { key: "space", labelKey: "tabSpace", hrefPrefix: "/spaces" },
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
        href: catalogPublicHref(r.category, r.id),
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
    case "space": {
      const rows = await prisma.spaceListing.findMany({
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
        href: `/spaces#${r.id}`,
      }));
    }
    default:
      return [];
  }
}

/** Public /forward board, plus listings that are off that board. */
async function fetchForwardListings(): Promise<{
  board: AdminListingRow[];
  offBoard: AdminListingRow[];
}> {
  const userSelect = { name: true, email: true } as const;
  const [harvests, onBoardSupplies, offHarvests, offSupplies] = await Promise.all([
    prisma.futureHarvest.findMany({
      where: { status: "ACTIVE" },
      orderBy: { harvestDate: "asc" },
      include: { user: { select: userSelect } },
    }),
    prisma.supply.findMany({
      where: upcomingSupplyWhere(),
      orderBy: { readyInDays: "asc" },
      include: { user: { select: userSelect } },
    }),
    prisma.futureHarvest.findMany({
      where: { status: { not: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } },
    }),
    prisma.supply.findMany({
      where: { readyInDays: { gt: 0 }, status: { not: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } },
    }),
  ]);

  const now = Date.now();
  const dayMs = 86_400_000;
  const board = [
    ...harvests.map((r) => ({
      sortAt: r.harvestDate.getTime(),
      row: {
        id: r.id,
        kind: "futureHarvest" as const,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/forward/${r.id}`,
      },
    })),
    ...onBoardSupplies.map((r) => ({
      sortAt: now + r.readyInDays * dayMs,
      row: {
        id: r.id,
        kind: "supply" as const,
        title: r.title,
        status: r.status,
        ownerName: r.user.name,
        ownerEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
        href: `/supply/${r.id}`,
        readyInDays: r.readyInDays,
      },
    })),
  ]
    .sort((a, b) => a.sortAt - b.sortAt)
    .map((item) => item.row);

  const offBoard: AdminListingRow[] = [
    ...offHarvests.map((r) => ({
      id: r.id,
      kind: "futureHarvest" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      ownerEmail: r.user.email,
      createdAt: r.createdAt.toISOString(),
      href: `/forward/${r.id}`,
      readyInDays: null,
    })),
    ...offSupplies.map((r) => ({
      id: r.id,
      kind: "supply" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      ownerEmail: r.user.email,
      createdAt: r.createdAt.toISOString(),
      href: `/supply/${r.id}`,
      readyInDays: r.readyInDays,
    })),
  ];

  return { board, offBoard };
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
  const forward =
    tab === "futureHarvest" ? await fetchForwardListings() : null;
  const rows = forward ? forward.board : await fetchListings(tab);
  const harvestCount = rows.filter((r) => r.kind === "futureHarvest").length;
  const supplyCount = rows.filter((r) => r.kind === "supply").length;

  return (
    <>
      <h2>{t("listings")}</h2>
      <p className="lede">
        {tab === "futureHarvest"
          ? t("forwardListLede", {
              count: rows.length,
              harvests: harvestCount,
              supplies: supplyCount,
            })
          : tab === "space"
            ? t("spacesLede")
            : t("listingsLede")}
      </p>

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

      {forward && forward.offBoard.length > 0 ? (
        <section className="admin-activity">
          <h2>{t("offBoardTitle")}</h2>
          <p className="lede">{t("offBoardLede")}</p>
          <AdminListingsTable rows={forward.offBoard} locale={locale} tab={tab} />
        </section>
      ) : null}
    </>
  );
}
