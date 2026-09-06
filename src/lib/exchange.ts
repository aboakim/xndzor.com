/**
 * Future-harvest exchange aggregates + overproduction signal.
 * All figures are platform registrations only (not national statistics).
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { effectiveTons } from "@/lib/yield";
import { MARZES } from "@/lib/locations";

export const BUYER_KINDS = [
  "FACTORY",
  "SHOP_CHAIN",
  "RESTAURANT",
  "WHOLESALE",
  "EXPORTER",
  "OTHER",
] as const;

export type BuyerKind = (typeof BUYER_KINDS)[number];

export type SignalLevel = "OVER" | "UNDER" | "BALANCED" | "NO_DATA";

export type CropExchangeRow = {
  productId: string;
  slug: string;
  nameKey: string;
  supplyTons: number;
  demandTons: number;
  buyerCount: number;
  avgPriceAmdPerKg: number | null;
  harvestCount: number;
  plotCount: number;
  signal: SignalLevel;
  ratio: number | null;
  gapTons: number;
};

export type MarzBalance = {
  marzId: string;
  supplyTons: number;
  demandTons: number;
  signal: SignalLevel;
};

export type DemandBuyerRow = {
  id: string;
  title: string;
  buyerKind: string;
  qtyTons: number;
  unit: string;
  qtyMin: number;
  qtyMax: number | null;
  priceMinAmd: number | null;
  priceMaxAmd: number | null;
  marzId: string;
  marzSlug: string;
  villageNameHy: string | null;
  userName: string | null;
  nearby: boolean;
};

export type DemandSnapshot = {
  productId: string;
  slug: string;
  nameKey: string;
  buyerCount: number;
  demandTons: number;
  avgPriceAmdPerKg: number | null;
  remainingTons: number;
  supplyTons: number;
  signal: SignalLevel;
  buyers: DemandBuyerRow[];
};

const BALANCE_BAND = 0.12; // ±12% → balanced

/** Convert listing qty+unit to tons. Non-mass units return 0 for crop board. */
export function qtyToTons(qty: number, unit: string): number {
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  if (unit === "ton") return qty;
  if (unit === "kg") return qty / 1000;
  if (unit === "box") return (qty * 15) / 1000; // ~15 kg/box heuristic
  return 0;
}

/** Normalize AMD price to AMD/kg when possible */
export function priceToAmdPerKg(
  price: number | null | undefined,
  unit: string
): number | null {
  if (price == null || !Number.isFinite(price) || price < 0) return null;
  if (unit === "kg") return price;
  if (unit === "ton") return price / 1000;
  if (unit === "box") return price / 15;
  return null;
}

export function demandQtyTons(d: {
  qtyMin: number;
  qtyMax: number | null;
  unit: string;
}): number {
  const qty = d.qtyMax != null && d.qtyMax > 0 ? d.qtyMax : d.qtyMin;
  return qtyToTons(qty, d.unit);
}

export function classifySignal(supplyTons: number, demandTons: number): SignalLevel {
  if (supplyTons <= 0 && demandTons <= 0) return "NO_DATA";
  if (supplyTons <= 0 && demandTons > 0) return "UNDER";
  if (demandTons <= 0 && supplyTons > 0) return "OVER";
  const mid = (supplyTons + demandTons) / 2;
  if (mid <= 0) return "NO_DATA";
  const diff = (supplyTons - demandTons) / mid;
  if (diff > BALANCE_BAND) return "OVER";
  if (diff < -BALANCE_BAND) return "UNDER";
  return "BALANCED";
}

function roundTons(n: number): number {
  return Math.round(n * 10) / 10;
}

async function loadExchangeRaw() {
  const [harvests, plots, demands] = await Promise.all([
    prisma.futureHarvest.findMany({
      where: { status: "ACTIVE" },
      include: { product: true },
    }),
    prisma.plot.findMany({
      where: { status: "ACTIVE" },
      include: {
        cropProduct: true,
        yieldEstimate: true,
        futureHarvests: { where: { status: "ACTIVE" }, select: { id: true, status: true } },
      },
    }),
    prisma.demand.findMany({
      where: { status: "ACTIVE" },
      include: {
        product: true,
        marz: true,
        village: true,
        user: { select: { name: true } },
      },
    }),
  ]);
  return { harvests, plots, demands };
}

