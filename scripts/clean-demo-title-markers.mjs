/**
 * One-shot: strip bracketed demo markers from titles/descriptions on admin sample listings.
 *
 * Matches: [Օրինակ], [batch-supply-v1], and similar [seed|demo|example|batch-...] tags.
 * Does NOT touch Vazgen flax or other real user listings without these markers.
 *
 * Also appends quiet demo footers for seed idempotency:
 *   demo:admin-sample  /  demo:batch-supply-v1
 *
 * Usage: node scripts/clean-demo-title-markers.mjs
 *        node scripts/clean-demo-title-markers.mjs --dry-run
 */
import { loadEnvFile } from "./load-env.mjs";
import { PrismaClient } from "@prisma/client";

loadEnvFile();

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

/** Bracket tags that look like seed/demo markers (not arbitrary [kg] etc.) */
const TAG_RE =
  /\[(?:Օրինակ|օրինակ|example|Example|EXAMPLE|demo|Demo|DEMO|batch-[a-z0-9_-]+|seed-[a-z0-9_-]+|admin-sample)\]/gi;

const DEMO_FOOTER_ADMIN = "demo:admin-sample";
const DEMO_FOOTER_BATCH = "demo:batch-supply-v1";

function hostKind(url) {
  if (url.includes("neon.tech")) return "neon";
  if (url.startsWith("file:")) return "sqlite";
  if (/localhost|127\.0\.0\.1/.test(url)) return "local";
  return "other";
}

/**
 * @param {string | null | undefined} text
 */
function stripTags(text) {
  if (!text) return text ?? "";
  let s = text.replace(TAG_RE, " ");
  // collapse whitespace; tidy spaces around em/en dashes
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([—–-])\s+/g, " $1 ");
  s = s.replace(/^[\s—–-]+|[\s—–-]+$/g, "").trim();
  return s;
}

/**
 * @param {string | null | undefined} text
 */
function hasDemoTag(text) {
  if (!text) return false;
  TAG_RE.lastIndex = 0;
  return TAG_RE.test(text);
}

/**
 * @param {string} desc
 * @param {string} footer
 */
function ensureFooter(desc, footer) {
  const base = stripTags(desc || "");
  if (base.includes(footer)) return base;
  // also strip any previous demo: lines then append
  const withoutOld = base
    .split("\n")
    .filter((line) => !/^demo:[a-z0-9_-]+$/i.test(line.trim()))
    .join("\n")
    .trim();
  return withoutOld ? `${withoutOld}\n${footer}` : footer;
}

/**
 * @param {string} title
 * @param {string | null | undefined} desc
 */
