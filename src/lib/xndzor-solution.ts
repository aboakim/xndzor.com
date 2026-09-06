export type SolutionMode = "need" | "have";

export type BundleItemType =
  | "workers"
  | "equipment"
  | "trucks"
  | "boxes"
  | "buyers"
  | "seed"
  | "fertilizer"
  | "warehouse"
  | "agronomist"
  | "irrigation"
  | "crop";

export type BundleItem = {
  type: BundleItemType;
  count: number;
  detail?: string;
};

export type SolutionBundle = {
  id: string;
  mode: SolutionMode;
  summaryKey: string;
  summaryParams?: Record<string, string | number>;
  items: BundleItem[];
  priceAmd: number;
  priceNoteKey?: string;
  startDate: string;
  location: string;
  crop?: string;
  areaHa?: number;
  daysUntil?: number;
  confidence: "high" | "medium" | "demo";
};

export type ParsedProblem = {
  mode: SolutionMode;
  crop?: string;
  areaHa?: number;
  daysUntil?: number;
  needType?: string;
  rawText: string;
};

const CROP_PATTERNS: { slug: string; patterns: RegExp[] }[] = [
  { slug: "apple", patterns: [/խնձոր/i, /\bapple/i, /яблок/i] },
  { slug: "tomato", patterns: [/լոլիկ/i, /\btomato/i, /помидор/i] },
  { slug: "grape", patterns: [/խաղող/i, /\bgrape/i, /виноград/i] },
  { slug: "apricot", patterns: [/ծիրան/i, /\bapricot/i, /абрикос/i] },
  { slug: "potato", patterns: [/կարտոֆիլ/i, /\bpotato/i, /картоф/i] },
  { slug: "wheat", patterns: [/ցորեն/i, /\bwheat/i, /пшениц/i] },
];

const NEED_PATTERNS: { type: string; patterns: RegExp[] }[] = [
  { type: "harvest", patterns: [/բերքահավաք/i, /harvest/i, /уборк/i, /հնձ/i] },
  { type: "tractor", patterns: [/տրակտոր/i, /tractor/i, /трактор/i] },
  { type: "workers", patterns: [/աշխատ/i, /worker/i, /рабоч/i, /հավաք/i] },
  { type: "seed", patterns: [/սերմ/i, /seed/i, /семен/i] },
  { type: "fertilizer", patterns: [/պարարտ/i, /fertiliz/i, /удобр/i] },
  { type: "truck", patterns: [/բեռնատար/i, /truck/i, /грузов/i] },
  { type: "warehouse", patterns: [/պահեստ/i, /warehouse/i, /склад/i] },
  { type: "buyer", patterns: [/գնորդ/i, /buyer/i, /покупат/i] },
  { type: "agronomist", patterns: [/ագրոնом/i, /agronom/i, /агроном/i] },
  { type: "irrigation", patterns: [/ոռոգ/i, /irrigation/i, /орошен/i] },
];

function parseAreaHa(text: string): number | undefined {
  const m =
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:ha|հա|гектар|hectare)/i) ??
    text.match(/(\d+(?:[.,]\d+)?)\s*հա/i);
  if (m) return parseFloat(m[1].replace(",", "."));
  return undefined;
}

