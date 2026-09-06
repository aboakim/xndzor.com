import { notFound } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { userIsAdmin } from "./monetization";
import { getEarlyBirdStats } from "./early-bird";

export async function requireAdmin(_locale: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    // Stealth: do not advertise the admin URL via login redirect
    notFound();
  }
  const admin = await userIsAdmin(session.user.id);
  if (!admin) {
    notFound();
  }
  return { session, userId: session.user.id };
}

export type RecentAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
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
};

export async function getAdminDashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
    prisma.futureHarvest.count(),
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
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    getEarlyBirdStats(),
  ]);

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
    })),
    ...recentDemands.map((r) => ({
      id: r.id,
      kind: "demand" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
    })),
    ...recentAnimals.map((r) => ({
      id: r.id,
      kind: "animal" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
    })),
    ...recentMachinery.map((r) => ({
      id: r.id,
      kind: "machinery" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
    })),
    ...recentCatalog.map((r) => ({
      id: r.id,
      kind: "catalog" as const,
      title: r.title,
      status: r.status,
      ownerName: r.user.name,
      createdAt: r.createdAt,
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
  };
}

export type ListingKind =
  | "supply"
  | "demand"
  | "animal"
  | "machinery"
  | "catalog"
  | "job"
  | "futureHarvest";

export const LISTING_STATUSES = ["ACTIVE", "HIDDEN", "SOLD", "FILLED"] as const;
export const USER_ROLES = ["FARMER", "BUYER", "PROVIDER", "BOTH", "ADMIN"] as const;
