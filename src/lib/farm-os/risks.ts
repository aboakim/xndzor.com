/**
 * «Վաղվա վտանգը» — plot-personalized weather + crop heuristics.
 */

import type { WeatherForecast } from "@/lib/weather";

export type FarmRisk = {
  id: string;
  severity: "high" | "medium" | "low";
  titleKey: string;
  detailKey: string;
  detailParams?: Record<string, string | number>;
};

const FROST_SENSITIVE = new Set([
  "tomato",
  "cucumber",
  "grape",
  "peach",
  "potato",
]);

export function buildTomorrowRisks(input: {
  weather: WeatherForecast | null;
  cropSlug: string;
  harvestFrom: Date | null;
  harvestTo: Date | null;
  lastIrrigationAt: Date | null;
  now?: Date;
}): FarmRisk[] {
  const now = input.now ?? new Date();
  const risks: FarmRisk[] = [];
  const w = input.weather;

  if (w?.frostRisk48h && FROST_SENSITIVE.has(input.cropSlug)) {
    risks.push({
      id: "frost",
      severity: "high",
      titleKey: "farmOs.risks.frost",
      detailKey: "farmOs.risks.frostDetail",
      detailParams: {
        temp: w.frostMinTempC != null ? Math.round(w.frostMinTempC) : "—",
      },
    });
  } else if (w?.frostRisk48h) {
    risks.push({
      id: "frost-mild",
      severity: "medium",
      titleKey: "farmOs.risks.frostMild",
      detailKey: "farmOs.risks.frostMildDetail",
      detailParams: {
        temp: w.frostMinTempC != null ? Math.round(w.frostMinTempC) : "—",
      },
    });
  }

  if (w && (w.precipMm48h ?? 0) >= 10) {
    risks.push({
      id: "heavy-rain",
      severity: "medium",
      titleKey: "farmOs.risks.heavyRain",
      detailKey: "farmOs.risks.heavyRainDetail",
      detailParams: { mm: w.precipMm48h ?? 0 },
    });
  }

  if (w && (w.windMaxMs ?? 0) >= 12) {
    risks.push({
      id: "wind",
      severity: "medium",
      titleKey: "farmOs.risks.wind",
      detailKey: "farmOs.risks.windDetail",
      detailParams: { wind: Math.round(w.windMaxMs ?? 0) },
    });
  }

  if (w?.irrigationHint === "water_soon") {
    risks.push({
      id: "dry",
      severity: "medium",
      titleKey: "farmOs.risks.dry",
      detailKey: "farmOs.risks.dryDetail",
    });
  }

  if (input.harvestFrom && input.harvestTo) {
    const daysTo = Math.floor(
      (input.harvestFrom.getTime() - now.getTime()) / 86400000
    );
    if (daysTo <= 7 && daysTo >= -3) {
      const harvestOk = w?.harvestWindow === "good";
      risks.push({
        id: "harvest-window",
        severity: harvestOk ? "low" : "high",
        titleKey: harvestOk
          ? "farmOs.risks.harvestGood"
          : "farmOs.risks.harvestWatch",
        detailKey: harvestOk
          ? "farmOs.risks.harvestGoodDetail"
          : "farmOs.risks.harvestWatchDetail",
        detailParams: {
          from: input.harvestFrom.toISOString().slice(0, 10),
          to: input.harvestTo.toISOString().slice(0, 10),
        },
      });
    }
  }

  if (!input.lastIrrigationAt) {
    risks.push({
      id: "log-irrigation",
      severity: "low",
      titleKey: "farmOs.risks.logIrrigation",
      detailKey: "farmOs.risks.logIrrigationDetail",
    });
  }

  if (risks.length === 0) {
    risks.push({
      id: "calm",
      severity: "low",
      titleKey: "farmOs.risks.calm",
      detailKey: "farmOs.risks.calmDetail",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
}
