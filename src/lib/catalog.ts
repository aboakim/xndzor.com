/** Unified ag catalog marketplace — fertilizers, seeds, feed, chemicals, tools, land, village products. */

export const CATALOG_CATEGORIES = [
  "FERTILIZER",
  "SEED",
  "FEED",
  "CHEMICAL",
  "TOOL",
  "LAND",
  "NATURAL_PRODUCT",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

/** URL slug ↔ category */
export const CATALOG_ROUTE: Record<CatalogCategory, string> = {
  FERTILIZER: "fertilizers",
  SEED: "seeds",
  FEED: "feed",
  CHEMICAL: "chemicals",
  TOOL: "tools",
  LAND: "land",
  NATURAL_PRODUCT: "natural-products",
};

export const CATALOG_FROM_ROUTE: Record<string, CatalogCategory> = {
  fertilizers: "FERTILIZER",
  seeds: "SEED",
  feed: "FEED",
  chemicals: "CHEMICAL",
  tools: "TOOL",
  land: "LAND",
  "natural-products": "NATURAL_PRODUCT",
};

export const CATALOG_SUBTYPES: Record<CatalogCategory, readonly string[]> = {
  FERTILIZER: ["ORGANIC", "MINERAL", "NPK", "UREA", "COMPOST", "MANURE", "OTHER"],
  SEED: ["WHEAT", "BARLEY", "TOMATO", "POTATO", "GRAPE", "APPLE", "VEGETABLE", "SEEDLING", "OTHER"],
  FEED: ["HAY", "SILAGE", "GRAIN", "MIXED", "SUPPLEMENT", "OTHER"],
  CHEMICAL: ["HERBICIDE", "FUNGICIDE", "INSECTICIDE", "FERTILIZER_ADJ", "OTHER"],
  TOOL: ["HAND", "IRRIGATION", "GREENHOUSE", "STORAGE", "OTHER"],
  LAND: ["ARABLE", "ORCHARD", "PASTURE", "GREENHOUSE", "OTHER"],
  NATURAL_PRODUCT: [
    "FLAX_OIL",
    "SUNFLOWER_OIL",
    "OTHER_OIL",
    "FAT",
    "MILK",
    "BUTTER",
    "CHEESE",
    "MATZOON",
    "CREAM",
    "OTHER_DAIRY",
    "HONEY",
    "PRESERVE",
    "DRIED",
    "EGGS",
    "HERBS",
    "FLOUR_GRAIN",
    "BREAD",
    "PICKLE",
    "OTHER",
  ],
};

export const CATALOG_PRICE_UNITS = ["PER_KG", "PER_BAG", "PER_LITER", "PER_HA", "LOT", "OTHER"] as const;
export const CATALOG_UNITS = ["kg", "ton", "liter", "piece", "bag", "ha", "other"] as const;
export const CATALOG_STATUSES = ["ACTIVE", "SOLD", "HIDDEN"] as const;

export const COMMENT_TARGET_TYPES = ["MACHINERY", "ANIMAL", "CATALOG"] as const;
export type CommentTargetType = (typeof COMMENT_TARGET_TYPES)[number];

export function isCatalogCategory(v: string): v is CatalogCategory {
  return (CATALOG_CATEGORIES as readonly string[]).includes(v);
}

export function categoryFromRoute(slug: string): CatalogCategory | null {
  return CATALOG_FROM_ROUTE[slug] ?? null;
}

export function parseSpecs(json: string | null | undefined): Record<string, string | number | boolean | null> {
  try {
    const parsed = JSON.parse(json || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function stringifySpecs(specs: Record<string, unknown>): string {
  return JSON.stringify(specs ?? {});
}

/** Spec field keys shown in forms/detail per category */
export const CATALOG_SPEC_FIELDS: Record<
  CatalogCategory,
  { key: string; kind: "text" | "number" | "bool" }[]
> = {
  FERTILIZER: [
    { key: "composition", kind: "text" },
    { key: "npkRatio", kind: "text" },
  ],
  SEED: [
    { key: "crop", kind: "text" },
    { key: "germinationPct", kind: "number" },
    { key: "certified", kind: "bool" },
  ],
  FEED: [
    { key: "forAnimals", kind: "text" },
    { key: "proteinPct", kind: "number" },
  ],
  CHEMICAL: [
    { key: "activeIngredient", kind: "text" },
    { key: "caution", kind: "text" },
  ],
  TOOL: [
    { key: "condition", kind: "text" },
    { key: "material", kind: "text" },
  ],
  LAND: [
    { key: "hectares", kind: "number" },
    { key: "waterAccess", kind: "text" },
    { key: "dealType", kind: "text" },
    { key: "soilNote", kind: "text" },
  ],
  NATURAL_PRODUCT: [
    { key: "origin", kind: "text" },
    { key: "organic", kind: "bool" },
    { key: "homemade", kind: "bool" },
  ],
};
