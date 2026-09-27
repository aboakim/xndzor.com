import { notFound, redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { userIsAdmin } from "./monetization";
import { CATALOG_ROUTE, type CatalogCategory } from "./catalog";
import { getEarlyBirdStats } from "./early-bird";
import { upcomingSupplyWhere } from "./upcoming-supply";
import { getVisitWindowCounts } from "./pageviews";

export function catalogPublicHref(category: string, id: string) {
  const slug = CATALOG_ROUTE[category as CatalogCategory] ?? "fertilizers";
  return `/shop/${slug}/${id}`;
}

export async function requireAdmin(locale: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin`);
  }
  const admin = await userIsAdmin(session.user.id);
  if (!admin) {
    // Stealth: signed-in non-admins still see a normal 404
    notFound();
  }
  return { session, userId: session.user.id };
}

export type RecentAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  farmId: string | null;
  createdAt: Date;
  earlyBirdFree: boolean;
};

export type RecentAdminListing = {
  id: string;
  kind: ListingKind;
  title: string;
  status: string;
  ownerName: string;
  createdAt: Date;
  href: string;
};

export async function getAdminDashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const visitsPromise = getVisitWindowCounts();

  const [
    users,
    recentUsersCount,
    supplies,
    demands,
    animals,
    machinery,
    catalog,
    jobs,
    providers,
    futureHarvests,
    upcomingSupplies,
    spaces,
    payments,
    succeededPayments,
    subscriptions,
    plans,
    plots,
    campaigns,
    recentUsersList,
    recentSupplies,
    recentDemands,
    recentAnimals,
    recentMachinery,
    recentCatalog,
    earlyBird,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.supply.count(),
    prisma.demand.count(),
    prisma.animalListing.count(),
    prisma.machineryListing.count(),
    prisma.catalogListing.count(),
    prisma.jobRequest.count(),
    prisma.serviceProvider.count(),
    prisma.futureHarvest.count({ where: { status: "ACTIVE" } }),
    prisma.supply.count({ where: upcomingSupplyWhere() }),
    prisma.spaceListing.count(),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "SUCCEEDED" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.plan.count({ where: { active: true } }),
    prisma.plot.count(),
    prisma.groupBuyCampaign.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        farmId: true,
        createdAt: true,
        earlyBirdFree: true,
      },
    }),
    prisma.supply.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.demand.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.animalListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.machineryListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.catalogListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        category: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    getEarlyBirdStats(),
  ]);
  const visits = await visitsPromise;

  const revenue = await prisma.payment.aggregate({
    where: { status: "SUCCEEDED" },
    _sum: { amountAmd: true },
  });

  const recentListings: RecentAdminListing[] = [
    ...recentSupplies.map((r) => ({
      id: r.id,
      kind: "supply" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
      href: `/supply/${r.id}`,
    })),
    ...recentDemands.map((r) => ({
      id: r.id,
      kind: "demand" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
      href: `/demand/${r.id}`,
    })),
    ...recentAnimals.map((r) => ({
      id: r.id,
      kind: "animal" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
      href: `/animals/${r.id}`,
    })),
    ...recentMachinery.map((r) => ({
      id: r.id,
      kind: "machinery" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
      href: `/machinery/${r.id}`,
    })),
    ...recentCatalog.map((r) => ({
      id: r.id,
      kind: "catalog" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
      href: catalogPublicHref(r.category, r.id),
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12);

  return {
    users,
    recentUsers: recentUsersCount,
    supplies,
    demands,
    animals,
    machinery,
    catalog,
    jobs,
    providers,
    futureHarvests,
    upcomingSupplies,
    forwardBoard: futureHarvests + upcomingSupplies,
    spaces,
    payments,
    succeededPayments,
    subscriptions,
    plans,
    plots,
    campaigns,
    totalRevenueAmd: revenue._sum.amountAmd ?? 0,
    earlyBird: {
      remaining: earlyBird.remaining,
      freeLimit: earlyBird.freeLimit,
      claimed: earlyBird.earlyBirdClaimed,
      slotsFull: earlyBird.slotsFull,
    },
    recentUsersList: recentUsersList as RecentAdminUser[],
    recentListings,
    visits,
  };
}

export type ListingKind =
  | "supply"
  | "demand"
  | "animal"
  | "machinery"
  | "catalog"
  | "job"
  | "futureHarvest"
  | "space";

export const LISTING_STATUSES = ["ACTIVE", "HIDDEN", "SOLD", "FILLED"] as const;
export const USER_ROLES = ["FARMER", "BUYER", "PROVIDER", "BOTH", "ADMIN"] as const;
