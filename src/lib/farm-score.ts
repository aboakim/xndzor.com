/**
 * Farm Score (Agricultural Reliability Score) — 0–100
 *
 * Honest label: based on platform activity only (not national statistics
 * or external credit). See FARM_SCORE.md.
 */

import { prisma } from "@/lib/prisma";

export const TRUSTED_SCORE_MIN = 75;

export type FarmScoreBand =
  | "highly_reliable"
  | "reliable"
  | "building"
  | "new"
  | "at_risk";

export type FarmScoreBreakdown = {
  deals: number; // 0–30
  ratings: number; // 0–25
  consistency: number; // 0–20
  activity: number; // 0–15
  penalties: number; // 0 to −10 (stored negative)
};

export type FarmScoreResult = {
  score: number;
  band: FarmScoreBand;
  bandColor: string;
  breakdown: FarmScoreBreakdown;
  stats: FarmPassportStats;
  trusted: boolean;
};

export type FarmPassportStats = {
  tonsSold: number;
  successfulDeals: number;
  buyerRatingAvg: number | null;
  ratingCount: number;
  onTimePct: number | null;
  /** Demo/seed formula flag for UI honesty */
  onTimeIsEstimate: boolean;
  plotHa: number;
  mainCrops: { slug: string; nameKey: string; ha: number }[];
  livestockCount: number;
  machineryCount: number;
  batchCount: number;
  accountAgeDays: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function qtyToTons(qty: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "ton" || u === "t" || u === "tons") return qty;
  if (u === "kg") return qty / 1000;
  return qty; // unknown → treat as tons-ish for MVP
}

export function bandForScore(score: number): FarmScoreBand {
  if (score >= 90) return "highly_reliable";
  if (score >= 75) return "reliable";
  if (score >= 55) return "building";
  if (score >= 35) return "new";
  return "at_risk";
}

export function colorForBand(band: FarmScoreBand): string {
  switch (band) {
    case "highly_reliable":
      return "#0f4a3c";
    case "reliable":
      return "#1a6b54";
    case "building":
      return "#8a6a1f";
    case "new":
      return "#5a6570";
    case "at_risk":
      return "#8b3a2f";
  }
}

type ScoreInput = {
  createdAt: Date;
  farmVerified: boolean;
  plots: {
    hectares: number;
    status: string;
    cropProduct: { slug: string; nameKey: string };
    futureHarvests: { id: string }[];
  }[];
  futureHarvests: {
    id: string;
    status: string;
    qtyExpected: number;
    unit: string;
    harvestDate: Date;
    plotId: string | null;
    preOffers: { status: string; qtyWanted: number }[];
  }[];
  supplies: { status: string; qtyAvailable: number; unit: string }[];
  offersAsFarmer: { status: string }[];
  farmReviews: { rating: number }[];
  listingRatings: { rating: number | null }[];
  animalQty: number;
  machineryCount: number;
  batchCount: number;
  now?: Date;
};

