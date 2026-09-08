import { prisma } from "@/lib/prisma";
import { PRODUCT_CATALOG, findCatalogProduct } from "@/lib/products";

/** Deduplicate concurrent full-catalog syncs (common on cold deploys). */
let ensureAllInFlight: Promise<number> | null = null;

/**
 * Ensure every catalog product row exists (idempotent).
 * Uses createMany for missing rows only — serial upserts were ~50s for 224 products
 * and timed out Vercel serverless on listing create/board pages.
 * Label/sort metadata is refreshed by build-time `sync-reference-data.mjs`.
 */
export async function ensureAllProducts(): Promise<number> {
  if (ensureAllInFlight) return ensureAllInFlight;
  ensureAllInFlight = ensureAllProductsInner().finally(() => {
    ensureAllInFlight = null;
  });
  return ensureAllInFlight;
}

async function ensureAllProductsInner(): Promise<number> {
  const existing = await prisma.product.findMany({ select: { slug: true } });
  const have = new Set(existing.map((r) => r.slug));
  const missing = PRODUCT_CATALOG.filter((p) => !have.has(p.slug));

  if (missing.length === 0) {
    return existing.length;
  }

  await prisma.product.createMany({
    data: missing.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameKey: p.nameKey,
      sortOrder: p.sortOrder,
    })),
    skipDuplicates: true,
  });

  return PRODUCT_CATALOG.length;
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

  try {
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
  } catch {
    // Race: another request inserted the same slug — re-read.
    const again = await prisma.product.findFirst({
      where: {
        OR: [{ id: catalog.id }, { slug: catalog.slug }],
      },
    });
    return again?.id ?? null;
  }
}
