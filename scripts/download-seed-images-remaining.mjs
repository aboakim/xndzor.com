/** Download remaining seed images — verified Pexels/Wikimedia URLs only. */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..", "public", "seed");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const px = (id, ext = "jpeg") =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&w=960`;

const IMAGES = [
  // Animals — Wikimedia Commons (Pexels IDs returned unrelated photos)
  { dest: "animals/cow.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Holstein_dairy_cows.jpg/1280px-Holstein_dairy_cows.jpg" },
  { dest: "animals/bull.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Purebred_Hereford_bull%2C_Willow_Creek_Ranch%2C_Montana_(LOC).jpg/1280px-Purebred_Hereford_bull%2C_Willow_Creek_Ranch%2C_Montana_(LOC).jpg" },
  { dest: "animals/sheep.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flock_of_sheep.jpg/1280px-Flock_of_sheep.jpg" },
  { dest: "animals/goat.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/SaanenGoat_HolyIsle.jpg/1280px-SaanenGoat_HolyIsle.jpg" },
  { dest: "animals/pig.jpg", url: px(4885207) },
  { dest: "animals/horse.jpg", url: px(1996333) },
  { dest: "animals/chicken.jpg", url: px(1405930) },
  { dest: "animals/bees.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Beehives_at_Government_House_Adelaide%2C_South_Australia.jpg/1280px-Beehives_at_Government_House_Adelaide%2C_South_Australia.jpg" },
  { dest: "animals/dog.jpg", url: px(1805164) },
  { dest: "crops/grape.jpg", url: px(2306281) },
  { dest: "crops/wheat.jpg", url: px(1128678) },
  { dest: "crops/milk.jpg", url: px(236010) },
  // Verified peach photos (prior Pexels IDs returned unrelated fruit/flowers)
  { dest: "crops/peach.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Autumn_Red_peaches.jpg/1280px-Autumn_Red_peaches.jpg" },
  { dest: "harvest/tomato-field.jpg", url: px(1327838) },
  { dest: "harvest/wheat-field.jpg", url: px(1128678) },
  { dest: "harvest/grape-vineyard.jpg", url: px(340874) },
  { dest: "harvest/peach-orchard.jpg", url: px(18515165) },
  { dest: "harvest/dairy-farm.jpg", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Holstein_dairy_cows.jpg/1280px-Holstein_dairy_cows.jpg" },
  { dest: "harvest/beehives.jpg", url: px(301884) },
  { dest: "catalog/wheat-seed.jpg", url: px(1128678) },
  { dest: "catalog/tomato-seedlings.jpg", url: px(1327838) },
  { dest: "catalog/farmland.jpg", url: px(340874) },
  // Machinery — Pexels (Unsplash URLs in main script often 404)
  { dest: "machinery/jd-6155r.jpg", url: px(552774) },
  { dest: "machinery/mtz-82.jpg", url: px(1267324) },
  { dest: "machinery/case-axial.jpg", url: px(2166711) },
  { dest: "machinery/claas-lexion.jpg", url: px(265216) },
  { dest: "machinery/kverneland-seeder.jpg", url: px(1128678) },
  { dest: "machinery/lemken-cultivator.jpg", url: px(1327838) },
  { dest: "machinery/newholland-t6.jpg", url: px(552774) },
];

for (const { dest, url } of IMAGES) {
  const out = join(seedRoot, dest);
  await mkdir(dirname(out), { recursive: true });
  const res = await fetch(url, { headers: { "User-Agent": "FarmOS-Seed/1.0" } });
  if (!res.ok) {
    console.error(`FAIL ${dest}: ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  console.log(`OK ${dest} (${Math.round(buf.length / 1024)} KB)`);
  await sleep(600);
}
