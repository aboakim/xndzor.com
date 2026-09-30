import { prisma } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/** People seen within this window count as on the site now. */
export const ONLINE_WINDOW_MS = 75_000;

const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSessionId(value: string): boolean {
  return SESSION_ID.test(value);
}

export async function touchSession(sessionId: string, now = new Date()): Promise<void> {
  if (!isSessionId(sessionId)) return;
  try {
    await prisma.siteSession.upsert({
      where: { id: sessionId },
      create: { id: sessionId, firstSeen: now, lastSeen: now },
      update: { lastSeen: now },
    });
    if (Math.random() < 0.02) {
      await prisma.siteSession.deleteMany({
        where: { lastSeen: { lt: new Date(now.getTime() - 45 * DAY_MS) } },
      });
    }
  } catch {
    // Table may not exist until the next `prisma db push`.
  }
}

export async function presenceStorageReady(): Promise<boolean> {
  try {
    await prisma.siteSession.findFirst({ select: { id: true } });
    return true;
  } catch {
    return false;
  }
}

export async function countOnline(now = Date.now()): Promise<number> {
  try {
    return await prisma.siteSession.count({
      where: { lastSeen: { gte: new Date(now - ONLINE_WINDOW_MS) } },
    });
  } catch {
    return 0;
  }
}

export async function countSessionsSince(startMs: number): Promise<number> {
  try {
    return await prisma.siteSession.count({
      where: { lastSeen: { gte: new Date(startMs) } },
    });
  } catch {
    return 0;
  }
}
