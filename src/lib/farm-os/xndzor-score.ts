/**
 * Xndzor Score — farm health breakdown extending Farm Score.
 * Axes: production, cost mgmt, water, storage, sales (each 0–100 contribution averaged).
 */

import { prisma } from "@/lib/prisma";
import { getFarmScore, type FarmScoreResult } from "@/lib/farm-score";

export type XndzorAxis = {
  id: "production" | "cost" | "water" | "storage" | "sales";
  score: number; // 0–100
};

export type XndzorScoreResult = {
  overall: number;
  axes: XndzorAxis[];
  farmScore: FarmScoreResult;
  tips: { from: number; to: number; tipKey: string }[];
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function getXndzorScore(userId: string): Promise<XndzorScoreResult | null> {
  const farmScore = await getFarmScore(userId);
  if (!farmScore) return null;

  const [plots, expenses, diaryCount, supplies, harvests, spaces] = await Promise.all([
    prisma.plot.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      select: {
        hectares: true,
        lastIrrigationAt: true,
        harvestFrom: true,
        yieldEstimate: true,
        futureHarvests: { select: { id: true }, take: 1 },
      },
    }),
    prisma.farmExpense.findMany({
      where: { userId },
      select: { amountAmd: true, category: true },
    }),
    prisma.farmDiaryEntry.count({ where: { userId } }),
    prisma.supply.count({ where: { userId, status: "ACTIVE" } }),
    prisma.futureHarvest.count({
      where: { userId, status: { in: ["ACTIVE", "RESERVED", "SOLD"] } },
    }),
    prisma.spaceListing.count({ where: { userId, status: "ACTIVE" } }),
  ]);

  // Production: plots + yield estimates + ha
  const withYield = plots.filter((p) => p.yieldEstimate).length;
  const production = clamp(
    (plots.length > 0 ? 35 : 10) +
      (withYield / Math.max(plots.length, 1)) * 40 +
      Math.min(farmScore.stats.plotHa * 3, 25)
  );

  // Cost mgmt: expense logging diversity
  const cats = new Set(expenses.map((e) => e.category));
  const expenseTotal = expenses.reduce((s, e) => s + e.amountAmd, 0);
  const cost = clamp(
    (expenses.length === 0 ? 25 : 40 + Math.min(expenses.length * 5, 30)) +
      cats.size * 6 +
      (expenseTotal > 0 ? 10 : 0) -
      (expenses.length === 0 ? 0 : 0)
  );

  // Water: irrigation logs + diary
  const irrigated = plots.filter((p) => p.lastIrrigationAt).length;
  const water = clamp(
    (plots.length === 0 ? 40 : (irrigated / plots.length) * 70) +
      Math.min(diaryCount * 4, 20) +
      10
  );

  // Storage awareness: space listings or harvest windows planned
  const withHarvest = plots.filter((p) => p.harvestFrom).length;
  const storage = clamp(
    30 +
      spaces * 25 +
      (withHarvest / Math.max(plots.length, 1)) * 35 +
      (harvests > 0 ? 10 : 0)
  );

  // Sales: linked harvests, supplies, deals from farm score
  const sales = clamp(
    farmScore.breakdown.deals * 2.5 +
      Math.min(supplies * 12, 30) +
      Math.min(harvests * 10, 30) +
      (farmScore.stats.successfulDeals > 0 ? 15 : 5)
  );

  const axes: XndzorAxis[] = [
    { id: "production", score: production },
    { id: "cost", score: cost },
    { id: "water", score: water },
    { id: "storage", score: storage },
    { id: "sales", score: sales },
  ];

  const overall = clamp(
    axes.reduce((s, a) => s + a.score, 0) / axes.length
  );

  const tips: XndzorScoreResult["tips"] = [];
  const weakest = [...axes].sort((a, b) => a.score - b.score)[0];
  if (weakest) {
    const bump = Math.min(7, 100 - overall);
    tips.push({
      from: overall,
      to: overall + bump,
      tipKey: `farmOs.score.tips.${weakest.id}`,
    });
  }
  if (expenses.length === 0) {
    tips.push({
      from: overall,
      to: Math.min(100, overall + 5),
      tipKey: "farmOs.score.tips.logCosts",
    });
  }
  if (farmScore.stats.batchCount === 0) {
    tips.push({
      from: overall,
      to: Math.min(100, overall + 4),
      tipKey: "farmOs.score.tips.batch",
    });
  }

  return { overall, axes, farmScore, tips: tips.slice(0, 3) };
}
