// One-off data fetch: Armenian settlement names (Armenian script) + coordinates from OSM.
// Output: data/osm-places.json
import fs from "node:fs";

const query = `[out:json][timeout:300];
area["ISO3166-1"="AM"]->.a;
node["place"~"^(city|town|village|hamlet|suburb|quarter|isolated_dwelling|neighbourhood)$"](area.a);
out tags center;`;

const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

let json = null;
for (const url of endpoints) {
  try {
    console.log("trying", url);
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
      console.log("  http", res.status, (await res.text()).slice(0, 300));
      continue;
    }
    json = await res.json();
    break;
  } catch (e) {
    console.log("  failed:", e.message);
  }
}

if (!json) {
  console.error("all endpoints failed");
  process.exit(1);
}

const places = (json.elements || []).map((el) => ({
  id: el.id,
  lat: el.lat,
  lon: el.lon,
  place: el.tags?.place,
  name: el.tags?.name,
  nameHy: el.tags?.["name:hy"],
  nameEn: el.tags?.["name:en"],
  nameRu: el.tags?.["name:ru"],
  intName: el.tags?.["int_name"],
  altName: el.tags?.["alt_name"],
  wikidata: el.tags?.wikidata,
}));

fs.writeFileSync("data/osm-places.json", JSON.stringify(places, null, 1), "utf8");
console.log("places:", places.length);
