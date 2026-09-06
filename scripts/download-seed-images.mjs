/**
 * Download freely licensed seed images into public/seed/.
 * Run: node scripts/download-seed-images.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const seedRoot = join(root, "public", "seed");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** @type {{ dest: string; url: string; source: string; license: string }[]} */
const IMAGES = [
  // Animals — Wikimedia Commons (Pexels IDs were returning unrelated photos)
  {
    dest: "animals/cow.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Holstein_dairy_cows.jpg/1280px-Holstein_dairy_cows.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Holstein_dairy_cows.jpg",
    license: "Public domain (USDA-ARS)",
  },
  {
    dest: "animals/bull.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Purebred_Hereford_bull%2C_Willow_Creek_Ranch%2C_Montana_(LOC).jpg/1280px-Purebred_Hereford_bull%2C_Willow_Creek_Ranch%2C_Montana_(LOC).jpg",
    source: "https://commons.wikimedia.org/wiki/File:Purebred_Hereford_bull,_Willow_Creek_Ranch,_Montana_(LOC).jpg",
    license: "Public domain (LOC)",
  },
  {
    dest: "animals/sheep.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flock_of_sheep.jpg/1280px-Flock_of_sheep.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Flock_of_sheep.jpg",
    license: "Public domain (USDA-ARS)",
  },
  {
    dest: "animals/goat.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/SaanenGoat_HolyIsle.jpg/1280px-SaanenGoat_HolyIsle.jpg",
    source: "https://commons.wikimedia.org/wiki/File:SaanenGoat_HolyIsle.jpg",
    license: "CC BY-SA 2.5",
  },
  {
    dest: "animals/pig.jpg",
    url: "https://images.pexels.com/photos/4885207/pexels-photo-4885207.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/cute-little-pigs-walking-on-dry-land-on-farm-4885207/",
    license: "Pexels License",
  },
  {
    dest: "animals/horse.jpg",
    url: "https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/brown-horse-on-green-grass-field-1996333/",
    license: "Pexels License",
  },
  {
    dest: "animals/chicken.jpg",
    url: "https://images.pexels.com/photos/1405930/pexels-photo-1405930.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/rooster-on-green-grass-1405930/",
    license: "Pexels License",
  },
  {
    dest: "animals/bees.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Beehives_at_Government_House_Adelaide%2C_South_Australia.jpg/1280px-Beehives_at_Government_House_Adelaide%2C_South_Australia.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Beehives_at_Government_House_Adelaide,_South_Australia.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    dest: "animals/dog.jpg",
    url: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/brown-and-white-long-coated-dog-on-green-grass-field-1805164/",
    license: "Pexels License",
  },

  // Crops — mix Wikimedia (already ok) + Unsplash
  {
    dest: "crops/tomato.jpg",
    url: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/red-tomatoes-on-vine",
    license: "Unsplash License",
  },
  {
    dest: "crops/potato.jpg",
    url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/brown-potatoes-on-brown-wooden-table",
    license: "Unsplash License",
  },
  {
    dest: "crops/apple.jpg",
    url: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/red-apple-fruit-on-brown-wooden-table",
    license: "Unsplash License",
  },
  {
    dest: "crops/grape.jpg",
    url: "https://images.unsplash.com/photo-1537642938849-b48a81dd1690?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/green-grapes-on-vine",
    license: "Unsplash License",
  },
  {
    dest: "crops/wheat.jpg",
    url: "https://images.unsplash.com/photo-1574943320215-51d624582757?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/wheat-field-under-blue-sky",
    license: "Unsplash License",
  },
  {
    dest: "crops/honey.jpg",
    url: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/honey-jar-with-dipper",
    license: "Unsplash License",
  },
  {
    dest: "crops/milk.jpg",
    url: "https://images.unsplash.com/photo-1563636619-e9143daee3ba?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/glass-of-milk-on-white-surface",
    license: "Unsplash License",
  },
  {
    dest: "crops/peach.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Autumn_Red_peaches.jpg/1280px-Autumn_Red_peaches.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Autumn_Red_peaches.jpg",
    license: "CC BY-SA 3.0 (Scott Bauer / USDA-ARS)",
  },

  // Harvest / field scenes
  {
    dest: "harvest/tomato-field.jpg",
    url: "https://images.unsplash.com/photo-1592419044706-3978257633b0?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/tomato-field",
    license: "Unsplash License",
  },
  {
    dest: "harvest/wheat-field.jpg",
    url: "https://images.unsplash.com/photo-1500382017468-90403fed7eff?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/golden-wheat-field",
    license: "Unsplash License",
  },
  {
    dest: "harvest/grape-vineyard.jpg",
    url: "https://images.unsplash.com/photo-1506377247377-894445707b61?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/vineyard-rows",
    license: "Unsplash License",
  },
  {
    dest: "harvest/apple-orchard.jpg",
    url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/apple-orchard",
    license: "Unsplash License",
  },
  {
    dest: "harvest/potato-field.jpg",
    url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/potato-harvest-field",
    license: "Unsplash License",
  },
  {
    dest: "harvest/peach-orchard.jpg",
    url: "https://images.pexels.com/photos/18515165/pexels-photo-18515165.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/fresh-peaches-against-a-pastel-colored-background-18515165/",
    license: "Pexels License",
  },
  {
    dest: "harvest/dairy-farm.jpg",
    url: "https://images.unsplash.com/photo-1546445313-29ce7730162d?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/dairy-cows-in-field",
    license: "Unsplash License",
  },
  {
    dest: "harvest/beehives.jpg",
    url: "https://images.pexels.com/photos/56876/beehive-bees-beekeeping-56876.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/beehives-in-a-field-56876/",
    license: "Pexels License",
  },

  // Catalog
  {
    dest: "catalog/npk-fertilizer.jpg",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/fertilizer-bags",
    license: "Unsplash License",
  },
  {
    dest: "catalog/urea-fertilizer.jpg",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/agricultural-supplies",
    license: "Unsplash License",
  },
  {
    dest: "catalog/compost.jpg",
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/compost-soil",
    license: "Unsplash License",
  },
  {
    dest: "catalog/wheat-seed.jpg",
    url: "https://images.unsplash.com/photo-1574943320215-51d624582757?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/wheat-grain-seeds",
    license: "Unsplash License",
  },
  {
    dest: "catalog/tomato-seedlings.jpg",
    url: "https://images.unsplash.com/photo-1592419044706-3978257633b0?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/tomato-seedlings",
    license: "Unsplash License",
  },
  {
    dest: "catalog/hay-bales.jpg",
    url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/hay-bales-in-field",
    license: "Unsplash License",
  },
  {
    dest: "catalog/fungicide.jpg",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/crop-spraying",
    license: "Unsplash License",
  },
  {
    dest: "catalog/drip-irrigation.jpg",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/drip-irrigation",
    license: "Unsplash License",
  },
  {
    dest: "catalog/farmland.jpg",
    url: "https://images.unsplash.com/photo-1500382017468-90403fed7eff?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/irrigated-farmland",
    license: "Unsplash License",
  },

  // Machinery — Unsplash / Pexels
  {
    dest: "machinery/jd-6155r.jpg",
    url: "https://images.unsplash.com/photo-1592982532148-4e0cbb54a3cb?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/green-tractor-in-field",
    license: "Unsplash License",
  },
  {
    dest: "machinery/mtz-82.jpg",
    url: "https://images.unsplash.com/photo-1530268729834-7864216620ae?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/red-tractor-on-farm",
    license: "Unsplash License",
  },
  {
    dest: "machinery/case-axial.jpg",
    url: "https://images.unsplash.com/photo-1620121698229-aa349434c026?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/combine-harvester-in-field",
    license: "Unsplash License",
  },
  {
    dest: "machinery/claas-lexion.jpg",
    url: "https://images.unsplash.com/photo-1620121698229-aa349434c026?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/harvest-combine",
    license: "Unsplash License",
  },
  {
    dest: "machinery/amazone-sprayer.jpg",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/agricultural-field-equipment",
    license: "Unsplash License",
  },
  {
    dest: "machinery/kverneland-seeder.jpg",
    url: "https://images.unsplash.com/photo-1500382017468-90403fed7eff?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/planted-field-rows",
    license: "Unsplash License",
  },
  {
    dest: "machinery/lemken-cultivator.jpg",
    url: "https://images.unsplash.com/photo-1574943320215-51d624582757?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/tilled-wheat-field",
    license: "Unsplash License",
  },
  {
    dest: "machinery/fliegl-trailer.jpg",
    url: "https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/tractor-with-trailer-in-field-1118448/",
    license: "Pexels License",
  },
  {
    dest: "machinery/kamaz-55111.jpg",
    url: "https://images.pexels.com/photos/280012/pexels-photo-280012.jpeg?auto=compress&cs=tinysrgb&w=960",
    source: "https://www.pexels.com/photo/white-and-red-truck-on-road-280012/",
    license: "Pexels License",
  },
  {
    dest: "machinery/newholland-t6.jpg",
    url: "https://images.unsplash.com/photo-1592982532148-4e0cbb54a3cb?auto=format&fit=crop&w=960&q=80",
    source: "https://unsplash.com/photos/modern-tractor",
    license: "Unsplash License",
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

const results = { ok: [], fail: [] };

for (const item of IMAGES) {
  try {
    const bytes = await downloadOne(item);
    results.ok.push({ ...item, bytes });
    console.log(`OK  ${item.dest} (${Math.round(bytes / 1024)} KB)`);
  } catch (err) {
    results.fail.push({ ...item, error: String(err) });
    console.error(`FAIL ${item.dest}: ${err.message || err}`);
  }
  await sleep(800);
}

console.log(`\nDone: ${results.ok.length} ok, ${results.fail.length} failed`);
if (results.fail.length) process.exitCode = 1;
