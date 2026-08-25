/**
 * Matching rules (MVP)
 * ----------------------
 * A Supply matches a Demand when ALL hard filters pass, then a score ranks results.
 *
 * Hard filters:
 * 1. Same productId
 * 2. Same unit (kg/ton/liter/piece/box) — no conversion in MVP
 * 3. Quantity: supply.qtyAvailable >= demand.qtyMin
 *    (if demand.qtyMax is set, supply must also be <= demand.qtyMax * 1.25 soft cap
 *     for hard filter we only require >= qtyMin; oversized supply still matches
 *     but scores lower)
 * 4. Both status ACTIVE
 * 5. Price (if both sides set a range/price): supply.priceAmd falls within
 *    [demand.priceMinAmd ?? 0, demand.priceMaxAmd ?? Infinity]
 *    If either side has no price, price does not block the match.
 *
 * Soft scoring (higher = better):
 * - Same marz: +50
 * - Adjacent marz: +25
 * - Other marz: +5 (still shown; logistics on the parties)
 * - Qty fit: +20 if supply within [qtyMin, qtyMax], else +10 if only >= qtyMin
 * - Price mid-band: +15 if price near midpoint of demand range
 * - Readiness: +10 if readyInDays === 0, +5 if ready within 14 days
 */

export const ADJACENT_MARZES: Record<string, string[]> = {
  Yerevan: ["Kotayk", "Ararat", "Armavir"],
  Aragatsotn: ["Shirak", "Armavir", "Kotayk", "Lori"],
  Ararat: ["Armavir", "Yerevan", "Kotayk", "VayotsDzor"],
  Armavir: ["Aragatsotn", "Yerevan", "Ararat"],
  Gegharkunik: ["Kotayk", "VayotsDzor", "Tavush", "Lori"],
  Kotayk: ["Yerevan", "Aragatsotn", "Gegharkunik", "Ararat", "Lori"],
  Lori: ["Shirak", "Aragatsotn", "Tavush", "Kotayk", "Gegharkunik"],
  Shirak: ["Lori", "Aragatsotn"],
  Syunik: ["VayotsDzor"],
  Tavush: ["Lori", "Gegharkunik"],
  VayotsDzor: ["Ararat", "Gegharkunik", "Syunik"],
};

export type MatchableDemand = {
  id: string;
  productId: string;
  qtyMin: number;
  qtyMax: number | null;
  unit: string;
  priceMinAmd: number | null;
  priceMaxAmd: number | null;
  marzId: string;
  status: string;
  userId: string;
};

export type MatchableSupply = {
  id: string;
  productId: string;
  qtyAvailable: number;
  unit: string;
  priceAmd: number | null;
  readyInDays: number;
  marzId: string;
  status: string;
  userId: string;
};

export type MatchResult = {
  supplyId: string;
  demandId: string;
  score: number;
  reasons: string[];
};

function locationScore(a: string, b: string): { points: number; reason: string } {
  if (a === b) return { points: 50, reason: "same_marz" };
  if (ADJACENT_MARZES[a]?.includes(b)) return { points: 25, reason: "adjacent_marz" };
  return { points: 5, reason: "distant_marz" };
}

function priceOk(supply: MatchableSupply, demand: MatchableDemand): boolean {
  if (supply.priceAmd == null) return true;
  if (demand.priceMinAmd == null && demand.priceMaxAmd == null) return true;
  const min = demand.priceMinAmd ?? 0;
  const max = demand.priceMaxAmd ?? Number.POSITIVE_INFINITY;
  return supply.priceAmd >= min && supply.priceAmd <= max;
}

export function scoreSupplyAgainstDemand(
  supply: MatchableSupply,
  demand: MatchableDemand
): MatchResult | null {
  if (supply.status !== "ACTIVE" || demand.status !== "ACTIVE") return null;
  if (supply.productId !== demand.productId) return null;
  if (supply.unit !== demand.unit) return null;
  if (supply.userId === demand.userId) return null;
  if (supply.qtyAvailable < demand.qtyMin) return null;
  if (!priceOk(supply, demand)) return null;

  const reasons: string[] = ["same_product", "qty_enough"];
  let score = 30;

  const loc = locationScore(supply.marzId, demand.marzId);
  score += loc.points;
  reasons.push(loc.reason);

  if (demand.qtyMax != null && supply.qtyAvailable <= demand.qtyMax) {
    score += 20;
    reasons.push("qty_in_range");
  } else if (demand.qtyMax != null && supply.qtyAvailable > demand.qtyMax) {
    score += 8;
    reasons.push("qty_over_max");
  } else {
    score += 12;
  }

  if (supply.priceAmd != null && (demand.priceMinAmd != null || demand.priceMaxAmd != null)) {
    score += 15;
    reasons.push("price_overlap");
  }

  if (supply.readyInDays === 0) {
    score += 10;
    reasons.push("ready_now");
  } else if (supply.readyInDays <= 14) {
    score += 5;
    reasons.push("ready_soon");
  }

  return { supplyId: supply.id, demandId: demand.id, score, reasons };
}

