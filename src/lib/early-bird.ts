import { prisma } from "@/lib/prisma";
import { arePackagesFree } from "@/lib/pricing";
import { safeQuery } from "@/lib/safe-query";

export type EarlyBirdStats = {
  /** @deprecated Prefer earlyBirdClaimed — kept for API compatibility */
  totalRegistered: number;
  freeLimit: number;
  remaining: number;
  slotsFull: boolean;
  /** Distinct users who successfully claimed a free early-bird package */
  earlyBirdClaimed: number;
};

/** Postgres advisory lock key for serializing early-bird slot claims. */
const EARLY_BIRD_LOCK_KEY = 87201401;

let reconcileDone = false;

/**
 * Hard-coded free-slot cap (source of truth for banner + claims).
 * Intentionally ignores EARLY_BIRD_FREE_LIMIT so a stale Vercel value (e.g. 100)
 * cannot override production. Re-introduce env parsing later if needed.
 */
export const EARLY_BIRD_FREE_SLOTS = 50;

export function getEarlyBirdFreeLimit(): number {
  return EARLY_BIRD_FREE_SLOTS;
}

export function isEarlyBirdEnabled(): boolean {
  return getEarlyBirdFreeLimit() > 0 && !arePackagesFree();
}

/**
 * One-time per process: align earlyBirdFree with actual free package claims.
 * - Users with SUCCEEDED FREE payments (not global PACKAGES_FREE) get claim timestamps.
 * - Registration-only earlyBirdFree flags without a claim are cleared.
 */
async function reconcileEarlyBirdClaimsIfNeeded(): Promise<void> {
  if (reconcileDone || !isEarlyBirdEnabled()) return;
  reconcileDone = true;

  try {
    const freePayments = await prisma.payment.findMany({
      where: {
        status: "SUCCEEDED",
        provider: "FREE",
        amountAmd: 0,
      },
      select: {
        userId: true,
        createdAt: true,
        metadataJson: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const firstClaimByUser = new Map<string, Date>();
    for (const p of freePayments) {
      let meta: Record<string, unknown> = {};
      try {
        meta = JSON.parse(p.metadataJson || "{}") as Record<string, unknown>;
      } catch {
        meta = {};
      }
      // Global PACKAGES_FREE activations should not consume early-bird slots
      if (meta.packagesFree === true) continue;
      // Prefer explicit early-bird free activations; also accept legacy FREE rows
      if (meta.earlyBirdFree === true || meta.earlyBirdClaim === true || !meta.packagesFree) {
        if (!firstClaimByUser.has(p.userId)) {
          firstClaimByUser.set(p.userId, p.createdAt);
        }
      }
    }

    for (const [userId, claimedAt] of firstClaimByUser) {
      await prisma.user.updateMany({
        where: {
          id: userId,
          OR: [{ earlyBirdClaimedAt: null }, { earlyBirdFree: false }],
        },
        data: {
          earlyBirdFree: true,
          earlyBirdClaimedAt: claimedAt,
        },
      });
    }

    // Drop registration-only flags — slots are claim-based, not signup-based
    await prisma.user.updateMany({
      where: {
        earlyBirdFree: true,
        earlyBirdClaimedAt: null,
      },
      data: { earlyBirdFree: false },
    });
  } catch (err) {
    console.warn("[Xndzor] early-bird reconcile skipped", err);
  }
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

  await reconcileEarlyBirdClaimsIfNeeded();

  const earlyBirdClaimed = await safeQuery(
    () =>
      prisma.user.count({
        where: { earlyBirdClaimedAt: { not: null } },
      }),
    0,
  );
  const remaining = Math.max(0, freeLimit - earlyBirdClaimed);
  return {
    totalRegistered: earlyBirdClaimed,
    freeLimit,
    remaining,
    slotsFull: earlyBirdClaimed >= freeLimit,
    earlyBirdClaimed,
  };
}

/**
 * Atomically reserve one early-bird free slot for this user (first successful claim).
 * Registration does not call this — only package activate/checkout does.
 */
export async function tryClaimEarlyBirdSlot(
  userId: string,
): Promise<"claimed" | "already" | "full" | "disabled"> {
  if (arePackagesFree()) return "already";
  if (!isEarlyBirdEnabled()) return "disabled";
  const limit = getEarlyBirdFreeLimit();

  await reconcileEarlyBirdClaimsIfNeeded();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${EARLY_BIRD_LOCK_KEY})`);

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { earlyBirdFree: true, earlyBirdClaimedAt: true },
    });
    if (!user) throw new Error("user_not_found");
    // Only a real claim (timestamp) counts as already reserved
    if (user.earlyBirdClaimedAt) return "already";

    const claimed = await tx.user.count({
      where: { earlyBirdClaimedAt: { not: null } },
    });
    if (claimed >= limit) return "full";

    await tx.user.update({
      where: { id: userId },
      data: {
        earlyBirdFree: true,
        earlyBirdClaimedAt: new Date(),
      },
    });
    return "claimed";
  });
}

/** Whether public pricing UI should show plans as free (slots still open). */
export async function shouldShowFreePricing(): Promise<boolean> {
  if (arePackagesFree()) return true;
  if (!isEarlyBirdEnabled()) return false;
  const stats = await getEarlyBirdStats();
  return !stats.slotsFull;
}

/**
 * Whether this user may activate packages without payment right now.
 * - Already claimed early-bird → free forever
 * - Slots still open → may claim on checkout
 */
export async function userQualifiesForFreePackages(
  userId: string | null | undefined,
): Promise<boolean> {
  if (arePackagesFree()) return true;
  if (!userId || !isEarlyBirdEnabled()) return false;

  await reconcileEarlyBirdClaimsIfNeeded();

  const user = await safeQuery(
    () =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { earlyBirdFree: true, earlyBirdClaimedAt: true },
      }),
    null,
  );
  if (user?.earlyBirdClaimedAt) return true;
  // Legacy earlyBirdFree without a claim timestamp does not qualify
  if (user?.earlyBirdFree && !user.earlyBirdClaimedAt) return false;

  const stats = await getEarlyBirdStats();
  return !stats.slotsFull;
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
  const showFreePricing =
    arePackagesFree() || (isEarlyBirdEnabled() && !stats.slotsFull);
  const checkoutFree = await userQualifiesForFreePackages(userId);
  let earlyBirdFree = false;
  if (userId) {
    const user = await safeQuery(
      () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: { earlyBirdFree: true, earlyBirdClaimedAt: true },
        }),
      null,
    );
    earlyBirdFree = Boolean(user?.earlyBirdClaimedAt);
  }
  return { earlyBirdFree, stats, showFreePricing, checkoutFree };
}
