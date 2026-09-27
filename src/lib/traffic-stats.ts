/**
 * Pure traffic math for the admin dashboard.
 * No database or tokens — safe to import from a client component as a type-only module.
 */

export const TRACKING_SINCE_LABEL = "2026-09-06";

/** Vercel Production capture, ~13:34 Asia/Yerevan on 27 Sep 2026. */
export const SNAPSHOT_AT_MS = Date.parse("2026-09-27T09:34:00.000Z");

export const VERCEL_SNAPSHOT = {
  h24: { visitors: 22, pageViews: 158, bounceRate: 45 },
  d7: { visitors: 276, pageViews: 1178, bounceRate: 61 },
  d30: { visitors: 1082, pageViews: 4674, bounceRate: 53 },
} as const;

const HOUR_MS = 60 * 60 * 1000;

export const TRAFFIC_WINDOWS = {
  h24: 24 * HOUR_MS,
  d7: 7 * 24 * HOUR_MS,
  d30: 30 * 24 * HOUR_MS,
} as const;

export type TrafficPeriodKey = keyof typeof TRAFFIC_WINDOWS;

export type TrafficPeriod = {
  visitors: number;
  pageViews: number;
  /** 0–100 from the 27 Sep 2026 Vercel dashboard. Null once that instant leaves the window. */
  bounceRate: number | null;
};

export type TrafficSource = "vercel" | "snapshot";

export type TrafficStats = {
  source: TrafficSource;
  periods: Record<TrafficPeriodKey, TrafficPeriod>;
};

export type BeaconHour = { hour: number; count: number };

export type SessionExtras = {
  /** Sessions with lastSeen >= the snapshot. Added on top of the Vercel baseline. */
  sinceSnapshot: number;
  /** Sessions with lastSeen inside each rolling window, used after the baseline ages out. */
  inWindow: Record<TrafficPeriodKey, number>;
};

const PERIOD_KEYS = Object.keys(TRAFFIC_WINDOWS) as TrafficPeriodKey[];

export function composeSnapshotPeriods(
  now: number,
  pageViewHours: BeaconHour[],
  sessions: SessionExtras,
): Record<TrafficPeriodKey, TrafficPeriod> {
  const periods = {} as Record<TrafficPeriodKey, TrafficPeriod>;

  for (const key of PERIOD_KEYS) {
    const windowMs = TRAFFIC_WINDOWS[key];
    const windowStart = now - windowMs;
    const baselineHeld = now - SNAPSHOT_AT_MS < windowMs;
    const base = VERCEL_SNAPSHOT[key];
    let pageViews = baselineHeld ? base.pageViews : 0;

    for (const row of pageViewHours) {
      if (row.count <= 0) continue;
      if (row.hour > now) continue;
      if (row.hour + HOUR_MS <= windowStart) continue;
      // Keep hours that ended before the snapshot inside the Vercel baseline only.
      if (baselineHeld && row.hour + HOUR_MS <= SNAPSHOT_AT_MS) continue;
      pageViews += row.count;
    }

    periods[key] = {
      visitors: baselineHeld ? base.visitors + sessions.sinceSnapshot : sessions.inWindow[key],
      pageViews,
      bounceRate: baselineHeld ? base.bounceRate : null,
    };
  }

  return periods;
}

export function periodsFromVercel(
  now: number,
  live: Record<TrafficPeriodKey, { visitors: number; pageViews: number }>,
): Record<TrafficPeriodKey, TrafficPeriod> {
  const periods = {} as Record<TrafficPeriodKey, TrafficPeriod>;
  for (const key of PERIOD_KEYS) {
    const baselineHeld = now - SNAPSHOT_AT_MS < TRAFFIC_WINDOWS[key];
    periods[key] = {
      visitors: live[key].visitors,
      pageViews: live[key].pageViews,
      bounceRate: baselineHeld ? VERCEL_SNAPSHOT[key].bounceRate : null,
    };
  }
  return periods;
}

export function vercelTotalsAreEmpty(
  live: Record<TrafficPeriodKey, { visitors: number; pageViews: number }>,
): boolean {
  return PERIOD_KEYS.every((key) => live[key].visitors === 0 && live[key].pageViews === 0);
}
