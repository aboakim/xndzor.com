/**
 * Rule-based «Ի՞նչ անել այսօր» heuristics — not AI certainty.
 */

export type TodaySuggestion = {
  kind: "IRRIGATION" | "PEST" | "WEATHER" | "HARVEST" | "INTEREST";
  titleKey: string;
  detailKey: string;
  detailParams?: Record<string, string | number>;
  priority: number;
};

const IRRIGATION_DAYS: Record<string, number> = {
  tomato: 3,
  potato: 5,
  grape: 7,
  apple: 10,
  wheat: 14,
  cucumber: 2,
  onion: 4,
  apricot: 10,
  other: 5,
};

/** Seasonal pest attention by month (1–12) — heuristic only */
const PEST_BY_MONTH: Record<number, { crops: string[]; titleKey: string; detailKey: string }> = {
  3: { crops: ["wheat", "potato"], titleKey: "today.pestSpring", detailKey: "today.pestSpringDetail" },
  4: { crops: ["tomato", "potato", "apple"], titleKey: "today.pestSpring", detailKey: "today.pestSpringDetail" },
  5: { crops: ["tomato", "grape", "apple"], titleKey: "today.pestMid", detailKey: "today.pestMidDetail" },
  6: { crops: ["tomato", "grape", "cucumber"], titleKey: "today.pestMid", detailKey: "today.pestMidDetail" },
  7: { crops: ["tomato", "grape", "apple"], titleKey: "today.pestSummer", detailKey: "today.pestSummerDetail" },
  8: { crops: ["tomato", "grape", "apple"], titleKey: "today.pestSummer", detailKey: "today.pestSummerDetail" },
  9: { crops: ["grape", "apple", "tomato"], titleKey: "today.pestHarvest", detailKey: "today.pestHarvestDetail" },
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildTodaySuggestions(input: {
  cropSlug: string;
  lastIrrigationAt: Date | null;
  harvestFrom: Date | null;
  harvestTo: Date | null;
  interestedBuyers: number;
  now?: Date;
}): TodaySuggestion[] {
  const now = input.now ?? new Date();
  const out: TodaySuggestion[] = [];
  const interval = IRRIGATION_DAYS[input.cropSlug] ?? IRRIGATION_DAYS.other;

  if (input.lastIrrigationAt) {
    const since = daysBetween(input.lastIrrigationAt, now);
    if (since >= interval) {
      out.push({
        kind: "IRRIGATION",
        titleKey: "today.irrigationDue",
        detailKey: "today.irrigationDueDetail",
        detailParams: { days: since, interval },
        priority: 10,
      });
    } else {
      out.push({
        kind: "IRRIGATION",
        titleKey: "today.irrigationOk",
        detailKey: "today.irrigationOkDetail",
        detailParams: { days: interval - since },
        priority: 2,
      });
    }
  } else {
    out.push({
      kind: "IRRIGATION",
      titleKey: "today.irrigationUnknown",
      detailKey: "today.irrigationUnknownDetail",
      detailParams: { interval },
      priority: 8,
    });
  }

  const month = now.getMonth() + 1;
  const pest = PEST_BY_MONTH[month];
  if (pest && pest.crops.includes(input.cropSlug)) {
    out.push({
      kind: "PEST",
      titleKey: pest.titleKey,
      detailKey: pest.detailKey,
      priority: 7,
    });
  }

  if (input.harvestFrom && input.harvestTo) {
    const daysTo = daysBetween(now, input.harvestFrom);
    if (daysTo <= 21 && daysTo >= -7) {
      out.push({
        kind: "HARVEST",
        titleKey: "today.harvestWindow",
        detailKey: "today.harvestWindowDetail",
        detailParams: {
          from: input.harvestFrom.toISOString().slice(0, 10),
          to: input.harvestTo.toISOString().slice(0, 10),
        },
        priority: 9,
      });
    }
  }

  if (input.interestedBuyers > 0) {
    out.push({
      kind: "INTEREST",
      titleKey: "today.buyersInterested",
      detailKey: "today.buyersInterestedDetail",
      detailParams: { n: input.interestedBuyers },
      priority: 11,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}

/** Days until next suggested watering */
export function nextWateringInDays(
  cropSlug: string,
  lastIrrigationAt: Date | null,
  now = new Date()
): number | null {
  const interval = IRRIGATION_DAYS[cropSlug] ?? IRRIGATION_DAYS.other;
  if (!lastIrrigationAt) return 0;
  const since = daysBetween(lastIrrigationAt, now);
  return Math.max(0, interval - since);
}
