/**
 * Upsert Armenia marzes + villages into Postgres (idempotent).
 * Soft-fails so missing DATABASE_URL does not break builds.
 *
 * Usage: node scripts/sync-locations.mjs
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL?.trim() || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(url);

if (!isPostgres) {
  console.log("[sync-locations] Skip — DATABASE_URL is not Postgres.");
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const require = createRequire(import.meta.url);

const { PrismaClient } = require("@prisma/client");
const locations = require(join(root, "data", "armenia-locations.json"));
const prisma = new PrismaClient();

try {
  console.log("[sync-locations] Syncing marzes + villages…");
  await prisma.marz.createMany({
    data: locations.marzes.map((m) => ({
      id: m.id,
      slug: m.slug,
      nameHy: m.nameHy,
      nameEn: m.nameEn,
      nameRu: m.nameRu,
      sortOrder: m.sortOrder,
    })),
    skipDuplicates: true,
  });

  for (let i = 0; i < locations.villages.length; i += 200) {
    const chunk = locations.villages.slice(i, i + 200).map((v) => ({
      id: v.id,
      slug: v.slug,
      marzId: v.marzId,
      nameHy: v.nameHy,
      nameEn: v.nameEn,
      nameRu: v.nameRu,
      kind: v.kind,
      lat: v.lat,
      lng: v.lng,
    }));
    await prisma.village.createMany({ data: chunk, skipDuplicates: true });
  }

  const marzes = await prisma.marz.count();
  const villages = await prisma.village.count();
  console.log(`[sync-locations] OK — marzes=${marzes} villages=${villages}`);
} catch (e) {
  console.warn("[sync-locations] Failed:", e?.message || e);
} finally {
  await prisma.$disconnect().catch(() => {});
}

process.exit(0);
