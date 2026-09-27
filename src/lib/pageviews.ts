import { prisma } from "./prisma";

/**
 * First-party pageview counter for the admin dashboard.
 *
 * `@vercel/analytics` is installed and still sends hits to the Vercel
 * dashboard, but reading those numbers back needs the Web Analytics API or a
 * Drain plus `VERCEL_ACCESS_TOKEN`. That token is not configured here, so the
 * admin tiles use this table. A missing token must not leave the dashboard blank.
 */
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type VisitCounts = {
  h24: number;
  d7: number;
  d30: number;
  d90: number;
};

const EMPTY_VISITS: VisitCounts = { h24: 0, d7: 0, d30: 0, d90: 0 };

export function pageViewHour(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0),
  );
}

/** True for public locale pages. Admin and API paths are not visits. */
export function isPublicPagePath(path: string): boolean {
  if (!path.startsWith("/") || path.length > 180) return false;
  if (path.includes("..") || path.includes("//")) return false;
  if (/\/admin(\/|$)/.test(path) || path.startsWith("/api")) return false;
  return /^\/(hy|ru|en)(\/|$)/.test(path);
}

export async function recordPageView(now = new Date()): Promise<void> {
  const hour = pageViewHour(now);
  try {
    await prisma.pageView.upsert({
      where: { hour },
      create: { hour, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // Table may not exist until the next `prisma db push`. Ignore so the beacon stays quiet.
  }
}

function sumOverlapping(
  rows: { hour: Date; count: number }[],
  windowMs: number,
  now: number,
): number {
  const cutoff = now - windowMs;
  let total = 0;
  for (const row of rows) {
    if (row.hour.getTime() + HOUR_MS > cutoff) total += row.count;
  }
  return total;
}

export async function getVisitWindowCounts(now = Date.now()): Promise<VisitCounts> {
  try {
    const oldest = new Date(now - 90 * DAY_MS - HOUR_MS);
    const rows = await prisma.pageView.findMany({
      where: { hour: { gte: oldest } },
      select: { hour: true, count: true },
    });
    return {
      h24: sumOverlapping(rows, DAY_MS, now),
      d7: sumOverlapping(rows, 7 * DAY_MS, now),
      d30: sumOverlapping(rows, 30 * DAY_MS, now),
      d90: sumOverlapping(rows, 90 * DAY_MS, now),
    };
  } catch {
    return EMPTY_VISITS;
  }
}
