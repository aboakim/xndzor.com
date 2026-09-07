import { prisma } from "@/lib/prisma";
import { PRODUCT_CATALOG, findCatalogProduct } from "@/lib/products";

/** Upsert the full crop/product catalog (idempotent). */
export async function ensureAllProducts(): Promise<number> {
  let n = 0;
  for (const p of PRODUCT_CATALOG) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        id: p.id,
        slug: p.slug,
        nameKey: p.nameKey,
        sortOrder: p.sortOrder,
      },
      update: {
        nameKey: p.nameKey,
        sortOrder: p.sortOrder,
      },
    });
    n += 1;
  }
  return n;
}

/**
 * Resolve a product id for FK writes.
 * Accepts DB id or catalog slug; creates the row from the static catalog when missing.
 */
export async function ensureProduct(productIdOrSlug: string): Promise<string | null> {
  const existing = await prisma.product.findFirst({
    where: {
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
    },
  });
  if (existing) return existing.id;

  const catalog = findCatalogProduct(productIdOrSlug);
  if (!catalog) return null;

  const row = await prisma.product.upsert({
    where: { slug: catalog.slug },
    create: {
      id: catalog.id,
      slug: catalog.slug,
      nameKey: catalog.nameKey,
      sortOrder: catalog.sortOrder,
    },
    update: {
      nameKey: catalog.nameKey,
      sortOrder: catalog.sortOrder,
    },
  });
  return row.id;
}
