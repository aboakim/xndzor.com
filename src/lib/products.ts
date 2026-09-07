import productsData from "../../data/products.json";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";

export type CatalogProduct = {
  id: string;
  slug: string;
  nameKey: string;
  sortOrder: number;
};

export const PRODUCT_CATALOG = productsData.products as CatalogProduct[];

const byId = new Map(PRODUCT_CATALOG.map((p) => [p.id, p]));
const bySlug = new Map(PRODUCT_CATALOG.map((p) => [p.slug, p]));

export function findCatalogProduct(idOrSlug: string): CatalogProduct | undefined {
  return byId.get(idOrSlug) || bySlug.get(idOrSlug);
}

/** Static catalog always available for selects (labels via nameKey + i18n). */
export function getCatalogProducts(): CatalogProduct[] {
  return PRODUCT_CATALOG;
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
      return healed.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameKey: p.nameKey,
        sortOrder: p.sortOrder,
      }));
    }
  }

  if (rows.length > 0) {
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameKey: p.nameKey,
      sortOrder: p.sortOrder,
    }));
  }

  // Last resort: static IDs (ensureAllProducts should have written them; APIs also ensure on POST).
  return PRODUCT_CATALOG;
}