type ExchangeRaw = Awaited<ReturnType<typeof loadExchangeRaw>>;
type HarvestRow = ExchangeRaw["harvests"][number];
type PlotRow = ExchangeRaw["plots"][number];
type DemandRow = ExchangeRaw["demands"][number];

/** Supply tons by product (+ optional marz), deduping plot↔future harvest. */
export function aggregateSupply(
  harvests: HarvestRow[],
  plots: PlotRow[],
  opts?: { productId?: string; marzId?: string }
): {
  byProduct: Map<string, { tons: number; harvestCount: number; plotCount: number }>;
  byProductMarz: Map<string, number>;
} {
  const byProduct = new Map<string, { tons: number; harvestCount: number; plotCount: number }>();
  const byProductMarz = new Map<string, number>();
  const ensure = (pid: string) => {
    if (!byProduct.has(pid)) byProduct.set(pid, { tons: 0, harvestCount: 0, plotCount: 0 });
    return byProduct.get(pid)!;
  };
  const addMarz = (pid: string, marzId: string, tons: number) => {
    const key = `${pid}|${marzId}`;
    byProductMarz.set(key, (byProductMarz.get(key) || 0) + tons);
  };

  for (const h of harvests) {
    if (opts?.productId && h.productId !== opts.productId) continue;
    if (opts?.marzId && h.marzId !== opts.marzId) continue;
    const tons = qtyToTons(h.qtyExpected, h.unit);
    if (tons <= 0) continue;
    const row = ensure(h.productId);
    row.tons += tons;
    row.harvestCount += 1;
    addMarz(h.productId, h.marzId, tons);
  }

  for (const p of plots) {
    if (opts?.productId && p.cropProductId !== opts.productId) continue;
    if (opts?.marzId && p.marzId !== opts.marzId) continue;
    // Skip plots that already published an active future harvest (avoid double count)
    if (p.futureHarvests.length > 0) continue;
    if (!p.yieldEstimate) continue;
    const tons = effectiveTons(p.yieldEstimate);
    if (tons <= 0) continue;
    const row = ensure(p.cropProductId);
    row.tons += tons;
    row.plotCount += 1;
    addMarz(p.cropProductId, p.marzId, tons);
  }

  return { byProduct, byProductMarz };
}

