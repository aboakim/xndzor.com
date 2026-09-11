import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATALOG_ROUTE } from "@/lib/catalog";
import { resolveSiteUrl } from "@/lib/site-url";
import { safeQuery } from "@/lib/safe-query";

const siteUrl = resolveSiteUrl();
const locales = ["hy", "ru", "en"] as const;

/** Public marketing / board routes (no auth, no private farm tools). */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/grow", changeFrequency: "daily", priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/supply", changeFrequency: "hourly", priority: 0.95 },
  { path: "/demand", changeFrequency: "hourly", priority: 0.9 },
  { path: "/forward", changeFrequency: "daily", priority: 0.85 },
  { path: "/animals", changeFrequency: "daily", priority: 0.85 },
  { path: "/machinery", changeFrequency: "daily", priority: 0.85 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.85 },
  { path: "/group-buy", changeFrequency: "weekly", priority: 0.8 },
  { path: "/group-buy/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/spaces", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/fertilizers", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/seeds", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/feed", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/chemicals", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/tools", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/land", changeFrequency: "weekly", priority: 0.75 },
  { path: "/shop/natural-products", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help", changeFrequency: "monthly", priority: 0.5 },
];

/** Cap per listing type so sitemap stays crawl-budget friendly. */
const LISTING_CAP = 200;

type ListingRow = { id: string; updatedAt: Date };

async function listingEntries(
  prefix: string,
  rows: ListingRow[],
  priority = 0.7,
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (const row of rows) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${prefix}/${row.id}`,
        lastModified: row.updatedAt,
        changeFrequency: "weekly",
        priority: locale === "hy" ? priority : priority - 0.05,
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  entries.push({
    url: siteUrl,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  });

  for (const locale of locales) {
    for (const item of STATIC_PATHS) {
      entries.push({
        url: `${siteUrl}/${locale}${item.path}`,
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority:
          item.path === ""
            ? locale === "hy"
              ? 1
              : 0.95
            : locale === "hy"
              ? item.priority
              : Math.max(0.4, item.priority - 0.05),
      });
    }
  }

  const empty: ListingRow[] = [];
  const [supplies, demands, forwards, animals, machinery, jobs, catalogs] =
    await Promise.all([
      safeQuery(
        () =>
          prisma.supply.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        empty,
      ),
      safeQuery(
        () =>
          prisma.demand.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        empty,
      ),
      safeQuery(
        () =>
          prisma.futureHarvest.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        empty,
      ),
      safeQuery(
        () =>
          prisma.animalListing.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        empty,
      ),
      safeQuery(
        () =>
          prisma.machineryListing.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        empty,
      ),
      safeQuery(
        () =>
          prisma.jobRequest.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        empty,
      ),
      safeQuery(
        () =>
          prisma.catalogListing.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true, category: true },
            orderBy: { updatedAt: "desc" },
            take: LISTING_CAP,
          }),
        [] as { id: string; updatedAt: Date; category: string }[],
      ),
    ]);

  entries.push(
    ...(await listingEntries("/supply", supplies, 0.8)),
    ...(await listingEntries("/demand", demands, 0.65)),
    ...(await listingEntries("/forward", forwards, 0.7)),
    ...(await listingEntries("/animals", animals, 0.7)),
    ...(await listingEntries("/machinery", machinery, 0.7)),
    ...(await listingEntries("/jobs", jobs, 0.65)),
  );

  for (const row of catalogs) {
    const slug =
      CATALOG_ROUTE[row.category as keyof typeof CATALOG_ROUTE] ?? "fertilizers";
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}/shop/${slug}/${row.id}`,
        lastModified: row.updatedAt,
        changeFrequency: "weekly",
        priority: locale === "hy" ? 0.65 : 0.6,
      });
    }
  }

  return entries;
}
