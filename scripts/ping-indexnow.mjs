/**
 * Ping IndexNow with Armenia region + board URLs (no secrets required).
 * Usage: node scripts/ping-indexnow.mjs
 */
const BASE = process.env.SITE_URL || "https://www.xndzor.com";
const KEY = "xndzor-armenia-index-2026";
const LOCALES = ["hy", "ru", "en"];
const MARZES = [
  "Yerevan",
  "Aragatsotn",
  "Ararat",
  "Armavir",
  "Gegharkunik",
  "Kotayk",
  "Lori",
  "Shirak",
  "Syunik",
  "Tavush",
  "VayotsDzor",
];

const urls = [BASE, `${BASE}/sitemap.xml`];
for (const locale of LOCALES) {
  urls.push(`${BASE}/${locale}`);
  urls.push(`${BASE}/${locale}/regions`);
  urls.push(`${BASE}/${locale}/supply`);
  for (const marz of MARZES) {
    urls.push(`${BASE}/${locale}/regions/${marz}`);
  }
}

const host = new URL(BASE).host;
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key: KEY,
    keyLocation: `${BASE}/${KEY}.txt`,
    urlList: urls,
  }),
});

const text = await res.text().catch(() => "");
console.log(
  JSON.stringify(
    { status: res.status, ok: res.ok || res.status === 202, count: urls.length, body: text.slice(0, 200) },
    null,
    2,
  ),
);
process.exit(res.ok || res.status === 202 || res.status === 200 ? 0 : 1);
