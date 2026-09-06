/**
 * Fix crop photos that are wrong/missing, then patch Demand.imageUrls in DB.
 * Run: node scripts/fix-crop-listing-images.mjs
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const seedRoot = join(root, "public", "seed");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Verified produce photos (subject-checked — avoid mislabeled stock IDs). */
const DOWNLOADS = [
  {
    dest: "crops/peach.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Autumn_Red_peaches.jpg/1280px-Autumn_Red_peaches.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Autumn_Red_peaches.jpg",
    note: "ripe peaches halved",
  },
  {
    dest: "harvest/peach-orchard.jpg",
    url: "https://images.pexels.com/photos/18515165/pexels-photo-18515165.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/fresh-peaches-against-a-pastel-colored-background-18515165/",
    note: "fresh peaches / nectarines",
  },
];

const UA = "FarmOS-Seed/1.0 (Gyuxatntes demo; educational)";

async function downloadOne({ dest, url }, attempt = 1) {
  const outPath = join(seedRoot, dest);
  await mkdir(dirname(outPath), { recursive: true });
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*" },
    redirect: "follow",
  });
  if (res.status === 429 && attempt < 5) {
    await sleep(2000 * attempt);
    return downloadOne({ dest, url }, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`file too small (${buf.length} bytes)`);
  await writeFile(outPath, buf);
  return buf.length;
}

async function ensureExistingCropJpgs() {
  const required = [
    "crops/honey.jpg",
    "crops/milk.jpg",
    "crops/potato.jpg",
    "crops/tomato.jpg",
    "crops/apple.jpg",
    "crops/grape.jpg",
    "crops/wheat.jpg",
  ];
  for (const rel of required) {
    await access(join(seedRoot, rel));
  }
}

function cropPhoto(slug) {
  return JSON.stringify([`/seed/crops/${slug}.jpg`]);
}

async function patchDemandImages() {
  const prisma = new PrismaClient();
  try {
    const demands = await prisma.demand.findMany({
      select: { id: true, title: true, imageUrls: true, product: { select: { slug: true } } },
    });
    let updated = 0;
    for (const d of demands) {
      const empty = !d.imageUrls || d.imageUrls === "[]" || d.imageUrls === "null";
      if (!empty) continue;
      const slug = d.product.slug;
      if (slug === "other") continue;
      const imageUrls = cropPhoto(slug);
      await prisma.demand.update({ where: { id: d.id }, data: { imageUrls } });
      console.log(`DB  ${d.title} → crops/${slug}.jpg`);
      updated++;
    }
    console.log(`Patched ${updated} demand rows with empty imageUrls`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log("Downloading corrected peach photos…");
for (const item of DOWNLOADS) {
  try {
    const bytes = await downloadOne(item);
    console.log(`OK  ${item.dest} (${Math.round(bytes / 1024)} KB) — ${item.note}`);
  } catch (err) {
    console.error(`FAIL ${item.dest}: ${err.message || err}`);
    process.exitCode = 1;
  }
  await sleep(600);
}

await ensureExistingCropJpgs();
console.log("Existing crop JPGs present.");
await patchDemandImages();
