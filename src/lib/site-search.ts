import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import {
  CATALOG_ROUTE,
  type CatalogCategory,
  isCatalogCategory,
} from "@/lib/catalog";
import { listingTextSearchWhere, productSlugsMatchingText } from "@/lib/products";

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
  | "providers"
  | "shop"
  | "groupBuy"
  | "spaces";

export type SearchHit = {
  id: string;
  title: string;
  href: string;
  snippet: string | null;
};

export type SearchSectionResult = {
  id: SearchSectionId;
  boardHref: string;
  items: SearchHit[];
};

function contains(field: string, q: string) {
  return { [field]: { contains: q, mode: "insensitive" as const } };
}

function titleDescOr(q: string, extra: Record<string, unknown>[] = []) {
  return {
    OR: [contains("title", q), contains("description", q), ...extra],
  };
}

function snippetFrom(description: string | null | undefined, max = 120): string | null {
  const t = description?.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
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
          select: { id: true, title: true, description: true },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.demand.findMany({
          where: { status: "ACTIVE", ...productWhere },
          select: { id: true, title: true, description: true },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.futureHarvest.findMany({
          where: { status: "ACTIVE", ...productWhere },
          select: { id: true, title: true, description: true },
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
            ...titleDescOr(query, [contains("breed", query)]),
          },
          select: { id: true, title: true, description: true },
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
            ...titleDescOr(query, [contains("make", query), contains("model", query)]),
          },
          select: { id: true, title: true, description: true },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.jobRequest.findMany({
          where: { status: "ACTIVE", ...titleDescOr(query) },
          select: { id: true, title: true, description: true },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.serviceProvider.findMany({
          where: { status: "ACTIVE", ...titleDescOr(query) },
          select: { id: true, title: true, description: true },
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
            ...titleDescOr(query, [contains("brand", query)]),
          },
          select: { id: true, title: true, description: true, category: true },
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
              contains("title", query),
              contains("description", query),
              ...groupBuyProductOr,
            ],
          },
          select: { id: true, title: true, description: true },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
    safeQuery(
      () =>
        prisma.spaceListing.findMany({
          where: { status: "ACTIVE", ...titleDescOr(query) },
          select: { id: true, title: true, description: true },
          orderBy: { createdAt: "desc" },
          take,
        }),
      [],
    ),
  ]);

  const qParam = `?q=${encodeURIComponent(query)}`;

  const allSections: SearchSectionResult[] = [
    {
      id: "supply",
      boardHref: `/supply${qParam}`,
      items: supply.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/supply/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "demand",
      boardHref: `/demand${qParam}`,
      items: demand.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/demand/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "forward",
      boardHref: `/forward`,
      items: forward.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/forward/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "animals",
      boardHref: `/animals${qParam}`,
      items: animals.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/animals/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "machinery",
      boardHref: `/machinery${qParam}`,
      items: machinery.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/machinery/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "jobs",
      boardHref: `/jobs`,
      items: jobs.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/jobs/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "providers",
      boardHref: `/providers`,
      items: providers.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/providers/${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "shop",
      boardHref: `/shop/fertilizers${qParam}`,
      items: shop.map((r) => ({
        id: r.id,
        title: r.title,
        href: shopHref(r.category, r.id),
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "groupBuy",
      boardHref: `/group-buy`,
      items: groupBuy.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/group-buy#${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
    {
      id: "spaces",
      boardHref: `/spaces`,
      items: spaces.map((r) => ({
        id: r.id,
        title: r.title,
        href: `/spaces#${r.id}`,
        snippet: snippetFrom(r.description),
      })),
    },
  ];

  return {
    query,
    tooShort: false,
    sections: allSections.filter((s) => s.items.length > 0),
  };
}
