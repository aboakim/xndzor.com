/**
 * Upsert crop/products + subscription plans into Postgres (idempotent).
 * Soft-fails so missing DATABASE_URL does not break builds.
 *
 * Usage: node scripts/sync-reference-data.mjs
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile();

const url = process.env.DATABASE_URL?.trim() || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(url);

if (!isPostgres) {
  console.log("[sync-reference-data] Skip — DATABASE_URL is not Postgres.");
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const require = createRequire(import.meta.url);

const { PrismaClient } = require("@prisma/client");
const productsData = require(join(root, "data", "products.json"));
const plansData = require(join(root, "data", "plans.json"));
const prisma = new PrismaClient();

try {
  console.log("[sync-reference-data] Syncing products…");
  const existing = await prisma.product.findMany({ select: { slug: true } });
  const have = new Set(existing.map((r) => r.slug));
  const missing = productsData.products.filter((p) => !have.has(p.slug));

  if (missing.length > 0) {
    await prisma.product.createMany({
      data: missing.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameKey: p.nameKey,
        sortOrder: p.sortOrder,
      })),
      skipDuplicates: true,
    });
  }

  // Refresh labels/order in parallel chunks (build-time only — OK if a few seconds).
  const chunkSize = 50;
  for (let i = 0; i < productsData.products.length; i += chunkSize) {
    const chunk = productsData.products.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((p) =>
        prisma.product.update({
          where: { slug: p.slug },
          data: { nameKey: p.nameKey, sortOrder: p.sortOrder },
        }),
      ),
    );
  }

  console.log("[sync-reference-data] Syncing plans…");
  for (const plan of plansData.plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        kind: plan.kind,
        nameKey: plan.nameKey,
        amountAmd: plan.amountAmd,
        interval: plan.interval,
        sortOrder: plan.sortOrder,
      },
    });
  }

  const products = await prisma.product.count();
  const plans = await prisma.plan.count();
  console.log(`[sync-reference-data] OK — products=${products} plans=${plans}`);
} catch (e) {
  console.warn("[sync-reference-data] Failed:", e?.message || e);
} finally {
  await prisma.$disconnect().catch(() => {});
}

process.exit(0);
