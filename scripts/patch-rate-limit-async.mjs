import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = path.join(ROOT, "src", "app", "api");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "route.ts") out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walk(API)) {
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("rateLimit(")) continue;
  const next = text
    .replace(
      /import \{([^}]*)\brateLimit\b([^}]*)\} from "@\/lib\/rate-limit";/g,
      (m, a, b) => {
        if (m.includes("rateLimitAsync")) return m;
        return `import {${a}rateLimitAsync${b}} from "@/lib/rate-limit";`;
      },
    )
    .replace(/\brateLimit\(/g, "await rateLimitAsync(");
  if (next !== text) {
    fs.writeFileSync(file, next);
    n++;
    console.log(path.relative(ROOT, file));
  }
}
console.log("patched", n);