function isBatchSupplyTitle(title, desc) {
  const raw = `${title}\n${desc || ""}`;
  return /\[batch-supply-v1\]/i.test(raw) || /demo:batch-supply-v1/i.test(raw);
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL missing in .env");
    process.exit(1);
  }
  console.log(`DB host kind: ${hostKind(url)}`);
  console.log(`Mode: ${DRY ? "dry-run" : "write"}`);

  /** @type {{ section: string, id: string, before: string, after: string }[]} */
  const changes = [];

  /**
   * @param {object} opts
   * @param {string} opts.section
   * @param {Array<{id:string,title?:string,name?:string,description?:string|null,irrigationNotes?:string|null}>} opts.rows
   * @param {(id: string, data: object) => Promise<unknown>} opts.update
   * @param {'title'|'name'} opts.titleField
   * @param {'description'|'irrigationNotes'} opts.descField
   * @param {(row: object) => string} [opts.footerFor]
   */
  async function processRows({
    section,
    rows,
    update,
    titleField,
    descField,
    footerFor,
  }) {
    for (const row of rows) {
      const beforeTitle = String(row[titleField] ?? "");
      const beforeDesc = String(row[descField] ?? "");
      if (!hasDemoTag(beforeTitle) && !hasDemoTag(beforeDesc)) continue;

      // Safety: skip flax/vazgen-looking titles even if somehow tagged
      if (/կտավատ|flax/i.test(beforeTitle)) {
        console.log(`SKIP flax-like ${section} ${row.id}`);
        continue;
      }

      const afterTitle = stripTags(beforeTitle);
      const footer = footerFor
        ? footerFor(row)
        : isBatchSupplyTitle(beforeTitle, beforeDesc)
          ? DEMO_FOOTER_BATCH
          : DEMO_FOOTER_ADMIN;
      const afterDesc = ensureFooter(beforeDesc, footer);

      if (afterTitle === beforeTitle && afterDesc === beforeDesc) continue;

      changes.push({
        section,
        id: row.id,
        before: beforeTitle,
        after: afterTitle,
      });

      if (!DRY) {
        await update(row.id, {
          [titleField]: afterTitle,
          [descField]: afterDesc,
        });
      }
    }
  }

  // Find candidates with '[' in title/name (cheap filter)
  const supply = await prisma.supply.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "supply",
    rows: supply,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.supply.update({ where: { id }, data }),
    footerFor: (row) =>
      isBatchSupplyTitle(row.title, row.description)
        ? DEMO_FOOTER_BATCH
        : DEMO_FOOTER_ADMIN,
  });

  const demand = await prisma.demand.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "demand",
    rows: demand,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.demand.update({ where: { id }, data }),
  });

  const forward = await prisma.futureHarvest.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "forward",
    rows: forward,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.futureHarvest.update({ where: { id }, data }),
  });

  const animals = await prisma.animalListing.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "animals",
    rows: animals,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.animalListing.update({ where: { id }, data }),
  });

  const machinery = await prisma.machineryListing.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "machinery",
    rows: machinery,
    titleField: "title",
    descField: "description",
    update: (id, data) =>
      prisma.machineryListing.update({ where: { id }, data }),
  });

  const jobs = await prisma.jobRequest.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "jobs",
    rows: jobs,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.jobRequest.update({ where: { id }, data }),
  });

  const plots = await prisma.plot.findMany({
    where: {
      OR: [
        { name: { contains: "[" } },
        { irrigationNotes: { contains: "[" } },
      ],
    },
    select: { id: true, name: true, irrigationNotes: true },
  });
  await processRows({
    section: "plots",
    rows: plots,
    titleField: "name",
    descField: "irrigationNotes",
    update: (id, data) => prisma.plot.update({ where: { id }, data }),
  });

  const shop = await prisma.catalogListing.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "shop",
    rows: shop,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.catalogListing.update({ where: { id }, data }),
  });

  const providers = await prisma.serviceProvider.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "providers",
    rows: providers,
    titleField: "title",
    descField: "description",
    update: (id, data) =>
      prisma.serviceProvider.update({ where: { id }, data }),
  });

  const groupBuy = await prisma.groupBuyCampaign.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "group-buy",
    rows: groupBuy,
    titleField: "title",
    descField: "description",
    update: (id, data) =>
      prisma.groupBuyCampaign.update({ where: { id }, data }),
  });

  const spaces = await prisma.spaceListing.findMany({
    where: {
      OR: [
        { title: { contains: "[" } },
        { description: { contains: "[" } },
      ],
    },
    select: { id: true, title: true, description: true },
  });
  await processRows({
    section: "spaces",
    rows: spaces,
    titleField: "title",
    descField: "description",
    update: (id, data) => prisma.spaceListing.update({ where: { id }, data }),
  });

  console.log("\n=== Changes ===");
  for (const c of changes) {
    console.log(`${c.section.padEnd(12)} ${c.id}`);
    console.log(`  before: ${c.before}`);
    console.log(`  after:  ${c.after}`);
  }
  console.log(`\nUPDATED_COUNT=${changes.length}`);
  if (DRY) console.log("(dry-run — no writes)");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
