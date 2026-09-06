/**
 * Xndzor Score — farm operating health (production / costs / water / storage / sales).
 * Separate from passport Farm Score (trust). Heuristic MVP for tips.
 */

export type HealthPillar = {
  id: "production" | "costs" | "water" | "storage" | "sales";
  score: number; // 0–100
  tipKey: string;
};

export type XndzorHealth = {
  overall: number;
  pillars: HealthPillar[];
};

export function computeXndzorHealth(input: {
  plotCount: number;
  totalHa: number;
  openTasks: number;
  expenseTotalAmd: number;
  expenseCount: number;
  diaryCount: number;
  spaceListingCount: number;
  activeSupplies: number;
  activeForward: number;
  lastIrrigationKnown: boolean;
}): XndzorHealth {
  const production = clamp(
    35 + input.plotCount * 12 + Math.min(25, input.totalHa * 2) - Math.min(20, input.openTasks * 3),
    15,
    98
  );
  const costs =
    input.expenseCount === 0
      ? 40
      : clamp(55 + Math.min(30, input.expenseCount * 5) - (input.expenseTotalAmd > 5_000_000 ? 10 : 0), 20, 95);
  const water = input.lastIrrigationKnown
    ? clamp(70 + (input.diaryCount > 0 ? 10 : 0), 40, 95)
    : 45;
  const storage = clamp(40 + input.spaceListingCount * 15, 25, 90);
  const sales = clamp(35 + input.activeSupplies * 12 + input.activeForward * 10, 20, 95);

  const pillars: HealthPillar[] = [
    {
      id: "production",
      score: production,
      tipKey:
        input.plotCount === 0
          ? "score.tips.addPlot"
          : input.openTasks > 3
            ? "score.tips.clearTasks"
            : "score.tips.keepPlots",
    },
    {
      id: "costs",
      score: costs,
      tipKey:
        input.expenseCount === 0 ? "score.tips.logExpenses" : "score.tips.reviewCosts",
    },
    {
      id: "water",
      score: water,
      tipKey: input.lastIrrigationKnown
        ? "score.tips.diaryWater"
        : "score.tips.recordIrrigation",
    },
    {
      id: "storage",
      score: storage,
      tipKey:
        input.spaceListingCount === 0
          ? "score.tips.listSpace"
          : "score.tips.useStorage",
    },
    {
      id: "sales",
      score: sales,
      tipKey:
        input.activeSupplies + input.activeForward === 0
          ? "score.tips.listHarvest"
          : "score.tips.followOffers",
    },
  ];

  const overall = Math.round(
    pillars.reduce((s, p) => s + p.score, 0) / pillars.length
  );

  return { overall, pillars };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}
