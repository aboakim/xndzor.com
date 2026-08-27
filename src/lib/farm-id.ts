import { prisma } from "@/lib/prisma";

/** Display form with hash, e.g. #AR-002184 */
export function formatFarmId(farmId: string): string {
  return farmId.startsWith("#") ? farmId : `#${farmId}`;
}

/** Normalize URL / lookup key to bare code AR-002184 */
export function normalizeFarmId(raw: string): string {
  return decodeURIComponent(raw).trim().replace(/^#/, "").toUpperCase();
}

/**
 * Allocate next Armenia farm code: AR-NNNNNN (6 digits).
 * Stable once assigned; call on farmer registration / first passport ensure.
 */
export async function allocateFarmId(): Promise<string> {
  const last = await prisma.user.findFirst({
    where: { farmId: { startsWith: "AR-" } },
    orderBy: { farmId: "desc" },
    select: { farmId: true },
  });
  let next = 2184; // demo-friendly starting range
  if (last?.farmId) {
    const n = parseInt(last.farmId.replace(/^AR-/, ""), 10);
    if (!Number.isNaN(n)) next = Math.max(n + 1, 1);
  }
  return `AR-${String(next).padStart(6, "0")}`;
}

/** Ensure user has a farmId; returns the code (without #). */
export async function ensureFarmId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { farmId: true },
  });
  if (user?.farmId) return user.farmId;
  const farmId = await allocateFarmId();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { farmId },
    });
    return farmId;
  } catch {
    // Race on unique farmId — retry once
    const again = await allocateFarmId();
    await prisma.user.update({
      where: { id: userId },
      data: { farmId: again },
    });
    return again;
  }
}

/**
 * Batch code: {CROP}-AR-{YEAR}-{NNNNN}
 * e.g. TOMATO-AR-2026-00182
 */
export async function allocateBatchCode(
  productSlug: string,
  harvestDate: Date
): Promise<string> {
  const crop = productSlug.toUpperCase().replace(/[^A-Z0-9]/g, "") || "CROP";
  const year = harvestDate.getUTCFullYear();
  const prefix = `${crop}-AR-${year}-`;
  const last = await prisma.productBatch.findFirst({
    where: { batchCode: { startsWith: prefix } },
    orderBy: { batchCode: "desc" },
    select: { batchCode: true },
  });
  let next = 1;
  if (last?.batchCode) {
    const tail = last.batchCode.slice(prefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export function normalizeBatchCode(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase();
}
