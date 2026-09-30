import { listPageViewHours } from "./pageviews";
import { countSessionsSince } from "./presence";
import {
  TRAFFIC_WINDOWS,
  composeFirstPartyPeriods,
  periodsFromVercel,
  vercelTotalsAreEmpty,
  type TrafficPeriodKey,
  type TrafficStats,
} from "./traffic-stats";

const PERIOD_KEYS = Object.keys(TRAFFIC_WINDOWS) as TrafficPeriodKey[];
const CACHE_MS = 60_000;

type LiveCounts = Record<TrafficPeriodKey, { visitors: number; pageViews: number }>;

let cache: { at: number; value: TrafficStats } | null = null;
let lastVercelSuccessAt: number | null = null;

function vercelToken(): string {
  return process.env.VERCEL_ACCESS_TOKEN?.trim() ?? "";
}

function analyticsQuery(since: Date, until: Date): URLSearchParams {
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim() ||
    "xndzor-com";
  const params = new URLSearchParams({
    projectId,
    since: since.toISOString(),
    until: until.toISOString(),
  });
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim();
  if (teamId) params.set("teamId", teamId);
  else params.set("slug", process.env.VERCEL_TEAM_SLUG?.trim() || "aboakim");
  return params;
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

async function fetchVercelWindow(
  key: TrafficPeriodKey,
  now: number,
  token: string,
): Promise<{ visitors: number; pageViews: number }> {
  const until = new Date(now);
  const since = new Date(now - TRAFFIC_WINDOWS[key]);
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
    throw new Error(String(response.status));
  }
  const parsed = readCount(await response.json());
  if (!parsed) throw new Error("bad-shape");
  return parsed;
}

function statsEnvelope(
  now: number,
  tokenConfigured: boolean,
  source: TrafficStats["source"],
  periods: TrafficStats["periods"],
): TrafficStats {
  return {
    source,
    fetchedAt: new Date(now).toISOString(),
    vercelTokenConfigured: tokenConfigured,
    lastVercelSuccessAt:
      lastVercelSuccessAt != null ? new Date(lastVercelSuccessAt).toISOString() : null,
    periods,
  };
}

async function fetchVercelTraffic(now: number, token: string): Promise<TrafficStats | null> {
  try {
    const rows = await Promise.all(
      PERIOD_KEYS.map(async (key) => [key, await fetchVercelWindow(key, now, token)] as const),
    );
    const live = Object.fromEntries(rows) as LiveCounts;
    if (vercelTotalsAreEmpty(live)) return null;
    lastVercelSuccessAt = now;
    return statsEnvelope(now, true, "vercel", periodsFromVercel(live));
  } catch (error) {
    const status = error instanceof Error ? error.message : "error";
    console.warn("[traffic] Vercel Web Analytics unavailable", status);
    return null;
  }
}

async function firstPartyTraffic(now: number, tokenConfigured: boolean): Promise<TrafficStats> {
  const [pageViewHours, h24, d7, d30] = await Promise.all([
    listPageViewHours(now - TRAFFIC_WINDOWS.d30 - 60 * 60 * 1000),
    countSessionsSince(now - TRAFFIC_WINDOWS.h24),
    countSessionsSince(now - TRAFFIC_WINDOWS.d7),
    countSessionsSince(now - TRAFFIC_WINDOWS.d30),
  ]);

  return statsEnvelope(
    now,
    tokenConfigured,
    "first-party",
    composeFirstPartyPeriods(now, pageViewHours, { h24, d7, d30 }),
  );
}

/** Live Vercel Production totals when the token works; otherwise first-party beacon totals. */
export async function getTrafficStats(now = Date.now()): Promise<TrafficStats> {
  if (cache && now - cache.at < CACHE_MS) return cache.value;

  const token = vercelToken();
  const tokenConfigured = Boolean(token);
  const live = token ? await fetchVercelTraffic(now, token) : null;
  const value = live ?? (await firstPartyTraffic(now, tokenConfigured));
  cache = { at: now, value };
  return value;
}
