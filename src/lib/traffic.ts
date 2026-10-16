import { listPageViewHours } from "./pageviews";
import { countSessionsSince, presenceStorageReady } from "./presence";
import {
  TRAFFIC_PERIOD_KEYS,
  TRACKING_SINCE_MS,
  VERCEL_ALLTIME_MAX_WINDOW_MS,
  composeFirstPartyPeriods,
  emptyTrafficPeriods,
  periodWindowStartMs,
  periodsFromVercel,
  type RollingTrafficWindowKey,
  type TrafficPeriodKey,
  type TrafficStats,
} from "./traffic-stats";

const CACHE_MS = 60_000;

type LiveCounts = Record<TrafficPeriodKey, { visitors: number; pageViews: number }>;

let cache: { at: number; value: TrafficStats } | null = null;
let lastVercelSuccessAt: number | null = null;

function vercelToken(): string {
  return process.env.VERCEL_ACCESS_TOKEN?.trim() ?? "";
}

function analyticsQuery(since?: Date, until?: Date): URLSearchParams {
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim() ||
    "xndzor-com";
  const params = new URLSearchParams({
    projectId,
    filter: "environment eq 'production'",
  });
  if (since) params.set("since", since.toISOString());
  if (until) params.set("until", until.toISOString());
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim();
  if (teamId) params.set("teamId", teamId);
  else params.set("slug", process.env.VERCEL_TEAM_SLUG?.trim() || "aboakim");
  return params;
}

function isoDateUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function vercelErrorReason(response: Response): Promise<string> {
  const status = response.status;
  let detail = "";
  try {
    const raw = (await response.text()).trim();
    if (raw) {
      try {
        const json = JSON.parse(raw) as { error?: { message?: string }; message?: string };
        const msg = json.error?.message ?? json.message;
        detail = typeof msg === "string" && msg.trim() ? msg.trim() : raw;
      } catch {
        detail = raw;
      }
      detail = detail.replace(/\s+/g, " ").slice(0, 160);
    }
  } catch {
    // ignore
  }
  return detail ? `${status}: ${detail}` : String(status);
}

function readCount(body: unknown): { visitors: number; pageViews: number } | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const visitors = (data as { visitors?: unknown }).visitors;
  const pageViews = (data as { pageviews?: unknown }).pageviews;
  if (typeof visitors !== "number" || typeof pageViews !== "number") return null;
  if (!Number.isFinite(visitors) || !Number.isFinite(pageViews)) return null;
  if (visitors < 0 || pageViews < 0) return null;
  return { visitors, pageViews };
}

async function fetchVercelCount(
  token: string,
  since?: Date,
  until?: Date,
): Promise<{ ok: true; data: { visitors: number; pageViews: number } } | { ok: false; error: string }> {
  const params = analyticsQuery(since, until);
  const response = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/visits/count?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) {
    return { ok: false, error: await vercelErrorReason(response) };
  }
  const parsed = readCount(await response.json());
  if (!parsed) return { ok: false, error: "bad-shape" };
  return { ok: true, data: parsed };
}

