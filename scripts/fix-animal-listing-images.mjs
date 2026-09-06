/**
 * Fix mislabeled animal seed photos (Pexels IDs returned cities/pianos/etc.),
 * then patch AnimalListing.imageUrls in DB by animalType.
 *
 * Run: node scripts/fix-animal-listing-images.mjs
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const seedRoot = join(root, "public", "seed");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Subject-checked livestock photos — Wikimedia Commons (stable, verified content). */
const DOWNLOADS = [
  {
    dest: "animals/cow.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Holstein_dairy_cows.jpg/1280px-Holstein_dairy_cows.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Holstein_dairy_cows.jpg",
    note: "Holstein dairy cows (USDA-ARS, public domain)",
  },
  {
    dest: "animals/goat.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/SaanenGoat_HolyIsle.jpg/1280px-SaanenGoat_HolyIsle.jpg",
    source: "https://commons.wikimedia.org/wiki/File:SaanenGoat_HolyIsle.jpg",
    note: "Saanen goat",
  },
  {
    dest: "animals/bull.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Purebred_Hereford_bull%2C_Willow_Creek_Ranch%2C_Montana_(LOC).jpg/1280px-Purebred_Hereford_bull%2C_Willow_Creek_Ranch%2C_Montana_(LOC).jpg",
    source: "https://commons.wikimedia.org/wiki/File:Purebred_Hereford_bull,_Willow_Creek_Ranch,_Montana_(LOC).jpg",
    note: "Hereford bull in field",
  },
  {
    dest: "animals/sheep.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flock_of_sheep.jpg/1280px-Flock_of_sheep.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Flock_of_sheep.jpg",
    note: "Flock of sheep (USDA-ARS, public domain)",
  },
  {
    dest: "animals/bees.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Beehives_at_Government_House_Adelaide%2C_South_Australia.jpg/1280px-Beehives_at_Government_House_Adelaide%2C_South_Australia.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Beehives_at_Government_House_Adelaide,_South_Australia.jpg",
    note: "Beehives in field",
  },
];

/** animalType → local seed path */
const ANIMAL_IMAGE_BY_TYPE = {
  COW: "/seed/animals/cow.jpg",
  BULL: "/seed/animals/bull.jpg",
  SHEEP: "/seed/animals/sheep.jpg",
  GOAT: "/seed/animals/goat.jpg",
  PIG: "/seed/animals/pig.jpg",
  HORSE: "/seed/animals/horse.jpg",
  CHICKEN: "/seed/animals/chicken.jpg",
  BEE_COLONY: "/seed/animals/bees.jpg",
  DOG: "/seed/animals/dog.jpg",
};

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

async function ensureExistingAnimalJpgs() {
  const required = Object.values(ANIMAL_IMAGE_BY_TYPE).map((p) =>
    p.replace("/seed/", ""),
  );
  for (const rel of required) {
    await access(join(seedRoot, rel));
  }
}

function animalPhoto(animalType) {
  const path = ANIMAL_IMAGE_BY_TYPE[animalType];
  if (!path) return null;
  return JSON.stringify([path]);
}

async function patchAnimalListingImages() {
  const prisma = new PrismaClient();
  try {
    const listings = await prisma.animalListing.findMany({
      select: { id: true, title: true, animalType: true, imageUrls: true },
    });
    let updated = 0;
    for (const row of listings) {
      const expected = animalPhoto(row.animalType);
      if (!expected) continue;
      if (row.imageUrls === expected) continue;
      await prisma.animalListing.update({
        where: { id: row.id },
        data: { imageUrls: expected },
      });
      console.log(`DB  ${row.animalType} — ${row.title} → ${expected}`);
      updated++;
    }
    console.log(`Patched ${updated} animal listing row(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log("Downloading corrected animal photos…");
let failed = false;
for (const item of DOWNLOADS) {
  try {
    const bytes = await downloadOne(item);
    console.log(`OK  ${item.dest} (${Math.round(bytes / 1024)} KB) — ${item.note}`);
  } catch (err) {
    console.error(`FAIL ${item.dest}: ${err.message || err}`);
    failed = true;
  }
  await sleep(600);
}

if (failed) {
  console.error("Some downloads failed — fix URLs and retry.");
  process.exitCode = 1;
} else {
  await ensureExistingAnimalJpgs();
  console.log("All animal JPGs present.");
  await patchAnimalListingImages();
}