export function computeFarmScoreFromData(input: ScoreInput): FarmScoreResult {
  const now = input.now ?? new Date();
  const ageMs = now.getTime() - input.createdAt.getTime();
  const accountAgeDays = Math.max(0, Math.floor(ageMs / 86400000));

  // --- Successful deals ---
  // Pre-offers RESERVED on this farmer's harvests + future harvests SOLD
  // + Offer ACCEPTED where farmer is supply owner (offersAsFarmer)
  let successfulDeals = 0;
  let tonsSold = 0;
  let cancelledOrDeclined = 0;
  let reservedOnTime = 0;
  let reservedTotal = 0;

  for (const fh of input.futureHarvests) {
    if (fh.status === "SOLD") {
      successfulDeals += 1;
      tonsSold += qtyToTons(fh.qtyExpected, fh.unit);
    }
    for (const po of fh.preOffers) {
      if (po.status === "RESERVED") {
        successfulDeals += 1;
        tonsSold += qtyToTons(po.qtyWanted, fh.unit);
        reservedTotal += 1;
        // On-time estimate: harvest still in future or within 14d past = on time
        const lag = now.getTime() - fh.harvestDate.getTime();
        if (lag < 14 * 86400000) reservedOnTime += 1;
      } else if (po.status === "DECLINED") {
        cancelledOrDeclined += 1;
      }
    }
    if (fh.status === "HIDDEN") cancelledOrDeclined += 1;
  }

  for (const o of input.offersAsFarmer) {
    if (o.status === "ACCEPTED" || o.status === "COMPLETED") {
      successfulDeals += 1;
    } else if (o.status === "DECLINED" || o.status === "CANCELLED") {
      cancelledOrDeclined += 1;
    }
  }

  // Fulfilled supplies marked SOLD contribute tonnage (honest: listing status)
  for (const s of input.supplies) {
    if (s.status === "SOLD") {
      successfulDeals += 1;
      tonsSold += qtyToTons(s.qtyAvailable, s.unit);
    }
  }

  // Deals component 0–30
  const dealsScore = clamp(successfulDeals * 6, 0, 30);

  // Ratings 0–25 — FarmReview preferred; fall back to listing Comment ratings
  const reviewRatings = input.farmReviews.map((r) => r.rating);
  const listingRatings = input.listingRatings
    .map((r) => r.rating)
    .filter((r): r is number => r != null && r >= 1 && r <= 5);
  const allRatings = reviewRatings.length > 0 ? reviewRatings : listingRatings;
  const ratingCount = allRatings.length;
  const buyerRatingAvg =
    ratingCount > 0
      ? allRatings.reduce((a, b) => a + b, 0) / ratingCount
      : null;
  let ratingsScore = 8; // neutral baseline with no reviews
  if (buyerRatingAvg != null) {
    ratingsScore = clamp(((buyerRatingAvg - 1) / 4) * 25, 0, 25);
  }

  // Consistency 0–20 — plots with linked future harvests, active plots
  const activePlots = input.plots.filter((p) => p.status === "ACTIVE");
  const plotHa = input.plots.reduce((s, p) => s + (p.hectares || 0), 0);
  const plotsWithHarvest = activePlots.filter(
    (p) => p.futureHarvests.length > 0
  ).length;
  const harvestLinkedRatio =
    activePlots.length === 0 ? 0.4 : plotsWithHarvest / activePlots.length;
  const hasYieldSignal = input.futureHarvests.length > 0 || plotHa > 0;
  const consistencyScore = clamp(
    Math.round(
      harvestLinkedRatio * 12 +
        (hasYieldSignal ? 5 : 0) +
        (input.batchCount > 0 ? 3 : 0)
    ),
    0,
    20
  );

  // Activity / account age 0–15
  const listingActivity =
    input.futureHarvests.length +
    input.supplies.length +
    input.machineryCount +
    (input.animalQty > 0 ? 1 : 0);
  const agePts = clamp(accountAgeDays / 30, 0, 8); // ~8 pts at 8 months
  const actPts = clamp(listingActivity * 1.2, 0, 7);
  const activityScore = clamp(Math.round(agePts + actPts), 0, 15);

  // Penalties 0 to −10
  const penaltyRaw = cancelledOrDeclined * 2;
  const penalties = -clamp(penaltyRaw, 0, 10);

  // Verified bump (+3 capped into total)
  const verifiedBump = input.farmVerified ? 3 : 0;

  const raw =
    dealsScore +
    ratingsScore +
    consistencyScore +
    activityScore +
    penalties +
    verifiedBump;
  const score = clamp(Math.round(raw), 0, 100);
  const band = bandForScore(score);

  const cropMap = new Map<string, { slug: string; nameKey: string; ha: number }>();
  for (const p of input.plots) {
    if (p.status === "ARCHIVED") continue;
    const cur = cropMap.get(p.cropProduct.slug) || {
      slug: p.cropProduct.slug,
      nameKey: p.cropProduct.nameKey,
      ha: 0,
    };
    cur.ha += p.hectares;
    cropMap.set(p.cropProduct.slug, cur);
  }
  const mainCrops = [...cropMap.values()].sort((a, b) => b.ha - a.ha).slice(0, 5);

  const onTimePct =
    reservedTotal > 0
      ? Math.round((reservedOnTime / reservedTotal) * 100)
      : successfulDeals > 0
        ? 92 // labeled estimate when we have deals but no timing sample
        : null;

  return {
    score,
    band,
    bandColor: colorForBand(band),
    breakdown: {
      deals: dealsScore,
      ratings: Math.round(ratingsScore),
      consistency: consistencyScore,
      activity: activityScore,
      penalties,
    },
    trusted: score >= TRUSTED_SCORE_MIN,
    stats: {
      tonsSold: Math.round(tonsSold * 10) / 10,
      successfulDeals,
      buyerRatingAvg:
        buyerRatingAvg != null
          ? Math.round(buyerRatingAvg * 10) / 10
          : null,
      ratingCount,
      onTimePct,
      onTimeIsEstimate: reservedTotal === 0 && successfulDeals > 0,
      plotHa: Math.round(plotHa * 10) / 10,
      mainCrops,
      livestockCount: input.animalQty,
      machineryCount: input.machineryCount,
      batchCount: input.batchCount,
      accountAgeDays,
    },
  };
}

