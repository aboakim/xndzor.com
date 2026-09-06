/**
 * Seed-to-sale timeline stages for a plot.
 */

export type TimelineStage = {
  id: string;
  labelKey: string;
  date: string | null;
  status: "done" | "current" | "upcoming" | "missing";
};

export function buildSeedToSaleTimeline(plot: {
  plantDate: Date;
  lastIrrigationAt: Date | null;
  lastFertilizer: string | null;
  harvestFrom: Date | null;
  harvestTo: Date | null;
  hasFutureHarvest: boolean;
  hasExpense: boolean;
  hasSale: boolean;
  now?: Date;
}): TimelineStage[] {
  const now = plot.now ?? new Date();
  const stages: Omit<TimelineStage, "status">[] = [
    {
      id: "plant",
      labelKey: "farmOs.timeline.plant",
      date: plot.plantDate.toISOString().slice(0, 10),
    },
    {
      id: "fertilizer",
      labelKey: "farmOs.timeline.fertilizer",
      date: plot.lastFertilizer ? "logged" : null,
    },
    {
      id: "irrigate",
      labelKey: "farmOs.timeline.irrigate",
      date: plot.lastIrrigationAt
        ? plot.lastIrrigationAt.toISOString().slice(0, 10)
        : null,
    },
    {
      id: "harvest",
      labelKey: "farmOs.timeline.harvest",
      date: plot.harvestFrom
        ? `${plot.harvestFrom.toISOString().slice(0, 10)}${
            plot.harvestTo
              ? ` → ${plot.harvestTo.toISOString().slice(0, 10)}`
              : ""
          }`
        : null,
    },
    {
      id: "presale",
      labelKey: "farmOs.timeline.presale",
      date: plot.hasFutureHarvest ? "listed" : null,
    },
    {
      id: "costs",
      labelKey: "farmOs.timeline.costs",
      date: plot.hasExpense ? "logged" : null,
    },
    {
      id: "sale",
      labelKey: "farmOs.timeline.sale",
      date: plot.hasSale ? "done" : null,
    },
  ];

  return stages.map((s) => {
    if (s.date == null) return { ...s, status: "missing" as const };
    if (s.id === "plant") {
      return {
        ...s,
        status: (plot.plantDate <= now ? "done" : "upcoming") as TimelineStage["status"],
      };
    }
    if (s.id === "harvest" && plot.harvestFrom) {
      if (plot.harvestTo && plot.harvestTo < now) return { ...s, status: "done" };
      if (plot.harvestFrom <= now) return { ...s, status: "current" };
      return { ...s, status: "upcoming" };
    }
    if (s.id === "sale" && plot.hasSale) return { ...s, status: "done" };
    if (s.id === "presale" && plot.hasFutureHarvest) return { ...s, status: "done" };
    if (s.id === "costs" && plot.hasExpense) return { ...s, status: "done" };
    if (s.id === "irrigate" && plot.lastIrrigationAt) return { ...s, status: "done" };
    if (s.id === "fertilizer" && plot.lastFertilizer) return { ...s, status: "done" };
    return { ...s, status: "upcoming" };
  });
}
