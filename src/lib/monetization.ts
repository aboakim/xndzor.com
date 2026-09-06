import { prisma } from "./prisma";
import { safeQuery } from "./safe-query";
import {
  FARM_PRO_BOOST_QUOTA,
  type BoostTargetType,
  type ProductCode,
} from "./pricing";
import { addDays, fulfillPayment } from "./payments";

export type UserEntitlements = {
  isPro: boolean;
  proUntil: Date | null;
  isVerifiedPaid: boolean;
  verifiedPaidUntil: Date | null;
  isBuyerPro: boolean;
  buyerProUntil: Date | null;
  farmVerified: boolean;
  boostQuotaUsed: number;
  boostQuotaRemaining: number;
};

function stillActive(until: Date | null | undefined): boolean {
  return Boolean(until && until.getTime() > Date.now());
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlements | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      proUntil: true,
      isVerifiedPaid: true,
      verifiedPaidUntil: true,
      buyerProUntil: true,
      farmVerified: true,
    },
  });
  if (!user) return null;

  const isPro = user.isPro && stillActive(user.proUntil);
  const isVerifiedPaid = user.isVerifiedPaid && stillActive(user.verifiedPaidUntil);
  const isBuyerPro = stillActive(user.buyerProUntil);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const boostQuotaUsed = await prisma.boost.count({
    where: {
      userId,
      source: "PRO_QUOTA",
      createdAt: { gte: monthStart },
    },
  });

  return {
    isPro,
    proUntil: user.proUntil,
    isVerifiedPaid,
    verifiedPaidUntil: user.verifiedPaidUntil,
    isBuyerPro,
    buyerProUntil: user.buyerProUntil,
    farmVerified: user.farmVerified || isVerifiedPaid,
    boostQuotaUsed,
    boostQuotaRemaining: isPro
      ? Math.max(0, FARM_PRO_BOOST_QUOTA - boostQuotaUsed)
      : 0,
  };
}

export async function getActiveBoostMap(
  targetType: BoostTargetType,
  targetIds: string[],
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  if (!targetIds.length) return map;
  const now = new Date();
  const rows = await safeQuery(
    () =>
      prisma.boost.findMany({
        where: {
          targetType,
          targetId: { in: targetIds },
          endsAt: { gt: now },
        },
        select: { targetId: true, endsAt: true },
      }),
    [],
  );
  for (const r of rows) {
    const prev = map.get(r.targetId);
    if (!prev || r.endsAt > prev) map.set(r.targetId, r.endsAt);
  }
  return map;
}

export async function getProUserIds(userIds: string[]): Promise<Set<string>> {
  if (!userIds.length) return new Set();
  const now = new Date();
  const ok = await safeQuery(
    () =>
      prisma.user.findMany({
        where: { id: { in: userIds }, isPro: true, proUntil: { gt: now } },
        select: { id: true },
      }),
    [],
  );
  return new Set(ok.map((u) => u.id));
}

/** Sort: boosted first, then Pro sellers, then original order (usually date desc). */
export function sortByMonetization<T extends { id: string; userId: string }>(
  items: T[],
  boostMap: Map<string, Date>,
  proUserIds: Set<string>,
): T[] {
  return [...items].sort((a, b) => {
    const aBoost = boostMap.has(a.id) ? 1 : 0;
    const bBoost = boostMap.has(b.id) ? 1 : 0;
    if (bBoost !== aBoost) return bBoost - aBoost;
    const aPro = proUserIds.has(a.userId) ? 1 : 0;
    const bPro = proUserIds.has(b.userId) ? 1 : 0;
    if (bPro !== aPro) return bPro - aPro;
    return 0;
  });
}

export async function assertListingOwnedBy(
  userId: string,
  targetType: BoostTargetType,
  targetId: string,
): Promise<boolean> {
  switch (targetType) {
    case "MACHINERY": {
      const row = await prisma.machineryListing.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return row?.userId === userId;
    }
    case "ANIMAL": {
      const row = await prisma.animalListing.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return row?.userId === userId;
    }
    case "CATALOG": {
      const row = await prisma.catalogListing.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return row?.userId === userId;
    }
    case "SUPPLY": {
      const row = await prisma.supply.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return row?.userId === userId;
    }
    case "FUTURE_HARVEST": {
      const row = await prisma.futureHarvest.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return row?.userId === userId;
    }
    default:
      return false;
  }
}

function addDaysLocal(from: Date, days: number): Date {
  return addDays(from, days);
}

export async function activatePayment(paymentId: string): Promise<void> {
  await fulfillPayment(paymentId);
}

/** Apply a free Pro-quota boost (no payment). Returns error message or null. */
export async function applyProQuotaBoost(
  userId: string,
  targetType: BoostTargetType,
  targetId: string,
  days: 7 | 30 = 7,
): Promise<string | null> {
  const ent = await getUserEntitlements(userId);
  if (!ent?.isPro) return "pro_required";
  if (ent.boostQuotaRemaining <= 0) return "quota_exhausted";
  const owned = await assertListingOwnedBy(userId, targetType, targetId);
  if (!owned) return "not_owner";

  await prisma.boost.create({
    data: {
      userId,
      targetType,
      targetId,
      days,
      endsAt: addDaysLocal(new Date(), days),
      source: "PRO_QUOTA",
    },
  });
  return null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin || !email) return false;
  return email.toLowerCase() === admin;
}

export async function userIsAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return isAdminEmail(user.email);
}

export type { ProductCode, BoostTargetType };
