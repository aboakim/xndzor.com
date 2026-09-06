import { prisma } from "@/lib/prisma";
import { arePackagesFree } from "@/lib/pricing";
import { safeQuery } from "@/lib/safe-query";

export type EarlyBirdStats = {
  totalRegistered: number;
  freeLimit: number;
  remaining: number;
  slotsFull: boolean;
  /** Users who claimed an early-bird slot */
  earlyBirdClaimed: number;
};

let backfillDone = false;

/** Default 100; set EARLY_BIRD_FREE_LIMIT=0 to disable early-bird mode. */
export function getEarlyBirdFreeLimit(): number {
  const raw = process.env.EARLY_BIRD_FREE_LIMIT?.trim();
  if (raw === "" || raw === "0" || raw?.toLowerCase() === "off") return 0;
  const n = Number(raw ?? "100");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100;
}

export function isEarlyBirdEnabled(): boolean {
  return getEarlyBirdFreeLimit() > 0 && !arePackagesFree();
}

/**
 * One-time backfill: mark the first N users (by createdAt) as earlyBirdFree.
 * Safe to call on every stats read — runs at most once per process.
 */
export async function backfillEarlyBirdFlagsIfNeeded(): Promise<void> {
  if (backfillDone || !isEarlyBirdEnabled()) return;
  const limit = getEarlyBirdFreeLimit();
  const flagged = await safeQuery(
    () => prisma.user.count({ where: { earlyBirdFree: true } }),
    0,
  );
  const total = await safeQuery(() => prisma.user.count(), 0);
  if (flagged >= Math.min(total, limit)) {
    backfillDone = true;
    return;
  }
  const oldest = await safeQuery(
    () =>
      prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        take: limit,
        select: { id: true },
      }),
    [],
  );
  if (oldest.length > 0) {
    await safeQuery(
      () =>
        prisma.user.updateMany({
          where: { id: { in: oldest.map((u) => u.id) } },
          data: { earlyBirdFree: true },
        }),
      { count: 0 },
    );
  }
  backfillDone = true;
}

export async function getEarlyBirdStats(): Promise<EarlyBirdStats> {
  const freeLimit = getEarlyBirdFreeLimit();
  if (freeLimit <= 0 || arePackagesFree()) {
    return {
      totalRegistered: 0,
      freeLimit,
      remaining: freeLimit,
      slotsFull: false,
      earlyBirdClaimed: 0,
    };
  }
  await backfillEarlyBirdFlagsIfNeeded();
  const [totalRegistered, earlyBirdClaimed] = await Promise.all([
    safeQuery(() => prisma.user.count(), 0),
    safeQuery(() => prisma.user.count({ where: { earlyBirdFree: true } }), 0),
  ]);
  const remaining = Math.max(0, freeLimit - totalRegistered);
  return {
    totalRegistered,
    freeLimit,
    remaining,
    slotsFull: totalRegistered >= freeLimit,
    earlyBirdClaimed,
  };
}

/** Whether public pricing UI should show plans as free (slots still open). */
export async function shouldShowFreePricing(): Promise<boolean> {
  if (arePackagesFree()) return true;
  if (!isEarlyBirdEnabled()) return false;
  const stats = await getEarlyBirdStats();
  return !stats.slotsFull;
}

/** Whether this user may activate packages without payment. */
export async function userQualifiesForFreePackages(
  userId: string | null | undefined,
): Promise<boolean> {
  if (arePackagesFree()) return true;
  if (!userId || !isEarlyBirdEnabled()) return false;
  await backfillEarlyBirdFlagsIfNeeded();
  const user = await safeQuery(
    () =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { earlyBirdFree: true },
      }),
    null,
  );
  return Boolean(user?.earlyBirdFree);
}

/** Checkout / BoostButton: skip payment UI for this owner. */
export async function resolveOwnerFreeCheckout(
  userId: string | null | undefined,
): Promise<boolean> {
  return userQualifiesForFreePackages(userId);
}

export type EarlyBirdUserContext = {
  earlyBirdFree: boolean;
  stats: EarlyBirdStats;
  showFreePricing: boolean;
  checkoutFree: boolean;
};

export async function getEarlyBirdUserContext(
  userId: string | null | undefined,
): Promise<EarlyBirdUserContext> {
  const stats = await getEarlyBirdStats();
  const showFreePricing = arePackagesFree() || (isEarlyBirdEnabled() && !stats.slotsFull);
  const checkoutFree = await userQualifiesForFreePackages(userId);
  let earlyBirdFree = false;
  if (userId) {
    await backfillEarlyBirdFlagsIfNeeded();
    const user = await safeQuery(
      () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: { earlyBirdFree: true },
        }),
      null,
    );
    earlyBirdFree = Boolean(user?.earlyBirdFree);
  }
  return { earlyBirdFree, stats, showFreePricing, checkoutFree };
}
