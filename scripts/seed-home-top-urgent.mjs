/**
 * Seed demo Top (Boost) + Urgent placements on admin sample supplies.
 *
 * Uses existing [Օրինակ] … [batch-supply-v1] ACTIVE supplies with photos.
 * Does NOT touch Vazgen flax-oil or non-matching titles.
 *
 * Idempotent: upserts Boost rows by a stable marker source DEMO_SEED_TOP,
 * and sets urgentUntil on a separate set of samples.
 *
 * Usage: node scripts/seed-home-top-urgent.mjs
 * Requires: DATABASE_URL (Neon)
 */
import { loadEnvFile } from "./load-env.mjs";
import { PrismaClient } from "@prisma/client";

loadEnvFile();

const prisma = new PrismaClient();
const MARKER = "[Օրինակ]";
const BATCH = "[batch-supply-v1]";
const DEMO_SOURCE = "DEMO_SEED_TOP";
const TOP_COUNT = 4;
const URGENT_COUNT = 4;
const TOP_DAYS = 30;
const URGENT_DAYS = 7;

function addDays(from, days) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  const samples = await prisma.supply.findMany({
    where: {
      status: "ACTIVE",
      title: { contains: MARKER },
      AND: [{ title: { contains: BATCH } }],
      NOT: [{ title: { contains: "կտավատ" } }, { title: { contains: "flax" } }],
    },
    select: {
      id: true,
      title: true,
      userId: true,
      imageUrls: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const withPhotos = samples.filter((s) => {
    try {
      const urls = JSON.parse(s.imageUrls || "[]");
      return Array.isArray(urls) && urls.length > 0;
    } catch {
      return false;
    }
  });

  if (withPhotos.length < TOP_COUNT + URGENT_COUNT) {
    console.warn(
      `[seed-home-top-urgent] Need ≥${TOP_COUNT + URGENT_COUNT} photo samples, found ${withPhotos.length}. Run seed-admin-supply-batch.mjs first.`,
    );
  }

  const topSlice = withPhotos.slice(0, TOP_COUNT);
  const urgentSlice = withPhotos.slice(TOP_COUNT, TOP_COUNT + URGENT_COUNT);

  const now = new Date();
  const topEnds = addDays(now, TOP_DAYS);
  const urgentEnds = addDays(now, URGENT_DAYS);

  const topIds = [];
  for (const s of topSlice) {
    const existing = await prisma.boost.findFirst({
      where: {
        targetType: "SUPPLY",
        targetId: s.id,
        source: DEMO_SOURCE,
      },
    });
    if (existing) {
      await prisma.boost.update({
        where: { id: existing.id },
        data: { days: TOP_DAYS, endsAt: topEnds, startsAt: now },
      });
    } else {
      await prisma.boost.create({
        data: {
          userId: s.userId,
          targetType: "SUPPLY",
          targetId: s.id,
          days: TOP_DAYS,
          startsAt: now,
          endsAt: topEnds,
          source: DEMO_SOURCE,
        },
      });
    }
    topIds.push(s.id);
    console.log(`TOP  ← ${s.id}  ${s.title}`);
  }

  const urgentIds = [];
  for (const s of urgentSlice) {
    await prisma.supply.update({
      where: { id: s.id },
      data: { urgentUntil: urgentEnds },
    });
    urgentIds.push(s.id);
    console.log(`URGENT ← ${s.id}  ${s.title}`);
  }

  console.log(
    `[seed-home-top-urgent] OK — top=${topIds.length} urgent=${urgentIds.length}`,
  );
  console.log("TOP_IDS=" + JSON.stringify(topIds));
  console.log("URGENT_IDS=" + JSON.stringify(urgentIds));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
