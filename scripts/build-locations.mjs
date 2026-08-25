// Rebuilds data/armenia-locations.json so that every marz and settlement carries a real
// Armenian name (nameHy), a Russian name (nameRu), a URL slug and map coordinates.
//
// Sources:
//   data/all-settlement.json     — Open Admin Data settlements (ids, EN names, anchor lat/lon)
//   data/osm-places.json         — OSM place nodes for Armenia (Armenian + Russian names, coords)
//   data/marz-boundaries.json    — OSM province polygons, used to pick the right same-named village
//   data/village-names-hy.json   — hand-curated overrides for anything the join cannot resolve
//   data/armenia-locations.json  — previous file (the marz list is reused as-is)
//
// Run: node scripts/build-locations.mjs
import fs from "node:fs";

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// OSM names occasionally carry bidi/zero-width marks, which survive into the UI and break
// name matching.
const cleanName = (s) =>
  (s || "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const existing = read("data/armenia-locations.json");
const settlements = read("data/all-settlement.json");
const osm = read("data/osm-places.json");
const boundaries = read("data/marz-boundaries.json");
const OVERRIDES = read("data/village-names-hy.json");

const settlementById = new Map(settlements.map((s) => [s.id, s]));

// ——— Armenian → latin transliteration (loose, for name joining only) ———
const HY_LATIN = {
  ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "e", ը: "y", թ: "t",
  ժ: "zh", ի: "i", լ: "l", խ: "kh", ծ: "ts", կ: "k", հ: "h", ձ: "dz",
  ղ: "gh", ճ: "ch", մ: "m", յ: "y", ն: "n", շ: "sh", ո: "o", չ: "ch",
  պ: "p", ջ: "j", ռ: "r", ս: "s", վ: "v", տ: "t", ր: "r", ց: "ts",
  ւ: "v", փ: "p", ք: "k", օ: "o", ֆ: "f", և: "ev",
};
function translitHy(s) {
  if (!s) return "";
  let out = "";
  for (const ch of s.toLowerCase().replace(/ու/g, "u").replace(/եւ/g, "ev")) {
    out += HY_LATIN[ch] ?? (/[a-z0-9 -]/.test(ch) ? ch : "");
  }
  return out;
}

const norm = (s) =>
  (s || "").toLowerCase().replace(/[’'`ʻ]/g, "").replace(/[^a-z0-9]+/g, "");

// Fold the differing transliteration systems onto each other (kh/x, gh/g, ts/dz/c …).
const fold = (s) =>
  norm(s)
    .replace(/kh/g, "x").replace(/gh/g, "g").replace(/ts/g, "c").replace(/dz/g, "c")
    .replace(/zh/g, "j").replace(/ch/g, "c").replace(/sh/g, "s").replace(/ye/g, "e")
    .replace(/yi/g, "i").replace(/w/g, "v").replace(/h/g, "").replace(/y/g, "i")
    .replace(/e/g, "i").replace(/o/g, "u");

function keysFor(...names) {
  const strict = new Set();
  const loose = new Set();
  for (const n of names) {
    if (!n) continue;
    const latin = /[\u0530-\u058F]/.test(n) ? translitHy(n) : n;
    if (!norm(latin)) continue;
    strict.add(norm(latin));
    loose.add(fold(latin));
  }
  return { strict, loose };
}
const intersects = (a, b) => [...a].some((k) => b.has(k));

const R = 6371;
function distKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ——— point in marz ———
// The relation members are an unordered soup of ways; ray-crossing parity is still
// well defined because the boundary as a whole is closed.
const marzEdges = new Map();
for (const [nameEn, ways] of Object.entries(boundaries)) {
  const key = nameEn.replace(/\s+Province$/, "").replace(/\s+/g, "");
  const edges = [];
  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  for (const way of ways) {
    for (let i = 1; i < way.length; i++) {
      edges.push([way[i - 1], way[i]]);
      for (const [lon, lat] of [way[i - 1], way[i]]) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      }
    }
  }
  marzEdges.set(key, { edges, bbox: { minLat, maxLat, minLon, maxLon } });
}

function insideMarz(marzId, lat, lon) {
  const m = marzEdges.get(marzId);
  if (!m) return null;
  const { bbox } = m;
  if (lat < bbox.minLat || lat > bbox.maxLat || lon < bbox.minLon || lon > bbox.maxLon) return false;
  let crossings = 0;
  for (const [[x1, y1], [x2, y2]] of m.edges) {
    if (y1 === y2) continue;
    if (lat < Math.min(y1, y2) || lat >= Math.max(y1, y2)) continue;
    const x = x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1);
    if (x > lon) crossings++;
  }
  return crossings % 2 === 1;
}

const osmPlaces = osm
  .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
  .map((p) => {
    const hy =
      [p.nameHy, p.name].map(cleanName).find((n) => n && /[\u0530-\u058F]/.test(n)) || null;
    const altLatin = (p.altName || "")
      .split(";")
      .map((x) => x.trim())
      .filter((x) => x && !/[\u0530-\u058F]/.test(x));
    const keys = keysFor(p.nameEn, p.intName, p.name, p.nameHy, ...altLatin);
    return { ...p, hy, keys: keys.strict, looseKeys: keys.loose };
  })
  .filter((p) => p.hy);

// Which marz each OSM place sits in (computed once).
for (const p of osmPlaces) {
  p.marzId = null;
  for (const key of marzEdges.keys()) {
    if (insideMarz(key, p.lat, p.lon)) {
      p.marzId = key;
      break;
    }
  }
}

// slug helpers -------------------------------------------------------------
const usedSlugs = new Set();
function makeSlug(nameEn, marzId) {
  const base =
    (nameEn || "village")
      .toLowerCase()
      .replace(/[’'`ʻ]/g, "")
      .replace(/\[[a-z]+\]/gi, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "village";
  for (const c of [base, `${base}-${marzId.toLowerCase()}`]) {
    if (!usedSlugs.has(c)) {
      usedSlugs.add(c);
      return c;
    }
  }
  let i = 2;
  while (usedSlugs.has(`${base}-${marzId.toLowerCase()}-${i}`)) i++;
  const s = `${base}-${marzId.toLowerCase()}-${i}`;
  usedSlugs.add(s);
  return s;
}

const TOWNISH = new Set(["city", "town"]);
const communityOf = (id) => id.split("_").slice(0, 2).join("_");

// ——— candidate collection ————————————————————————————————————————————————
const rows = existing.villages.map((v) => {
  const src = settlementById.get(v.id);
  const anchor = src?.geo ? { lat: Number(src.geo.lat), lon: Number(src.geo.lon) } : null;
  const anchorInMarz = anchor ? insideMarz(v.marzId, anchor.lat, anchor.lon) === true : false;
  const keys = keysFor(v.nameEn, /[\u0530-\u058F]/.test(v.nameHy || "") ? v.nameHy : null);
  const strict = osmPlaces.filter((p) => intersects(keys.strict, p.keys));
  const loose = strict.length
    ? strict
    : osmPlaces.filter((p) => intersects(keys.loose, p.looseKeys));
  return {
    v,
    anchor: anchorInMarz ? anchor : null,
    rawAnchor: anchor,
    candidates: loose,
    inMarz: loose.filter((p) => p.marzId === v.marzId),
    pick: null,
    mode: null,
  };
});

const stats = {};
const bump = (k) => (stats[k] = (stats[k] || 0) + 1);

// Pass 1 — unambiguous: exactly one same-named OSM place inside the right marz.
for (const r of rows) {
  if (r.inMarz.length === 1) {
    r.pick = r.inMarz[0];
    r.mode = "marz-unique";
    bump(r.mode);
  }
}

// Pass 2 — several same-named places inside the marz: use the settlement anchor when it is
// trustworthy, otherwise the centroid of the community's already-resolved settlements.
function communityCentroids() {
  const acc = new Map();
  for (const r of rows) {
    if (!r.pick) continue;
    const key = communityOf(r.v.id);
    const a = acc.get(key) || { lat: 0, lon: 0, n: 0 };
    a.lat += r.pick.lat;
    a.lon += r.pick.lon;
    a.n++;
    acc.set(key, a);
  }
  const out = new Map();
  for (const [k, a] of acc) out.set(k, { lat: a.lat / a.n, lon: a.lon / a.n });
  return out;
}

for (let round = 0; round < 3; round++) {
  const centroids = communityCentroids();
  for (const r of rows) {
    if (r.pick) continue;
    const pool = r.inMarz.length ? r.inMarz : r.candidates;
    if (!pool.length) continue;
    const ref = r.anchor || centroids.get(communityOf(r.v.id)) || null;
    if (ref) {
      const best = pool.map((p) => ({ p, d: distKm(ref, p) })).sort((a, b) => a.d - b.d)[0];
      if (best && best.d <= 45) {
        r.pick = best.p;
        r.mode = r.anchor ? "anchor-nearest" : "community-nearest";
        bump(r.mode);
        continue;
      }
    }
    if (pool.length === 1) {
      r.pick = pool[0];
      r.mode = "name-unique";
      bump(r.mode);
      continue;
    }
    const townish = pool.filter((p) => TOWNISH.has(p.place));
    if (/_town$/.test(r.v.id) && townish.length === 1) {
      r.pick = townish[0];
      r.mode = "community-centre";
      bump(r.mode);
      continue;
    }
    const suburbs = pool.filter((p) => p.place === "suburb");
    if (r.v.marzId === "Yerevan" && suburbs.length === 1) {
      r.pick = suburbs[0];
      r.mode = "yerevan-district";
      bump(r.mode);
    }
  }
}

// ——— assemble output ————————————————————————————————————————————————————
const villages = rows.map((r) => {
  const { v, pick } = r;
  const override = OVERRIDES[v.id];
  let mode = r.mode;

  let nameHy = pick?.hy || null;
  let nameRu = pick?.nameRu && /[\u0400-\u04FF]/.test(pick.nameRu) ? pick.nameRu : null;
  let lat = pick?.lat ?? null;
  let lng = pick?.lon ?? null;
  let coordsSource = pick ? "osm" : null;

  if (override) {
    if (override.nameHy) nameHy = override.nameHy;
    if (override.nameRu) nameRu = override.nameRu;
    if (override.lat != null && override.lng != null) {
      lat = override.lat;
      lng = override.lng;
      coordsSource = "curated";
    }
    mode = mode ? `${mode}+override` : "override";
    bump("override");
  }

  if (!nameHy && /[\u0530-\u058F]/.test(v.nameHy || "")) {
    nameHy = v.nameHy;
    mode = mode || "existing";
  }

  const cleanEn = v.nameEn.replace(/\s*\[[a-z]+\]\s*/gi, "").trim() || v.nameEn;

  return {
    id: v.id,
    marzId: v.marzId,
    slug: makeSlug(cleanEn, v.marzId),
    nameHy: cleanName(nameHy) || cleanEn,
    nameEn: cleanEn,
    nameRu:
      cleanName(nameRu) || (/[\u0400-\u04FF]/.test(v.nameRu || "") ? cleanName(v.nameRu) : "") ||
      cleanEn,
    kind: v.kind,
    lat: lat != null ? Number(Number(lat).toFixed(6)) : null,
    lng: lng != null ? Number(Number(lng).toFixed(6)) : null,
    coordsSource,
    matchMode: mode || "none",
  };
});

// Community-level entries (e.g. the Khoy municipality) own no settlement point: place them
// at the centroid of the settlements they contain.
const byCommunity = new Map();
for (const v of villages) {
  if (v.lat == null || v.coordsSource !== "osm") continue;
  const key = communityOf(v.id);
  byCommunity.set(key, [...(byCommunity.get(key) || []), v]);
}
for (const v of villages) {
  if (v.lat != null) continue;
  const siblings = byCommunity.get(communityOf(v.id));
  if (!siblings?.length) continue;
  v.lat = Number((siblings.reduce((s, x) => s + x.lat, 0) / siblings.length).toFixed(6));
  v.lng = Number((siblings.reduce((s, x) => s + x.lng, 0) / siblings.length).toFixed(6));
  v.coordsSource = "community-centroid";
}

const out = {
  _meta: {
    ...(existing._meta || {}),
    generatedAt: new Date().toISOString(),
    generator: "scripts/build-locations.mjs",
    sources: [
      "Open Admin Data / armenia-administrative-divisions — ids, English names",
      "OpenStreetMap via Overpass API — Armenian names, Russian names, coordinates, province polygons (ODbL)",
      "data/village-names-hy.json — hand-curated overrides",
    ],
  },
  marzes: existing.marzes,
  villages,
};
fs.writeFileSync("data/armenia-locations.json", JSON.stringify(out, null, 1), "utf8");

// ——— report ————————————————————————————————————————————————————————————
const noHy = villages.filter((v) => !/[\u0530-\u058F]/.test(v.nameHy));
const noCoords = villages.filter((v) => v.lat == null);
const outsideMarz = villages.filter(
  (v) => v.lat != null && insideMarz(v.marzId, v.lat, v.lng) === false
);
const bySource = {};
for (const v of villages) bySource[v.coordsSource || "none"] = (bySource[v.coordsSource || "none"] || 0) + 1;

const report = {
  villages: villages.length,
  withArmenianName: villages.length - noHy.length,
  withCoords: villages.length - noCoords.length,
  coordsBySource: bySource,
  matchModes: stats,
  missingArmenianName: noHy.map((v) => `${v.id} ${v.nameEn}`),
  missingCoords: noCoords.map((v) => `${v.id} ${v.nameEn}`),
  coordsOutsideOwnMarz: outsideMarz.map(
    (v) => `${v.id} ${v.nameEn} ${v.lat},${v.lng} (${v.coordsSource}/${v.matchMode})`
  ),
};
fs.writeFileSync("data/locations-report.json", JSON.stringify(report, null, 1), "utf8");
console.log(
  JSON.stringify(
    { ...report, missingArmenianName: noHy.length, coordsOutsideOwnMarz: outsideMarz.length },
    null,
    1
  )
);
