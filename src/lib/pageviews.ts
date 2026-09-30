import { prisma } from "./prisma";

/**
 * First-party pageview counter (public locale pages only).
 * `@vercel/analytics` still sends hits to Vercel. The admin dashboard reads
 * Production totals from the Web Analytics API when `VERCEL_ACCESS_TOKEN` is set;
 * otherwise it shows rolling counts from these hourly rows and session heartbeats.
 */

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

export async function listPageViewHours(sinceMs: number): Promise<{ hour: number; count: number }[]> {
  try {
    const rows = await prisma.pageView.findMany({
      where: { hour: { gte: new Date(sinceMs) } },
      select: { hour: true, count: true },
    });
    return rows.map((row) => ({ hour: row.hour.getTime(), count: row.count }));
  } catch {
    return [];
  }
}
