/**
 * Adds CSRF header to client fetch mutations via apiMutation helper.
 * Run: node scripts/patch-csrf-client.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

const SKIP = new Set([
  path.normalize("src/components/PageViewBeacon.tsx"),
  path.normalize("src/components/CheckoutButton.tsx"),
  path.normalize("src/components/AcceptedPayments.tsx"),
  path.normalize("src/app/[locale]/checkout/card/CardCheckoutClient.tsx"),
  path.normalize("src/app/[locale]/checkout/card/StripeCardSection.tsx"),
  path.normalize("src/app/[locale]/checkout/bank/BankCheckoutClient.tsx"),
  path.normalize("src/app/[locale]/checkout/demo/DemoCheckoutClient.tsx"),
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const IMPORT =
  'import { apiMutation } from "@/lib/fetch-with-csrf";\n';

let changed = 0;

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (SKIP.has(rel)) continue;

  let text = fs.readFileSync(file, "utf8");
  if (!text.includes('headers: { "Content-Type": "application/json" }')) continue;
  if (text.includes('from "@/lib/fetch-with-csrf"')) continue;

  const next = text
    .replace(/\bfetch\(/g, "apiMutation(")
    .replace(/body: JSON\.stringify\(([^)]+)\)/g, "json: $1");

  if (next === text) continue;

  const lines = next.split("\n");
  const useIdx = lines.findIndex((l) => l.startsWith('"use client"'));
  const insertAt = useIdx >= 0 ? useIdx + 2 : 0;
  lines.splice(insertAt, 0, IMPORT.trim());
  fs.writeFileSync(file, lines.join("\n"));
  changed++;
  console.log("patched", rel);
}

console.log("done,", changed, "files");