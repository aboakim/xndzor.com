/**
 * Audit useTranslations / getTranslations namespaces and literal t("a.b.c") keys
 * against messages/{locale}.json. Prints missing leaves.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "src");

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p, acc);
    } else if (/\.(tsx?|jsx?)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function getByPath(obj, dotted) {
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

const files = walk(srcRoot);
const namespaces = new Set();
const literalKeys = new Set();

const nsRe =
  /(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?["'`]([^"'`]+)["'`]/g;
const tRe = /\bt\(\s*["']([a-zA-Z][\w.]*)["']/g;
const tTplRe = /\bt\(\s*`([a-zA-Z][\w.]*)`/g;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = nsRe.exec(text))) namespaces.add(m[1]);
  while ((m = tRe.exec(text))) literalKeys.add(m[1]);
  while ((m = tTplRe.exec(text))) literalKeys.add(m[1]);
}

// Also collect farmOs.* string literals from lib
const keyLitRe = /["'`]((?:farmOs|home\.recentKind)[\w.]*)["'`]/g;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = keyLitRe.exec(text))) literalKeys.add(m[1]);
}

const locales = ["hy", "en", "ru"];
const report = {};

for (const locale of locales) {
  const messages = JSON.parse(
    fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8")
  );
  const missingNs = [];
  const missingKeys = [];

  for (const ns of [...namespaces].sort()) {
    if (getByPath(messages, ns) === undefined) missingNs.push(ns);
  }
  for (const key of [...literalKeys].sort()) {
    // skip dynamic-looking leftovers
    if (key.includes("${")) continue;
    const val = getByPath(messages, key);
    if (val === undefined) missingKeys.push(key);
  }

  report[locale] = { missingNs, missingKeys };
  console.log(`\n=== ${locale} ===`);
  console.log("missing namespaces:", missingNs.length ? missingNs.join(", ") : "(none)");
  console.log("missing literal keys:", missingKeys.length);
  if (missingKeys.length) {
    console.log(missingKeys.slice(0, 80).join("\n"));
    if (missingKeys.length > 80) console.log(`… +${missingKeys.length - 80} more`);
  }
}

// Verify recentKind + farmOs presence
for (const locale of locales) {
  const m = JSON.parse(
    fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8")
  );
  const kinds = ["machinery", "animals", "supply", "forward", "demand", "jobs"];
  const miss = kinds.filter((k) => !m.home?.recentKind?.[k]);
  console.log(
    `\n${locale} recentKind missing:`,
    miss.length ? miss.join(",") : "none",
    "| farmOs:",
    !!m.farmOs
  );
}

fs.writeFileSync(
  path.join(root, "scripts", "_i18n-audit-report.json"),
  JSON.stringify(report, null, 2)
);
console.log("\nWrote scripts/_i18n-audit-report.json");
