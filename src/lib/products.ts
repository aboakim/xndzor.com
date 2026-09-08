import productsData from "../../data/products.json";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";

export type ProductCategoryId =
  | "vegetables"
  | "fruits"
  | "grains"
  | "forage"
  | "dairy"
  | "honey"
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
      products: [...list].sort((a, b) => a.sortOrder - b.sortOrder),
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
 * Heals empty/partial Neon DB from the static catalog so selects never render empty
 * when the catalog exists.
 */
export async function getProducts(): Promise<CatalogProduct[]> {
  const rows = await safeQuery(
    () => prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    [] as { id: string; slug: string; nameKey: string; sortOrder: number }[],
  );

  const missing =
    rows.length === 0 ||
    PRODUCT_CATALOG.some((p) => !rows.some((r) => r.slug === p.slug));

  if (missing) {
    const { ensureAllProducts } = await import("@/lib/ensure-products");
    await ensureAllProducts().catch(() => 0);
    const healed = await safeQuery(
      () => prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
      [] as { id: string; slug: string; nameKey: string; sortOrder: number }[],
    );
    if (healed.length > 0) {
      return healed.map(enrichFromCatalog);
    }
  }

  if (rows.length > 0) {
    return rows.map(enrichFromCatalog);
  }

  // Last resort: static IDs (ensureAllProducts should have written them; APIs also ensure on POST).
  return PRODUCT_CATALOG;
}
