import { searchQueryVariants } from "@/lib/armenian-translit";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import {
  CATALOG_ROUTE,
  type CatalogCategory,
  isCatalogCategory,
} from "@/lib/catalog";
import { listingTextSearchWhere, productSlugsMatchingText } from "@/lib/products";
import { parseImageUrls } from "@/lib/utils";

/** Minimum trimmed query length before running DB search. */
export const SITE_SEARCH_MIN_LEN = 2;

/** Max hits returned per listing type (boards stay uncapped via “view all”). */
export const SITE_SEARCH_LIMIT = 8;

export type SearchSectionId =
  | "supply"
  | "demand"
  | "forward"
  | "animals"
  | "machinery"
  | "jobs"
  | "shop"
  | "providers"
  | "groupBuy"
  | "spaces";

/**
 * Canonical UI order for search sections.
 * ACTIVE supply («Վաճառել հիմա») is always first when it has hits.
 */
export const SEARCH_SECTION_ORDER: readonly SearchSectionId[] = [
  "supply",
  "demand",
  "forward",
  "animals",
  "machinery",
  "jobs",
  "shop",
  "providers",
  "groupBuy",
  "spaces",
] as const;

export type SearchHit = {
  id: string;
  title: string;
  href: string;
  snippet: string | null;
  /** First listing photo, if any. */
  imageUrl: string | null;
  /** Price in AMD (min for ranges). */
  priceAmd: number | null;
  /** Upper bound for demand-style ranges. */
  priceAmdMax: number | null;
  /** Unit key for formatPriceRange (kg, ton, …); null = flat AMD amount. */
  unit: string | null;
  marzSlug: string | null;
};

export type SearchSectionResult = {
  id: SearchSectionId;
  boardHref: string;
  items: SearchHit[];
};

function contains(field: string, q: string) {
  return { [field]: { contains: q, mode: "insensitive" as const } };
}

/** Title/description (+ optional fields) matched against all query variants. */
function titleDescOr(variants: string[], extraFields: string[] = []) {
  return {
    OR: variants.flatMap((q) => [
      contains("title", q),
      contains("description", q),
      ...extraFields.map((field) => contains(field, q)),
    ]),
  };
}

