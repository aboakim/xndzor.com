// Looks up Armenian names + coordinates for the villages that the OSM place-node join
// could not resolve, using Nominatim. Prints candidates for manual review and writes
// data/unresolved-candidates.json. Does not modify data/armenia-locations.json.
import fs from "node:fs";

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const { unresolvedNames, noCoords } = read("data/unresolved-villages.json");
const locations = read("data/armenia-locations.json");
const marzById = new Map(locations.marzes.map((m) => [m.id, m]));
const byId = new Map(locations.villages.map((v) => [v.id, v]));

const targets = [...new Map([...unresolvedNames, ...noCoords].map((v) => [v.id, v])).values()];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "User-Agent": "FarmOS-dev/1.0 (village name localisation)" };

async function search(q, extra = "") {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&accept-language=hy&limit=5&countrycodes=am${extra}`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!res.ok) return [];
  return res.json();
}

const results = {};
for (const t of targets) {
  const marz = marzById.get(t.marzId);
  const v = byId.get(t.id);
  const queries = [
    `${v.nameEn}, ${marz?.nameEn} Province, Armenia`,
    `${v.nameEn}, Armenia`,
  ];
  const found = [];
  for (const q of queries) {
    const rows = await search(q);
    for (const r of rows) {
      if (!["village", "town", "city", "hamlet", "administrative", "suburb", "locality"].includes(r.type))
        continue;
      found.push({
        name: r.name,
        type: r.type,
        cls: r.category || r.class,
        lat: Number(r.lat),
        lon: Number(r.lon),
        display: r.display_name,
      });
    }
    await sleep(1100);
    if (found.length) break;
  }
  results[t.id] = { nameEn: v.nameEn, marz: t.marzId, kind: v.kind, candidates: found };
  console.log(
    `${t.id} | ${v.nameEn} (${t.marzId}) ->`,
    found.length
      ? found
          .map((f) => `${f.name} [${f.type}] ${f.lat.toFixed(4)},${f.lon.toFixed(4)}`)
          .join(" | ")
      : "NONE"
  );
}

fs.writeFileSync("data/unresolved-candidates.json", JSON.stringify(results, null, 1), "utf8");
