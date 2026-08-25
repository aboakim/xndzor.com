// One-off data fetch: marz (admin_level=4) boundary polygons for Armenia, so village
// coordinates can be validated against the province they belong to.
// Output: data/marz-boundaries.json  { [nameEn]: number[][][] }  (rings of [lon, lat])
import fs from "node:fs";

const query = `[out:json][timeout:300];
area["ISO3166-1"="AM"]->.a;
relation["boundary"="administrative"]["admin_level"="4"](area.a);
out geom;`;

const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

let json = null;
for (const url of endpoints) {
  console.log("trying", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "FarmOS-dev/1.0 (village name localisation)",
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: AbortSignal.timeout(300000),
    });
    if (!res.ok) {
      console.log("  http", res.status);
      continue;
    }
    json = await res.json();
    break;
  } catch (e) {
    console.log("  failed:", e.message);
  }
}
if (!json) process.exit(1);

const out = {};
for (const rel of json.elements || []) {
  const nameEn = rel.tags?.["name:en"] || rel.tags?.name;
  if (!nameEn) continue;
  const rings = [];
  for (const m of rel.members || []) {
    if (m.type !== "way" || !m.geometry) continue;
    rings.push(m.geometry.map((g) => [g.lon, g.lat]));
  }
  out[nameEn] = rings;
  console.log(" ", nameEn, rel.tags?.name, "ways:", rings.length);
}

fs.writeFileSync("data/marz-boundaries.json", JSON.stringify(out), "utf8");
console.log("regions:", Object.keys(out).length);
