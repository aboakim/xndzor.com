import productsData from "../../data/products.json";
import enMessages from "../../messages/en.json";
import hyMessages from "../../messages/hy.json";
import ruMessages from "../../messages/ru.json";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";

export type ProductCategoryId =
  | "vegetables"
  | "fruits"
  | "berries"
  | "nuts"
  | "grains"
  | "forage"
  | "herbs"
  | "dairy"
  | "eggs"
  | "meat"
  | "honey"
  | "dried"
  | "mushrooms"
  | "wine"
  | "seedlings"
  | "flowers"
  | "other";

export type ProductCategory = {
  id: ProductCategoryId;
  nameKey: string;
  sortOrder: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  nameKey: string;
  sortOrder: number;
  category: ProductCategoryId;
  featured: boolean;
};

const hyProductNames = hyMessages.products as Record<string, string>;
const enProductNames = enMessages.products as Record<string, string>;
const ruProductNames = ruMessages.products as Record<string, string>;

/** Armenian display name for stable Ա→Ֆ catalog sorting (independent of UI locale). */
export function productHyLabel(nameKey: string): string {
  const key = nameKey.replace(/^products\./, "");
  return hyProductNames[key] ?? key;
}

/** Product slugs whose localized names (hy/en/ru) or slug match the search text. */
export function productSlugsMatchingText(q: string): string[] {
  const needle = q.trim().toLocaleLowerCase("hy");
  if (!needle) return [];

  return PRODUCT_CATALOG.filter((p) => {
    const key = p.nameKey.replace(/^products\./, "");
    const labels = [
      productHyLabel(p.nameKey),
      enProductNames[key] ?? "",
      ruProductNames[key] ?? "",
      p.slug.replace(/-/g, " "),
      key,
    ];
    return labels.some((label) => label.toLocaleLowerCase("hy").includes(needle));
  }).map((p) => p.slug);
}

/** Prisma `where` fragment: title/description + product name match for board `q`. */
export function listingTextSearchWhere(q: string | undefined):
  | Record<string, never>
  | {
      OR: Array<
        | { title: { contains: string; mode: "insensitive" } }
        | { description: { contains: string; mode: "insensitive" } }
        | { product: { slug: { in: string[] } } }
      >;
    } {
  const trimmed = q?.trim();
  if (!trimmed) return {};

  const slugs = productSlugsMatchingText(trimmed);
  return {
    OR: [
      { title: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
      ...(slugs.length > 0 ? [{ product: { slug: { in: slugs } } }] : []),
    ],
  };
}

export function compareProductsByHyName(
  a: Pick<CatalogProduct, "nameKey">,
  b: Pick<CatalogProduct, "nameKey">,
): number {
  return productHyLabel(a.nameKey).localeCompare(productHyLabel(b.nameKey), "hy");
}

export const PRODUCT_CATEGORIES = productsData.categories as ProductCategory[];

export const PRODUCT_CATALOG = productsData.products as CatalogProduct[];

const byId = new Map(PRODUCT_CATALOG.map((p) => [p.id, p]));
const bySlug = new Map(PRODUCT_CATALOG.map((p) => [p.slug, p]));
const categoryById = new Map(PRODUCT_CATEGORIES.map((c) => [c.id, c]));

export function findCatalogProduct(idOrSlug: string): CatalogProduct | undefined {
  return byId.get(idOrSlug) || bySlug.get(idOrSlug);
}

/** Static catalog always available for selects (labels via nameKey + i18n). */
export function getCatalogProducts(): CatalogProduct[] {
  return PRODUCT_CATALOG;
}

/** Popular products for board chips / form icon shortcuts. */
export function getFeaturedProducts(products: CatalogProduct[]): CatalogProduct[] {
  const featured = products.filter((p) => p.featured);
  return featured.length > 0 ? featured : products;
}

export type ProductCategoryGroup = {
  id: ProductCategoryId;
  nameKey: string;
  products: CatalogProduct[];
};

/** Group products under catalog categories for optgroup UIs. */
export function groupProductsByCategory(
  products: Array<Pick<CatalogProduct, "id" | "slug" | "nameKey" | "sortOrder" | "category">>,
): ProductCategoryGroup[] {
  const buckets = new Map<ProductCategoryId, CatalogProduct[]>();

  for (const p of products) {
    const category = (p.category && categoryById.has(p.category) ? p.category : "other") as ProductCategoryId;
    const enriched: CatalogProduct = {
      id: p.id,
      slug: p.slug,
      nameKey: p.nameKey,
      sortOrder: p.sortOrder,
      category,
      featured: bySlug.get(p.slug)?.featured ?? false,
    };
    const list = buckets.get(category) ?? [];
    list.push(enriched);
    buckets.set(category, list);
  }

  return PRODUCT_CATEGORIES.map((cat) => {
    const list = buckets.get(cat.id as ProductCategoryId);
    if (!list?.length) return null;
    return {
      id: cat.id as ProductCategoryId,
      nameKey: cat.nameKey,
      products: [...list].sort(compareProductsByHyName),
    };
  }).filter((g): g is ProductCategoryGroup => g != null);
}

function enrichFromCatalog(row: {
  id: string;
  slug: string;
  nameKey: string;
  sortOrder: number;
}): CatalogProduct {
  const catalog = bySlug.get(row.slug) || byId.get(row.id);
  return {
    id: row.id,
    slug: row.slug,
    nameKey: row.nameKey || catalog?.nameKey || `products.${row.slug}`,
    sortOrder: row.sortOrder ?? catalog?.sortOrder ?? 0,
    category: catalog?.category ?? "other",
    featured: catalog?.featured ?? false,
  };
}

/**
 * Load products for forms/filters.
 * Never blocks the request on a full catalog sync (that used to take ~50s for 224
 * products and timed out create pages). Missing DB rows are healed in the background;
 * forms use catalog ids/slugs and POST paths call ensureProduct for the chosen crop.
 */
export async function getProducts(): Promise<CatalogProduct[]> {
  const rows = await safeQuery(
    () => prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    [] as { id: string; slug: string; nameKey: string; sortOrder: number }[],
  );

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const incomplete =
    rows.length === 0 || PRODUCT_CATALOG.some((p) => !bySlug.has(p.slug));

  if (incomplete) {
    void import("@/lib/ensure-products")
      .then(({ ensureAllProducts }) => ensureAllProducts())
      .catch(() => 0);

    // Prefer full catalog immediately so selects are never empty / partial after expansion.
    // Use DB id when present (canonical FK); otherwise catalog id (ensureProduct on POST).
    return PRODUCT_CATALOG.map((p) => {
      const row = bySlug.get(p.slug);
      return row ? enrichFromCatalog(row) : p;
    });
  }

  return rows.map(enrichFromCatalog);
}