function parseDaysUntil(text: string): number | undefined {
  const m =
    text.match(/(\d+)\s*(?:օր(?:ից|ում)?|day|дн)/i) ??
    text.match(/(\d+)\s*օր/i);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

function detectCrop(text: string): string | undefined {
  for (const { slug, patterns } of CROP_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return slug;
  }
  return undefined;
}

function detectNeedType(text: string): string | undefined {
  for (const { type, patterns } of NEED_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return undefined;
}

export function parseProblem(text: string, mode: SolutionMode): ParsedProblem {
  const rawText = text.trim();
  return {
    mode,
    crop: detectCrop(rawText),
    areaHa: parseAreaHa(rawText),
    daysUntil: parseDaysUntil(rawText),
    needType: detectNeedType(rawText),
    rawText,
  };
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function appleHarvestBundle(parsed: ParsedProblem): SolutionBundle {
  const area = parsed.areaHa ?? 4;
  const days = parsed.daysUntil ?? 10;
  const workers = 6;
  const boxes = 150;
  const equipment = 1;
  const trucks = 1;
  const buyers = 2;
  const total = 420_000;

  return {
    id: `apple-harvest-${Date.now()}`,
    mode: "need",
    summaryKey: "bundle.appleHarvest",
    summaryParams: { area, days, crop: "apple" },
    items: [
      { type: "workers", count: workers, detail: "harvest_crew" },
      { type: "equipment", count: equipment, detail: "harvest_platform" },
      { type: "trucks", count: trucks, detail: "refrigerated" },
      { type: "boxes", count: boxes },
      { type: "buyers", count: buyers, detail: "export_grade" },
    ],
    priceAmd: total,
    priceNoteKey: "bundle.priceIncludesAll",
    startDate: addDays(Math.max(1, days - 2)),
    location: "Armavir",
    crop: "apple",
    areaHa: area,
    daysUntil: days,
    confidence: "high",
  };
}

function genericNeedBundle(parsed: ParsedProblem): SolutionBundle {
  const area = parsed.areaHa ?? 2;
  const need = parsed.needType ?? "harvest";
  const workers = need === "harvest" ? Math.max(3, Math.ceil(area * 1.2)) : 2;
  const priceBase =
    need === "tractor"
      ? 120_000
      : need === "fertilizer"
        ? 95_000
        : need === "seed"
          ? 65_000
          : need === "truck"
            ? 55_000
            : workers * 15_000 + 40_000;

  const items: BundleItem[] = [];
  if (need === "harvest" || need === "workers") {
    items.push({ type: "workers", count: workers });
    items.push({ type: "equipment", count: 1 });
  } else if (need === "tractor") {
    items.push({ type: "equipment", count: 1, detail: "tractor" });
  } else if (need === "fertilizer") {
    items.push({ type: "fertilizer", count: Math.ceil(area * 0.4), detail: "tons" });
  } else if (need === "seed") {
    items.push({ type: "seed", count: Math.ceil(area * 0.15), detail: "tons" });
  } else if (need === "truck") {
    items.push({ type: "trucks", count: 1 });
  } else if (need === "warehouse") {
    items.push({ type: "warehouse", count: 1, detail: "cold_storage" });
  } else if (need === "buyer") {
    items.push({ type: "buyers", count: 2 });
  } else if (need === "agronomist") {
    items.push({ type: "agronomist", count: 1 });
  } else if (need === "irrigation") {
    items.push({ type: "irrigation", count: 1, detail: "drip_service" });
  } else {
    items.push({ type: "workers", count: workers });
  }

  return {
    id: `need-${need}-${Date.now()}`,
    mode: "need",
    summaryKey: "bundle.genericNeed",
    summaryParams: { need, area },
    items,
    priceAmd: priceBase,
    startDate: addDays(parsed.daysUntil ?? 7),
    location: "Ararat",
    crop: parsed.crop,
    areaHa: area,
    daysUntil: parsed.daysUntil,
    confidence: "medium",
  };
}

function haveCropBundle(parsed: ParsedProblem): SolutionBundle {
  const crop = parsed.crop ?? "crop";
  const qtyMatch = parsed.rawText.match(/(\d+(?:[.,]\d+)?)\s*(?:տonn|տ|ton|թonn|t\b|տոնն)/i);
  const tons = qtyMatch ? parseFloat(qtyMatch[1].replace(",", ".")) : 5;

  return {
    id: `have-${crop}-${Date.now()}`,
    mode: "have",
    summaryKey: "bundle.haveCrop",
    summaryParams: { crop, tons },
    items: [
      { type: "buyers", count: 3, detail: "matched" },
      { type: "trucks", count: 1, detail: "pickup" },
      { type: "boxes", count: Math.ceil(tons * 30) },
    ],
    priceAmd: Math.round(tons * 280_000),
    priceNoteKey: "bundle.estimatedRevenue",
    startDate: addDays(3),
    location: "Yerevan",
    crop,
    confidence: "medium",
  };
}

/** Demo solution engine — keyword-based bundle assembly with realistic AMD pricing. */
export function solveProblem(text: string, mode: SolutionMode): SolutionBundle {
  const parsed = parseProblem(text, mode);

  if (mode === "have") {
    return haveCropBundle(parsed);
  }

  const isAppleHarvest =
    (parsed.crop === "apple" || /խնձոր|apple/i.test(parsed.rawText)) &&
    (parsed.needType === "harvest" ||
      /բերքահավաք|harvest|հնձ/i.test(parsed.rawText) ||
      parsed.daysUntil != null);

  if (isAppleHarvest) {
    return appleHarvestBundle(parsed);
  }

  return genericNeedBundle(parsed);
}

export type GroupOrderDemo = {
  farmCount: number;
  totalHa: number;
  soloPriceAmd: number;
  groupPriceAmd: number;
  savingsPct: number;
  neighbors: { name: string; ha: number; crop: string }[];
};

export function getDemoGroupOrder(): GroupOrderDemo {
  const neighbors = [
    { name: "Sargsyan", ha: 3.5, crop: "apple" },
    { name: "Hakobyan", ha: 4.0, crop: "apple" },
    { name: "Petrosyan", ha: 3.0, crop: "apple" },
    { name: "Grigoryan", ha: 4.0, crop: "apple" },
    { name: "Avetisyan", ha: 3.0, crop: "apple" },
  ];
  const totalHa = neighbors.reduce((s, n) => s + n.ha, 0);
  const soloPriceAmd = 420_000;
  const groupPriceAmd = 312_000;
  const savingsPct = Math.round((1 - groupPriceAmd / soloPriceAmd) * 100);

  return {
    farmCount: neighbors.length,
    totalHa,
    soloPriceAmd,
    groupPriceAmd,
    savingsPct,
    neighbors,
  };
}

export type RouteStop = {
  marz: string;
  farms: number;
  ha: number;
  loadTons: number;
};

export function getDemoRoute(): { stops: RouteStop[]; totalCostAmd: number; costPerFarmAmd: number } {
  const stops: RouteStop[] = [
    { marz: "Armavir", farms: 3, ha: 10.5, loadTons: 42 },
    { marz: "Artashat", farms: 2, ha: 7.0, loadTons: 28 },
    { marz: "Yerevan", farms: 0, ha: 0, loadTons: 0 },
  ];
  const totalCostAmd = 185_000;
  const costPerFarmAmd = Math.round(totalCostAmd / 5);

  return { stops, totalCostAmd, costPerFarmAmd };
}
