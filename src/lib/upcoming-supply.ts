/**
 * Supply listings the seller marked as not ready yet.
 *
 * Stored on `Supply.readyInDays` (Int, default 0). The boards render it as
 * «Պատրաստ է N օրից» / "Ready in N days". There is no separate availability
 * date: 0 means ready now, and any positive value is still in the future
 * until the seller sets it back to 0.
 */
export function upcomingSupplyWhere(filter?: { marzId?: string; villageId?: string }) {
  return {
    status: "ACTIVE" as const,
    readyInDays: { gt: 0 },
    ...(filter?.marzId ? { marzId: filter.marzId } : {}),
    ...(filter?.villageId ? { villageId: filter.villageId } : {}),
  };
}
