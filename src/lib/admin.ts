import { redirect } from "next/navigation";
import { getSession } from "./session";
import { prisma } from "./prisma";
import { userIsAdmin } from "./monetization";

export async function requireAdmin(locale: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin`);
  }
  const admin = await userIsAdmin(session.user.id);
  if (!admin) {
    redirect(`/${locale}`);
  }
  return { session, userId: session.user.id };
}

export async function getAdminDashboardStats() {
  const [
    users,
    recentUsers,
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
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
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
  ]);

  const revenue = await prisma.payment.aggregate({
    where: { status: "SUCCEEDED" },
    _sum: { amountAmd: true },
  });

  return {
    users,
    recentUsers,
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
