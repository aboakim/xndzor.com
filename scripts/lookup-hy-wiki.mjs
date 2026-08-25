// Helper: resolve Armenian toponym spellings via Wikidata + Armenian Wikipedia.
// Writes data/wiki-lookup.json (UTF-8) so results are readable regardless of console codepage.
import fs from "node:fs";

const terms = process.argv.slice(2);
const UA = { "User-Agent": "FarmOS-dev/1.0 (village name localisation)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function j(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!res.ok) return null;
  return res.json();
}

const out = {};
for (const term of terms) {
  const wd = await j(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&uselang=en&type=item&limit=8&format=json&origin=*`
  );
  const hits = [];
  for (const s of wd?.search || []) {
    const ent = await j(
      `https://www.wikidata.org/wiki/Special:EntityData/${s.id}.json`
    );
    const e = ent?.entities?.[s.id];
    if (!e) continue;
    const country = e.claims?.P17?.[0]?.mainsnak?.datavalue?.value?.id;
    const coord = e.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    const admin = e.claims?.P131?.map(
      (c) => c.mainsnak?.datavalue?.value?.id
    );
    hits.push({
      id: s.id,
      enLabel: e.labels?.en?.value,
      hyLabel: e.labels?.hy?.value,
      ruLabel: e.labels?.ru?.value,
      description: s.description,
      country,
      admin,
      lat: coord?.latitude,
      lng: coord?.longitude,
    });
    await sleep(150);
  }
  out[term] = hits.filter((h) => h.country === "Q399" || h.hyLabel);
  await sleep(200);
}

fs.writeFileSync("data/wiki-lookup.json", JSON.stringify(out, null, 1), "utf8");
console.log("written", Object.keys(out).length);