export function findMatchesForSupply(
  supply: MatchableSupply,
  demands: MatchableDemand[]
): MatchResult[] {
  return demands
    .map((d) => scoreSupplyAgainstDemand(supply, d))
    .filter((m): m is MatchResult => m != null)
    .sort((a, b) => b.score - a.score);
}

export function findMatchesForDemand(
  demand: MatchableDemand,
  supplies: MatchableSupply[]
): MatchResult[] {
  return supplies
    .map((s) => scoreSupplyAgainstDemand(s, demand))
    .filter((m): m is MatchResult => m != null)
    .sort((a, b) => b.score - a.score);
}

/** Job marketplace matching (NOT machinery classifieds) */
export const JOB_TYPES = [
  "PLOW",
  "SOW",
  "SPRAY",
  "HARVEST",
  "TRANSPORT",
  "PRUNE",
  "GREENHOUSE",
  "CONSULT",
  "OTHER",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export type MatchableJob = {
  id: string;
  jobType: string;
  hectares: number | null;
  workDate: Date | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  marzId: string;
  status: string;
  userId: string;
};

export type MatchableProvider = {
  id: string;
  jobTypes: string[];
  hectaresMax: number | null;
  availableFrom: Date | null;
  availableTo: Date | null;
  marzId: string;
  status: string;
  userId: string;
};

export type JobMatchResult = {
  jobRequestId: string;
  providerId: string;
  score: number;
  reasons: string[];
};

function parseDay(d: Date | null): number | null {
  return d ? new Date(d).setHours(0, 0, 0, 0) : null;
}

function dateWindowOk(job: MatchableJob, provider: MatchableProvider): boolean {
  const work = parseDay(job.workDate) ?? parseDay(job.dateFrom);
  if (work == null) return true;
  const from = parseDay(provider.availableFrom);
  const to = parseDay(provider.availableTo);
  if (from == null && to == null) return true;
  if (from != null && work < from) return false;
  if (to != null && work > to) return false;
  return true;
}

export function scoreProviderForJob(
  provider: MatchableProvider,
  job: MatchableJob
): JobMatchResult | null {
  if (provider.status !== "ACTIVE" || job.status !== "ACTIVE") return null;
  if (provider.userId === job.userId) return null;
  if (!provider.jobTypes.includes(job.jobType)) return null;
  if (job.hectares != null && provider.hectaresMax != null && job.hectares > provider.hectaresMax) {
    return null;
  }
  if (!dateWindowOk(job, provider)) return null;

  const reasons: string[] = ["same_job_type"];
  let score = 40;

  const loc = locationScore(provider.marzId, job.marzId);
  score += loc.points;
  reasons.push(loc.reason);

  if (job.hectares != null && provider.hectaresMax != null) {
    score += 15;
    reasons.push("capacity_ok");
  }
  if (job.workDate || job.dateFrom) {
    score += 10;
    reasons.push("date_ok");
  }

  return { jobRequestId: job.id, providerId: provider.id, score, reasons };
}

export function findProvidersForJob(
  job: MatchableJob,
  providers: MatchableProvider[]
): JobMatchResult[] {
  return providers
    .map((p) => scoreProviderForJob(p, job))
    .filter((m): m is JobMatchResult => m != null)
    .sort((a, b) => b.score - a.score);
}

export function findJobsForProvider(
  provider: MatchableProvider,
  jobs: MatchableJob[]
): JobMatchResult[] {
  return jobs
    .map((j) => scoreProviderForJob(provider, j))
    .filter((m): m is JobMatchResult => m != null)
    .sort((a, b) => b.score - a.score);
}

export function parseJobTypesJson(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
