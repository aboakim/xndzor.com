/**
 * MVP rule-based yield tables (Armenia-oriented rough ranges).
 * Assumptions: open-field averages; irrigation & fertility not modelled beyond farmer notes.
 * Not agronomic advice — editable by farmer.
 */

export type YieldRange = {
  tonsPerHaMin: number;
  tonsPerHaMax: number;
  assumptionHy: string;
  assumptionEn: string;
  assumptionRu: string;
};

/** Tons per hectare by product slug */
export const YIELD_TABLE: Record<string, YieldRange> = {
  tomato: {
    tonsPerHaMin: 25,
    tonsPerHaMax: 45,
    assumptionHy: "Բաց դաշտ · ոռոգվող · միջին սորտ · առանց ջերմոցի խտության",
    assumptionEn: "Open field · irrigated · mid cultivar · not greenhouse density",
    assumptionRu: "Открытое поле · полив · средний сорт · не тепличная плотность",
  },
  potato: {
    tonsPerHaMin: 18,
    tonsPerHaMax: 30,
    assumptionHy: "Միջին բերքատվություն ՀՀ պայմաններում · ոռոգում ենթադրված",
    assumptionEn: "Typical Armenia mid-range · irrigation assumed",
    assumptionRu: "Типичный средний диапазон в РА · полив предполагается",
  },
  grape: {
    tonsPerHaMin: 6,
    tonsPerHaMax: 12,
    assumptionHy: "Խաղողի այգի · սեղանի/գինու միջին · առանց երաշտի սցենարի",
    assumptionEn: "Vineyard mid-range · table/wine · no drought scenario",
    assumptionRu: "Виноградник · средний диапазон · без засухи",
  },
  apple: {
    tonsPerHaMin: 12,
    tonsPerHaMax: 25,
    assumptionHy: "Պտղատու · միջին խտություն · առանց խիստ ցրտահարության",
    assumptionEn: "Orchard mid density · no severe frost scenario",
    assumptionRu: "Сад · средняя плотность · без сильных заморозков",
  },
  wheat: {
    tonsPerHaMin: 2.5,
    tonsPerHaMax: 4.5,
    assumptionHy: "Ցորեն · ոչ ոռոգվող/մասամբ ոռոգվող միջին ՀՀ",
    assumptionEn: "Wheat · rainfed/partial irrigation Armenia mid",
    assumptionRu: "Пшеница · богар / частичный полив, средний РА",
  },
  cucumber: {
    tonsPerHaMin: 20,
    tonsPerHaMax: 40,
    assumptionHy: "Բաց դաշտ · ոռոգվող",
    assumptionEn: "Open field · irrigated",
    assumptionRu: "Открытое поле · полив",
  },
  onion: {
    tonsPerHaMin: 15,
    tonsPerHaMax: 28,
    assumptionHy: "Սոխ · ոռոգվող բաց դաշտ",
    assumptionEn: "Onion · irrigated open field",
    assumptionRu: "Лук · полив, открытое поле",
  },
  apricot: {
    tonsPerHaMin: 8,
    tonsPerHaMax: 16,
    assumptionHy: "Ծիրան · միջին այգի",
    assumptionEn: "Apricot · mid orchard",
    assumptionRu: "Абрикос · средний сад",
  },
  peach: {
    tonsPerHaMin: 10,
    tonsPerHaMax: 20,
    assumptionHy: "Դեղձ · միջին այգի · ոռոգվող",
    assumptionEn: "Peach · mid orchard · irrigated",
    assumptionRu: "Персик · средний сад · полив",
  },
  other: {
    tonsPerHaMin: 3,
    tonsPerHaMax: 8,
    assumptionHy: "Ընդհանուր գնահատական — խմբագրեք ձեռքով",
    assumptionEn: "Generic placeholder — edit manually",
    assumptionRu: "Общая оценка — отредактируйте вручную",
  },
};

export function estimateYieldTons(
  productSlug: string,
  hectares: number,
  locale = "en"
): {
  tonsMin: number;
  tonsMax: number;
  assumptionNote: string;
  tonsPerHaMin: number;
  tonsPerHaMax: number;
} {
  const row = YIELD_TABLE[productSlug] || YIELD_TABLE.other;
  const ha = Math.max(0.01, hectares);
  const assumptionNote =
    locale === "hy" ? row.assumptionHy : locale === "ru" ? row.assumptionRu : row.assumptionEn;
  return {
    tonsMin: Math.round(row.tonsPerHaMin * ha * 10) / 10,
    tonsMax: Math.round(row.tonsPerHaMax * ha * 10) / 10,
    assumptionNote,
    tonsPerHaMin: row.tonsPerHaMin,
    tonsPerHaMax: row.tonsPerHaMax,
  };
}

/** Preferred display tons: farmer override mid, else midpoint of range */
export function effectiveTons(est: {
  tonsMin: number;
  tonsMax: number;
  farmerOverrideTons?: number | null;
}): number {
  if (est.farmerOverrideTons != null && !Number.isNaN(est.farmerOverrideTons)) {
    return est.farmerOverrideTons;
  }
  return Math.round(((est.tonsMin + est.tonsMax) / 2) * 10) / 10;
}

/** Convert tons to listing qty given unit */
export function tonsToListingQty(tons: number, unit: string): number {
  if (unit === "kg") return Math.round(tons * 1000);
  if (unit === "ton") return Math.max(1, Math.round(tons));
  return Math.max(1, Math.round(tons));
}