/** Rolling 24h / 7d windows (independent of all-time range limits). */
async function fetchVercelRollingWindow(
  key: RollingTrafficWindowKey,
  now: number,
  token: string,
): Promise<{ visitors: number; pageViews: number }> {
  const until = new Date(now);
  const since = new Date(periodWindowStartMs(key, now));
  const result = await fetchVercelCount(token, since, until);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

/**
 * All-time totals: prefer since tracking start, then plan retention window, then lifetime count (no dates).
 */
async function fetchVercelAllTime(
  now: number,
  token: string,
): Promise<{ visitors: number; pageViews: number; sinceMs: number }> {
  const until = new Date(now);
  const attempts: Array<{ since?: Date; until?: Date; sinceMs: number }> = [
    { since: new Date(TRACKING_SINCE_MS), until, sinceMs: TRACKING_SINCE_MS },
    {
      since: new Date(Math.max(now - VERCEL_ALLTIME_MAX_WINDOW_MS, TRACKING_SINCE_MS)),
      until,
      sinceMs: Math.max(now - VERCEL_ALLTIME_MAX_WINDOW_MS, TRACKING_SINCE_MS),
    },
    { sinceMs: TRACKING_SINCE_MS },
  ];

  let lastError = "error";
  for (const attempt of attempts) {
    const result = await fetchVercelCount(token, attempt.since, attempt.until);
    if (result.ok) {
      return { ...result.data, sinceMs: attempt.sinceMs };
    }
    lastError = result.error;
    if (!lastError.startsWith("400")) break;
  }
  throw new Error(lastError);
}

function statsEnvelope(
  now: number,
  tokenConfigured: boolean,
  source: TrafficStats["source"],
  periods: TrafficStats["periods"],
  vercelError: string | null,
  allTimeSinceDate: string | null = null,
): TrafficStats {
  return {
    source,
    fetchedAt: new Date(now).toISOString(),
    vercelTokenConfigured: tokenConfigured,
    lastVercelSuccessAt:
      lastVercelSuccessAt != null ? new Date(lastVercelSuccessAt).toISOString() : null,
    vercelError,
    allTimeSinceDate,
    periods,
  };
}

async function fetchVercelTraffic(
  now: number,
  token: string,
): Promise<{ ok: true; stats: TrafficStats } | { ok: false; error: string }> {
  const live = {} as LiveCounts;
  const errors: string[] = [];
  let allTimeSinceDate: string | null = null;

  const rollingKeys = ["h24", "d7"] as const;
  const rollingResults = await Promise.allSettled(
    rollingKeys.map(async (key) => [key, await fetchVercelRollingWindow(key, now, token)] as const),
  );
  for (let i = 0; i < rollingResults.length; i++) {
    const result = rollingResults[i];
    const key = rollingKeys[i];
    if (result.status === "fulfilled") {
      live[key] = result.value[1];
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : "error";
      errors.push(`[${key}] ${reason}`);
    }
  }

  let allTimeOk = false;
  try {
    const allTime = await fetchVercelAllTime(now, token);
    live.allTime = allTime;
    allTimeSinceDate = isoDateUtc(allTime.sinceMs);
    allTimeOk = true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "error";
    errors.push(`[allTime] ${reason}`);
    live.allTime = { visitors: 0, pageViews: 0 };
  }

  const anyOk = rollingResults.some((r) => r.status === "fulfilled") || allTimeOk;

  if (!anyOk) {
    const reason = errors.join("; ") || "error";
    console.warn("[traffic] Vercel Web Analytics unavailable", reason);
    return { ok: false, error: reason };
  }

  lastVercelSuccessAt = now;
  const vercelError = errors.length ? errors.join("; ") : null;
  if (vercelError) {
    console.warn("[traffic] Vercel Web Analytics partial failure", vercelError);
  }

  return {
    ok: true,
    stats: statsEnvelope(
      now,
      true,
      "vercel",
      periodsFromVercel(live),
      vercelError,
      allTimeSinceDate,
    ),
  };
}

async function sessionCountsForWindows(now: number): Promise<Record<TrafficPeriodKey, number>> {
  const counts = {} as Record<TrafficPeriodKey, number>;
  await Promise.all(
    TRAFFIC_PERIOD_KEYS.map(async (key) => {
      counts[key] = await countSessionsSince(periodWindowStartMs(key, now));
    }),
  );
  return counts;
}

async function firstPartyTraffic(now: number, tokenConfigured: boolean): Promise<TrafficStats> {
  const [pageViewHours, sessionsInWindow] = await Promise.all([
    listPageViewHours(TRACKING_SINCE_MS - 60 * 60 * 1000),
    sessionCountsForWindows(now),
  ]);

  return statsEnvelope(
    now,
    tokenConfigured,
    "first-party",
    composeFirstPartyPeriods(now, pageViewHours, sessionsInWindow),
    null,
  );
}

function disconnectedTraffic(now: number, tokenConfigured: boolean, vercelError: string): TrafficStats {
  return statsEnvelope(now, tokenConfigured, "disconnected", emptyTrafficPeriods(), vercelError);
}

export type PublicTrafficPeriod = {
  visitors: number;
  pageViews: number;
};

/** Aggregate totals for the public /stats page (first-party beacon only). */
export type PublicTrafficStats = {
  fetchedAt: string;
  /** True when session/pageview tables are reachable (counter is active). */
  trackingReady: boolean;
  periods: Record<TrafficPeriodKey, PublicTrafficPeriod>;
};

export async function getPublicTrafficStats(now = Date.now()): Promise<PublicTrafficStats> {
  const [firstParty, trackingReady] = await Promise.all([
    firstPartyTraffic(now, false),
    presenceStorageReady(),
  ]);

  const periods = {} as Record<TrafficPeriodKey, PublicTrafficPeriod>;
  for (const key of TRAFFIC_PERIOD_KEYS) {
    periods[key] = {
      visitors: firstParty.periods[key].visitors,
      pageViews: firstParty.periods[key].pageViews,
    };
  }

  return {
    fetchedAt: firstParty.fetchedAt,
    trackingReady,
    periods,
  };
}

/** Live Vercel Production totals when the token works; otherwise a disconnected state (no first-party substitute). */
export async function getTrafficStats(now = Date.now()): Promise<TrafficStats> {
  if (cache && now - cache.at < CACHE_MS) return cache.value;

  const token = vercelToken();
  const tokenConfigured = Boolean(token);

  if (!token) {
    const value = disconnectedTraffic(now, false, "missing-token");
    cache = { at: now, value };
    return value;
  }

  const result = await fetchVercelTraffic(now, token);
  const value = result.ok ? result.stats : disconnectedTraffic(now, true, result.error);
  cache = { at: now, value };
  return value;
}