/** Strip quiet seed footers like `demo:batch-supply-v1` from public snippets. */
function stripDemoMarkers(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^demo:[a-z0-9_-]+$/i.test(line.trim()))
    .join("\n")
    .replace(/\s*demo:[a-z0-9_-]+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetFrom(description: string | null | undefined, max = 120): string | null {
  const t = stripDemoMarkers(description ?? "");
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function firstImage(imageUrls: string | null | undefined): string | null {
  return parseImageUrls(imageUrls ?? "[]")[0] ?? null;
}

type HitSource = {
  id: string;
  title: string;
  description?: string | null;
  imageUrls?: string | null;
  priceAmd?: number | null;
  priceAmdMax?: number | null;
  unit?: string | null;
  marzSlug?: string | null;
};

function toHit(href: string, row: HitSource): SearchHit {
  return {
    id: row.id,
    title: row.title,
    href,
    snippet: snippetFrom(row.description),
    imageUrl: firstImage(row.imageUrls),
    priceAmd: row.priceAmd ?? null,
    priceAmdMax: row.priceAmdMax ?? null,
    unit: row.unit ?? null,
    marzSlug: row.marzSlug ?? null,
  };
}

const marzSelect = { select: { slug: true } } as const;

/**
 * Lower is better: exact title → title starts with query → title contains query →
 * description/product-only hits (no title match).
 */
function titleMatchRank(title: string, variants: string[]): number {
  const t = title.toLocaleLowerCase("hy").trim();
  const needles = variants.map((v) => v.toLocaleLowerCase("hy").trim()).filter(Boolean);
  if (needles.some((n) => t === n)) return 0;
  if (needles.some((n) => t.startsWith(n))) return 1;
  if (needles.some((n) => t.includes(n))) return 2;
  return 3;
}

function rankHitsByTitleMatch(items: SearchHit[], variants: string[]): SearchHit[] {
  return [...items]
    .map((item, index) => ({ item, index, rank: titleMatchRank(item.title, variants) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

function shopHref(category: string, id: string): string {
  const route = isCatalogCategory(category)
    ? CATALOG_ROUTE[category as CatalogCategory]
    : "fertilizers";
  return `/shop/${route}/${id}`;
}

/**
 * Unified public listing search across major Xndzor boards.
 * Does not include private FarmOS plots. Empty / short queries return no sections.
 */
export async function runSiteSearch(rawQ: string): Promise<{
  query: string;
  tooShort: boolean;
  sections: SearchSectionResult[];
}> {
  const query = rawQ.trim();
  if (!query) {
    return { query: "", tooShort: false, sections: [] };
  }
  if (query.length < SITE_SEARCH_MIN_LEN) {
    return { query, tooShort: true, sections: [] };
  }

  const variants = searchQueryVariants(query);
  const productWhere = listingTextSearchWhere(query);
  const productSlugs = productSlugsMatchingText(query);
  const groupBuyProductOr =
    productSlugs.length > 0
      ? [{ product: { slug: { in: productSlugs } } }]
      : [];

  const take = SITE_SEARCH_LIMIT;

  const [
    supply,
    demand,
    forward,
    animals,
    machinery,
    jobs,
    providers,
    shop,
    groupBuy,
    spaces,
  ] = await Promise.all([
    safeQuery(
      () =>
        prisma.supply.findMany({
          where: { status: "ACTIVE", ...productWhere },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            priceAmd: true,
            unit: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.demand.findMany({
          where: { status: "ACTIVE", ...productWhere },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            priceMinAmd: true,
            priceMaxAmd: true,
            unit: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.futureHarvest.findMany({
          where: { status: "ACTIVE", ...productWhere },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            priceAmd: true,
            unit: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.animalListing.findMany({
          where: {
            status: "ACTIVE",
            ...titleDescOr(variants, ["breed"]),
          },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            priceAmd: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.machineryListing.findMany({
          where: {
            status: "ACTIVE",
            ...titleDescOr(variants, ["make", "model"]),
          },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            priceAmd: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.jobRequest.findMany({
          where: { status: "ACTIVE", ...titleDescOr(variants) },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            budgetAmd: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.serviceProvider.findMany({
          where: { status: "ACTIVE", ...titleDescOr(variants) },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            rateAmd: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.catalogListing.findMany({
          where: {
            status: "ACTIVE",
            ...titleDescOr(variants, ["brand"]),
          },
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            imageUrls: true,
            priceAmd: true,
            unit: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.groupBuyCampaign.findMany({
          where: {
            status: { in: ["OPEN", "QUOTED"] },
            OR: [
              ...variants.flatMap((v) => [contains("title", v), contains("description", v)]),
              ...groupBuyProductOr,
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            pricePerUnitAmd: true,
            unit: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.spaceListing.findMany({
          where: { status: "ACTIVE", ...titleDescOr(variants) },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            priceAmd: true,
            marz: marzSelect,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
  ]);

  const qParam = `?q=${encodeURIComponent(query)}`;

  const byId: Record<SearchSectionId, SearchSectionResult> = {
    supply: {
      id: "supply",
      boardHref: `/supply${qParam}`,
      items: rankHitsByTitleMatch(
        supply.map((r) =>
          toHit(`/supply/${r.id}`, {
            id: r.id,
            title: r.title,
            description: r.description,
            imageUrls: r.imageUrls,
            priceAmd: r.priceAmd,
            unit: r.unit,
            marzSlug: r.marz.slug,
          }),
        ),
        variants,
      ),
    },
    demand: {
      id: "demand",
      boardHref: `/demand${qParam}`,
      items: demand.map((r) =>
        toHit(`/demand/${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.priceMinAmd,
          priceAmdMax: r.priceMaxAmd,
          unit: r.unit,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    forward: {
      id: "forward",
      boardHref: `/forward`,
      items: forward.map((r) =>
        toHit(`/forward/${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.priceAmd,
          unit: r.unit,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    animals: {
      id: "animals",
      boardHref: `/animals${qParam}`,
      items: animals.map((r) =>
        toHit(`/animals/${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.priceAmd,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    machinery: {
      id: "machinery",
      boardHref: `/machinery${qParam}`,
      items: machinery.map((r) =>
        toHit(`/machinery/${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.priceAmd,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    jobs: {
      id: "jobs",
      boardHref: `/jobs`,
      items: jobs.map((r) =>
        toHit(`/jobs/${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.budgetAmd,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    shop: {
      id: "shop",
      boardHref: `/shop/fertilizers${qParam}`,
      items: shop.map((r) =>
        toHit(shopHref(r.category, r.id), {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.priceAmd,
          unit: r.unit,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    providers: {
      id: "providers",
      boardHref: `/providers`,
      items: providers.map((r) =>
        toHit(`/providers/${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.rateAmd,
          marzSlug: r.marz.slug,
        }),
      ),
    },
    groupBuy: {
      id: "groupBuy",
      boardHref: `/group-buy`,
      items: groupBuy.map((r) =>
        toHit(`/group-buy#${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.pricePerUnitAmd,
          unit: r.unit,
          marzSlug: r.marz?.slug ?? null,
        }),
      ),
    },
    spaces: {
      id: "spaces",
      boardHref: `/spaces`,
      items: spaces.map((r) =>
        toHit(`/spaces#${r.id}`, {
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrls: r.imageUrls,
          priceAmd: r.priceAmd,
          marzSlug: r.marz.slug,
        }),
      ),
    },
  };

  // Emit in SEARCH_SECTION_ORDER so supply is always first among non-empty sections.
  const sections = SEARCH_SECTION_ORDER.map((id) => byId[id]).filter(
    (s) => s.items.length > 0,
  );

  return {
    query,
    tooShort: false,
    sections,
  };
}