/** Load user activity and compute Farm Score. */
export async function getFarmScore(userId: string): Promise<FarmScoreResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      farmVerified: true,
      plots: {
        select: {
          hectares: true,
          status: true,
          cropProduct: { select: { slug: true, nameKey: true } },
          futureHarvests: { select: { id: true }, where: { status: { not: "HIDDEN" } } },
        },
      },
      futureHarvests: {
        select: {
          id: true,
          status: true,
          qtyExpected: true,
          unit: true,
          harvestDate: true,
          plotId: true,
          preOffers: { select: { status: true, qtyWanted: true } },
        },
      },
      supplies: {
        select: { status: true, qtyAvailable: true, unit: true },
      },
      farmReviewsReceived: { select: { rating: true } },
      animalListings: {
        where: { status: { in: ["ACTIVE", "SOLD"] } },
        select: { quantity: true },
      },
      machineryListings: {
        where: { status: { in: ["ACTIVE", "SOLD"] } },
        select: { id: true },
      },
      productBatches: {
        where: { status: "PUBLISHED" },
        select: { id: true },
      },
    },
  });
  if (!user) return null;

  const supplyIds = await prisma.supply.findMany({
    where: { userId },
    select: { id: true },
  });
  const offersAsFarmer =
    supplyIds.length === 0
      ? []
      : await prisma.offer.findMany({
          where: { supplyId: { in: supplyIds.map((s) => s.id) } },
          select: { status: true },
        });

  const listingIds = [
    ...(
      await prisma.machineryListing.findMany({
        where: { userId },
        select: { id: true },
      })
    ).map((x) => x.id),
    ...(
      await prisma.animalListing.findMany({
        where: { userId },
        select: { id: true },
      })
    ).map((x) => x.id),
  ];
  const listingRatings =
    listingIds.length === 0
      ? []
      : await prisma.comment.findMany({
          where: {
            targetId: { in: listingIds },
            rating: { not: null },
          },
          select: { rating: true },
        });

  return computeFarmScoreFromData({
    createdAt: user.createdAt,
    farmVerified: user.farmVerified,
    plots: user.plots,
    futureHarvests: user.futureHarvests,
    supplies: user.supplies,
    offersAsFarmer,
    farmReviews: user.farmReviewsReceived,
    listingRatings,
    animalQty: user.animalListings.reduce((s, a) => s + a.quantity, 0),
    machineryCount: user.machineryListings.length,
    batchCount: user.productBatches.length,
  });
}

/** Batch-load trusted flags for listing cards (userId → score snippet). */
export async function getFarmScoreSnippets(
  userIds: string[]
): Promise<Map<string, { score: number; trusted: boolean; farmId: string | null }>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<
    string,
    { score: number; trusted: boolean; farmId: string | null }
  >();
  await Promise.all(
    unique.map(async (id) => {
      const [score, user] = await Promise.all([
        getFarmScore(id),
        prisma.user.findUnique({
          where: { id },
          select: { farmId: true },
        }),
      ]);
      if (score) {
        map.set(id, {
          score: score.score,
          trusted: score.trusted,
          farmId: user?.farmId ?? null,
        });
      }
    })
  );
  return map;
}
