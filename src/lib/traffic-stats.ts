/**
 * Pure traffic math for the admin dashboard.
 * No database or tokens — safe to import from a client component as a type-only module.
 */

export const TRACKING_SINCE_LABEL = "2026-09-06";

/** First-party PageView / SiteSession tracking started (UTC midnight). */
export const TRACKING_SINCE_MS = Date.parse(`${TRACKING_SINCE_LABEL}T00:00:00.000Z`);

const HOUR_MS = 60 * 60 * 1000;

/** Max rolling window for Vercel all-time when an earlier `since` is rejected (Hobby retention ≈ 30d). */
export const VERCEL_ALLTIME_MAX_WINDOW_MS = 30 * 24 * HOUR_MS;

/** Rolling windows for 24h and 7d cards. All-time uses {@link TRACKING_SINCE_MS} via {@link periodWindowStartMs}. */
export const TRAFFIC_WINDOWS = {
  h24: 24 * HOUR_MS,
  d7: 7 * 24 * HOUR_MS,
} as const;

export type RollingTrafficWindowKey = keyof typeof TRAFFIC_WINDOWS;

/** Dashboard periods: rolling 24h/7d plus all-time since tracking start. */
export type TrafficPeriodKey = RollingTrafficWindowKey | "allTime";

export const TRAFFIC_PERIOD_KEYS: readonly TrafficPeriodKey[] = ["h24", "d7", "allTime"];

export function periodWindowStartMs(key: TrafficPeriodKey, now: number): number {
  if (key === "allTime") return TRACKING_SINCE_MS;
  return Math.max(now - TRAFFIC_WINDOWS[key], TRACKING_SINCE_MS);
}

export type TrafficPeriod = {
  visitors: number;
  pageViews: number;
  /** Not provided by Vercel Web Analytics API or first-party beacon. */
  bounceRate: number | null;
};

export type TrafficSource = "vercel" | "first-party" | "disconnected";

export type TrafficStats = {
  source: TrafficSource;
  /** When these totals were computed (ISO 8601). */
  fetchedAt: string;
  /** True when VERCEL_ACCESS_TOKEN is set in the environment. */
  vercelTokenConfigured: boolean;
  /** Last time a Vercel API fetch succeeded (ISO), or null if never / no token. */
  lastVercelSuccessAt: string | null;
  /** HTTP status, `missing-token`, `bad-shape`, etc. — never includes secrets. */
  vercelError: string | null;
  /** YYYY-MM-DD start of the all-time Vercel query (null when not from Vercel). */
  allTimeSinceDate: string | null;
  periods: Record<TrafficPeriodKey, TrafficPeriod>;
};

export type BeaconHour = { hour: number; count: number };

/** Rolling totals from hourly pageviews and session heartbeats only. */
export function composeFirstPartyPeriods(
  now: number,
  pageViewHours: BeaconHour[],
  sessionsInWindow: Record<TrafficPeriodKey, number>,
): Record<TrafficPeriodKey, TrafficPeriod> {
  const periods = {} as Record<TrafficPeriodKey, TrafficPeriod>;

  for (const key of TRAFFIC_PERIOD_KEYS) {
    const windowStart = periodWindowStartMs(key, now);
    let pageViews = 0;

    for (const row of pageViewHours) {
      if (row.count <= 0) continue;
      if (row.hour > now) continue;
      if (row.hour + HOUR_MS <= windowStart) continue;
      pageViews += row.count;
    }

    periods[key] = {
      visitors: sessionsInWindow[key],
      pageViews,
      bounceRate: null,
    };
  }

  return periods;
}

export function periodsFromVercel(
  live: Record<TrafficPeriodKey, { visitors: number; pageViews: number }>,
): Record<TrafficPeriodKey, TrafficPeriod> {
  const periods = {} as Record<TrafficPeriodKey, TrafficPeriod>;
  for (const key of TRAFFIC_PERIOD_KEYS) {
    periods[key] = {
      visitors: live[key].visitors,
      pageViews: live[key].pageViews,
      bounceRate: null,
    };
  }
  return periods;
}

export function vercelTotalsAreEmpty(
  live: Record<TrafficPeriodKey, { visitors: number; pageViews: number }>,
): boolean {
  return TRAFFIC_PERIOD_KEYS.every((key) => live[key].visitors === 0 && live[key].pageViews === 0);
}

export function emptyTrafficPeriods(): Record<TrafficPeriodKey, TrafficPeriod> {
  const periods = {} as Record<TrafficPeriodKey, TrafficPeriod>;
  for (const key of TRAFFIC_PERIOD_KEYS) {
    periods[key] = { visitors: 0, pageViews: 0, bounceRate: null };
  }
  return periods;
}