export function aggregateDemand(
  demands: DemandRow[],
  opts?: { productId?: string; marzId?: string }
): {
  byProduct: Map<
    string,
    {
      tons: number;
      buyerCount: number;
      priceSamples: number[];
      byKind: Map<string, number>;
    }
  >;
  byProductMarz: Map<string, number>;
} {
  const byProduct = new Map<
    string,
    {
      tons: number;
      buyerCount: number;
      priceSamples: number[];
      byKind: Map<string, number>;
    }
  >();
  const byProductMarz = new Map<string, number>();
  const ensure = (pid: string) => {
    if (!byProduct.has(pid)) {
      byProduct.set(pid, {
        tons: 0,
        buyerCount: 0,
        priceSamples: [],
        byKind: new Map(),
      });
    }
    return byProduct.get(pid)!;
  };

  for (const d of demands) {
    if (opts?.productId && d.productId !== opts.productId) continue;
    if (opts?.marzId && d.marzId !== opts.marzId) continue;
    const tons = demandQtyTons(d);
    if (tons <= 0) continue;
    const row = ensure(d.productId);
    row.tons += tons;
    row.buyerCount += 1;
    row.byKind.set(d.buyerKind, (row.byKind.get(d.buyerKind) || 0) + tons);
    const pMin = priceToAmdPerKg(d.priceMinAmd, d.unit);
    const pMax = priceToAmdPerKg(d.priceMaxAmd, d.unit);
    if (pMin != null && pMax != null) row.priceSamples.push((pMin + pMax) / 2);
    else if (pMin != null) row.priceSamples.push(pMin);
    else if (pMax != null) row.priceSamples.push(pMax);
    const key = `${d.productId}|${d.marzId}`;
    byProductMarz.set(key, (byProductMarz.get(key) || 0) + tons);
  }

  return { byProduct, byProductMarz };
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

async function computeCropRankings(marzId?: string): Promise<CropExchangeRow[]> {
  const { harvests, plots, demands } = await loadExchangeRaw();
  const supply = aggregateSupply(harvests, plots, { marzId });
  const demand = aggregateDemand(demands, { marzId });

  const productMeta = new Map<string, { slug: string; nameKey: string }>();
  for (const h of harvests) productMeta.set(h.productId, h.product);
  for (const p of plots) productMeta.set(p.cropProductId, p.cropProduct);
  for (const d of demands) productMeta.set(d.productId, d.product);

  const ids = new Set([...supply.byProduct.keys(), ...demand.byProduct.keys()]);
  const rows: CropExchangeRow[] = [];

  for (const productId of ids) {
    const meta = productMeta.get(productId);
    if (!meta) continue;
    // Skip non-mass products (milk/honey) from crop exchange board
    if (meta.slug === "milk" || meta.slug === "honey") continue;

    const s = supply.byProduct.get(productId) || { tons: 0, harvestCount: 0, plotCount: 0 };
    const d = demand.byProduct.get(productId) || {
      tons: 0,
      buyerCount: 0,
      priceSamples: [] as number[],
      byKind: new Map(),
    };
    const signal = classifySignal(s.tons, d.tons);
    const ratio = d.tons > 0 ? s.tons / d.tons : s.tons > 0 ? Infinity : null;
    rows.push({
      productId,
      slug: meta.slug,
      nameKey: meta.nameKey,
      supplyTons: roundTons(s.tons),
      demandTons: roundTons(d.tons),
      buyerCount: d.buyerCount,
      avgPriceAmdPerKg: avg(d.priceSamples),
      harvestCount: s.harvestCount,
      plotCount: s.plotCount,
      signal,
      ratio: ratio == null || !Number.isFinite(ratio) ? ratio : Math.round(ratio * 100) / 100,
      gapTons: roundTons(Math.abs(s.tons - d.tons)),
    });
  }

  // Rank by open demand tons desc, then buyer count
  rows.sort((a, b) => b.demandTons - a.demandTons || b.buyerCount - a.buyerCount);
  return rows;
}

const getCachedCropRankings = unstable_cache(
  async (marzId?: string) => computeCropRankings(marzId),
  ["crop-rankings"],
  { revalidate: 60 },
);

export async function getCropRankings(opts?: {
  marzId?: string;
}): Promise<CropExchangeRow[]> {
  return getCachedCropRankings(opts?.marzId);
}

export async function getSignalForCrop(opts: {
  productId?: string;
  productSlug?: string;
  marzId?: string;
}): Promise<CropExchangeRow | null> {
  const rankings = await getCropRankings({ marzId: opts.marzId });
  if (opts.productId) return rankings.find((r) => r.productId === opts.productId) || null;
  if (opts.productSlug) return rankings.find((r) => r.slug === opts.productSlug) || null;
  return rankings[0] || null;
}

export async function getMarzBalances(productId: string): Promise<MarzBalance[]> {
  const { harvests, plots, demands } = await loadExchangeRaw();
  const supply = aggregateSupply(harvests, plots, { productId });
  const demand = aggregateDemand(demands, { productId });

  return MARZES.map((marzId) => {
    const s = supply.byProductMarz.get(`${productId}|${marzId}`) || 0;
    const d = demand.byProductMarz.get(`${productId}|${marzId}`) || 0;
    return {
      marzId,
      supplyTons: roundTons(s),
      demandTons: roundTons(d),
      signal: classifySignal(s, d),
    };
  });
}

export async function getDemandSnapshot(opts: {
  productId: string;
  marzId?: string | null;
  take?: number;
}): Promise<DemandSnapshot | null> {
  const take = opts.take ?? 8;
  const product = await prisma.product.findUnique({ where: { id: opts.productId } });
  if (!product) return null;

  const { harvests, plots, demands } = await loadExchangeRaw();
  const productDemands = demands.filter((d) => d.productId === opts.productId);
  const supply = aggregateSupply(harvests, plots, { productId: opts.productId });
  const demandAgg = aggregateDemand(demands, { productId: opts.productId });
  const sTons = supply.byProduct.get(opts.productId)?.tons || 0;
  const dRow = demandAgg.byProduct.get(opts.productId);
  const dTons = dRow?.tons || 0;

  const scored = productDemands
    .map((d) => {
      const nearby = opts.marzId
        ? d.marzId === opts.marzId || isNearbyMarz(opts.marzId, d.marzId)
        : false;
      return {
        id: d.id,
        title: d.title,
        buyerKind: d.buyerKind || "WHOLESALE",
        qtyTons: roundTons(demandQtyTons(d)),
        unit: d.unit,
        qtyMin: d.qtyMin,
        qtyMax: d.qtyMax,
        priceMinAmd: d.priceMinAmd,
        priceMaxAmd: d.priceMaxAmd,
        marzId: d.marzId,
        marzSlug: d.marz.slug,
        villageNameHy: d.village?.nameHy || null,
        userName: d.user.name,
        nearby,
      };
    })
    .sort((a, b) => Number(b.nearby) - Number(a.nearby) || b.qtyTons - a.qtyTons);

  return {
    productId: product.id,
    slug: product.slug,
    nameKey: product.nameKey,
    buyerCount: productDemands.length,
    demandTons: roundTons(dTons),
    avgPriceAmdPerKg: avg(dRow?.priceSamples || []),
    remainingTons: roundTons(Math.max(0, dTons - sTons)),
    supplyTons: roundTons(sTons),
    signal: classifySignal(sTons, dTons),
    buyers: scored.slice(0, take),
  };
}

/** Rough adjacency for “nearest buyers” */
const NEARBY: Record<string, string[]> = {
  Yerevan: ["Kotayk", "Ararat", "Armavir", "Aragatsotn"],
  Aragatsotn: ["Shirak", "Armavir", "Kotayk", "Yerevan", "Lori"],
  Ararat: ["Yerevan", "Armavir", "Kotayk", "VayotsDzor", "Gegharkunik"],
  Armavir: ["Aragatsotn", "Yerevan", "Ararat"],
  Gegharkunik: ["Kotayk", "Tavush", "VayotsDzor", "Ararat", "Lori"],
  Kotayk: ["Yerevan", "Aragatsotn", "Gegharkunik", "Ararat", "Lori", "Tavush"],
  Lori: ["Shirak", "Tavush", "Kotayk", "Aragatsotn", "Gegharkunik"],
  Shirak: ["Lori", "Aragatsotn"],
  Syunik: ["VayotsDzor"],
  Tavush: ["Lori", "Gegharkunik", "Kotayk"],
  VayotsDzor: ["Ararat", "Gegharkunik", "Syunik"],
};

function isNearbyMarz(from: string, to: string): boolean {
  if (from === to) return true;
  return NEARBY[from]?.includes(to) ?? false;
}

export async function getBuyerKindBreakdown(productId: string) {
  const demands = await prisma.demand.findMany({
    where: { status: "ACTIVE", productId },
  });
  const byKind = new Map<string, { tons: number; count: number }>();
  for (const d of demands) {
    const kind = d.buyerKind || "OTHER";
    const tons = demandQtyTons(d);
    const row = byKind.get(kind) || { tons: 0, count: 0 };
    row.tons += tons;
    row.count += 1;
    byKind.set(kind, row);
  }
  return [...byKind.entries()]
    .map(([kind, v]) => ({ kind, tons: roundTons(v.tons), count: v.count }))
    .sort((a, b) => b.tons - a.tons);
}

export async function getMatchLists(productId: string) {
  const [harvests, demands] = await Promise.all([
    prisma.futureHarvest.findMany({
      where: { status: "ACTIVE", productId },
      include: { marz: true, village: true, product: true },
      orderBy: { harvestDate: "asc" },
      take: 12,
    }),
    prisma.demand.findMany({
      where: { status: "ACTIVE", productId },
      include: { marz: true, village: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  return { harvests, demands };
}
