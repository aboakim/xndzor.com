/**
 * Adds Village.slug / lat / lng in place and backfills them from
 * data/armenia-locations.json, so the schema change does not require dropping the
 * database. Safe to re-run.
 *
 * Run: npx tsx scripts/migrate-village-columns.ts
 */
import { PrismaClient } from "@prisma/client";
import locations from "../data/armenia-locations.json";

const prisma = new PrismaClient();

type ColumnInfo = { name: string };

async function columns(): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<ColumnInfo[]>(`PRAGMA table_info("Village")`);
  return rows.map((r) => r.name);
}

async function main() {
  const existing = await columns();
  console.log("existing columns:", existing.join(", "));

  if (!existing.includes("slug")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Village" ADD COLUMN "slug" TEXT NOT NULL DEFAULT ''`
    );
    console.log("added slug");
  }
  if (!existing.includes("lat")) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Village" ADD COLUMN "lat" REAL`);
    console.log("added lat");
  }
  if (!existing.includes("lng")) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Village" ADD COLUMN "lng" REAL`);
    console.log("added lng");
  }

  let updated = 0;
  for (const v of locations.villages) {
    updated += await prisma.$executeRawUnsafe(
      `UPDATE "Village" SET "slug" = ?, "nameHy" = ?, "nameRu" = ?, "lat" = ?, "lng" = ? WHERE "id" = ?`,
      v.slug,
      v.nameHy,
      v.nameRu,
      v.lat,
      v.lng,
      v.id
    );
  }
  console.log("backfilled rows:", updated);

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Village_slug_key" ON "Village"("slug")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Village_nameHy_idx" ON "Village"("nameHy")`
  );
  console.log("indexes ensured");

  const [{ n }] = await prisma.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*) AS n FROM "Village" WHERE "slug" = '' OR "lat" IS NULL`
  );
  console.log("rows still missing slug/coords:", n);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
