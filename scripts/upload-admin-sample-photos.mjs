/**
 * Idempotent: upload sample photos for admin demo listings and set imageUrls/photoUrls.
 * Finds by known idHint, then by clean title prefix / legacy [Օրինակ] prefix.
 *
 * Sources: public/ads/samples/*.jpg (generated / curated).
 * Upload: BLOB_READ_WRITE_TOKEN via @vercel/blob, else production /api/upload with admin session.
 * DB: DATABASE_URL (production Neon).
 *
 * Usage: node scripts/upload-admin-sample-photos.mjs
 *        node scripts/upload-admin-sample-photos.mjs --force   # re-upload even if URLs exist
 * Does not print secrets.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { loadEnvFile } from "./load-env.mjs";
import { PrismaClient } from "@prisma/client";

loadEnvFile();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = join(ROOT, "public", "ads", "samples");
const BASE = "https://www.xndzor.com";
const FORCE = process.argv.includes("--force");

/** @typedef {{ section: string, model: string, idHint?: string, titleStartsWith: string, field: 'imageUrls'|'photoUrls', files: string[], skipReason?: string }} Target */

/** @type {Target[]} */
const TARGETS = [
  {
    section: "supply",
    model: "supply",
    idHint: "cmtvb0px20001vbzw30ufc2q5",
    titleStartsWith: "Բերք վաճառքի",
    field: "imageUrls",
    files: ["sample-supply-tomato-01.jpg"],
  },
  {
    section: "demand",
    model: "demand",
    idHint: "cmtvb0qi80003vbzwg0isufyq",
    titleStartsWith: "Գնորդի պահանջարկի",
    field: "imageUrls",
    files: ["sample-demand-potato-01.jpg"],
  },
  {
    section: "forward",
    model: "futureHarvest",
    idHint: "cmtvb0r2w0005vbzw9fnzc330",
    titleStartsWith: "Ապագա բերքի",
    field: "imageUrls",
    files: ["sample-forward-apple-01.jpg"],
  },
  {
    section: "animals",
    model: "animalListing",
    idHint: "cmtvb0rn80007vbzwznt8u7jo",
    titleStartsWith: "Կենդանիների վաճառքի",
    field: "imageUrls",
    files: ["sample-animals-sheep-01.jpg"],
  },
  {
    section: "machinery",
    model: "machineryListing",
    idHint: "cmtvb0s7r0009vbzw8nb37yef",
    titleStartsWith: "Տեխնիկայի վաճառքի",
    field: "imageUrls",
    files: ["sample-machinery-tractor-01.jpg"],
  },
  {
    section: "plots",
    model: "plot",
    idHint: "cmtvb0tcc000dvbzwc4nf7946",
    titleStartsWith: "Հողամասի",
    field: "photoUrls",
    files: ["sample-plots-wheat-01.jpg"],
  },
  {
    section: "shop/natural-products",
    model: "catalogListing",
    idHint: "cmtvb0tzp000fvbzwiscdcfkw",
    titleStartsWith: "Բնական արտադրանքի",
    field: "imageUrls",
    files: ["sample-shop-honey-01.jpg"],
  },
  {
    section: "jobs",
    model: "jobRequest",
    idHint: "cmtvb0ss2000bvbzw46t2mhuw",
    titleStartsWith: "Աշխատանքի պատվերի",
    field: "imageUrls",
    files: ["sample-jobs-harvest-01.jpg"],
  },
  {
    section: "group-buy",
    model: "groupBuyCampaign",
    idHint: "cmtvb0v4j000jvbzwdn0mu8l3",
    titleStartsWith: "Խմբային գնման",
    field: "imageUrls",
    files: ["sample-group-buy-apples-01.jpg"],
  },
  {
    section: "providers",
    model: "serviceProvider",
    idHint: "cmtvb0uk1000hvbzwl4t53agh",
    titleStartsWith: "Ծառայության",
    field: "imageUrls",
    files: ["sample-providers-service-01.jpg"],
  },
  {
    section: "spaces",
    model: "spaceListing",
    idHint: "cmtvb0von000lvbzw9vbrlywn",
    titleStartsWith: "Պահեստի տարածքի",
    field: "imageUrls",
    files: ["sample-spaces-warehouse-01.jpg"],
  },
];

function hostKind(url) {
  if (url.includes("neon.tech")) return "neon";
  if (url.startsWith("file:")) return "sqlite";
  if (/localhost|127\.0\.0\.1/.test(url)) return "local";
  return "other";
}

function parseUrls(raw) {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((u) => typeof u === "string" && u.trim()) : [];
  } catch {
    return [];
  }
}

function hasRemoteImages(urls) {
  return urls.some((u) => /^https?:\/\//i.test(u));
}

const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers || {}), cookie: cookieHeader() },
  });
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  for (const c of setCookies) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  const single = res.headers.get("set-cookie");
  if (setCookies.length === 0 && single) {
    const [pair] = single.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return res;
}

async function ensureAdminSession() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD missing in .env");
  }
  console.log(`Signing in as admin (email length=${email.length})`);

  const csrfRes = await req("/api/auth/csrf");
  if (!csrfRes.ok) throw new Error(`CSRF failed: ${csrfRes.status}`);
  const { csrfToken } = await csrfRes.json();

  const login = await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/hy`,
      json: "true",
    }).toString(),
  });
  console.log(`Login HTTP ${login.status}`);

  const session = await (await req("/api/auth/session")).json();
  if (!session?.user?.email) {
    throw new Error("Session empty after login — cannot upload via /api/upload");
  }
  console.log(`Session ok: role=${session.user.role || "?"}`);
}

/** @type {boolean} */
let sessionReady = false;

/**
 * @param {string[]} absolutePaths
 * @returns {Promise<string[]>}
 */
async function uploadFiles(absolutePaths) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    console.log("Uploading via local BLOB_READ_WRITE_TOKEN");
    const { put } = await import("@vercel/blob");
    const urls = [];
    for (const p of absolutePaths) {
      const buffer = readFileSync(p);
      const filename = `${randomBytes(16).toString("hex")}.jpg`;
      const blob = await put(`uploads/listings/${filename}`, buffer, {
        access: "public",
        contentType: "image/jpeg",
        token: blobToken,
        addRandomSuffix: false,
      });
      urls.push(blob.url);
    }
    return urls;
  }

  if (!sessionReady) {
    console.log("No local Blob token — uploading via production /api/upload");
    await ensureAdminSession();
    sessionReady = true;
  }
  const form = new FormData();
  for (let i = 0; i < absolutePaths.length; i++) {
    const buffer = readFileSync(absolutePaths[i]);
    form.append(
      "files",
      new Blob([buffer], { type: "image/jpeg" }),
      `sample-${i + 1}.jpg`,
    );
  }
  const uploadRes = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { cookie: cookieHeader() },
    body: form,
  });
  const uploadBody = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(
      `Upload failed HTTP ${uploadRes.status}: ${uploadBody.error || JSON.stringify(uploadBody)}`,
    );
  }
  const urls = uploadBody.urls;
  if (!Array.isArray(urls) || urls.length !== absolutePaths.length) {
    throw new Error(
      `Expected ${absolutePaths.length} URLs, got: ${JSON.stringify(uploadBody)}`,
    );
  }
  return urls;
}

/**
 * @param {PrismaClient} prisma
 * @param {Target} target
 */
async function findListing(prisma, target) {
  const select =
    target.field === "photoUrls"
      ? { id: true, name: true, photoUrls: true, status: true }
      : { id: true, title: true, imageUrls: true, status: true };

  const delegate = prisma[target.model];
  if (!delegate) throw new Error(`Unknown prisma model: ${target.model}`);

  if (target.idHint) {
    const byId = await delegate.findUnique({ where: { id: target.idHint }, select });
    if (byId) return byId;
  }

  const prefixes = [
    target.titleStartsWith,
    `[Օրինակ] ${target.titleStartsWith}`,
  ];

  if (target.field === "photoUrls") {
    for (const prefix of prefixes) {
      const row = await delegate.findFirst({
        where: { name: { startsWith: prefix } },
        select,
      });
      if (row) return row;
    }
    return null;
  }
  for (const prefix of prefixes) {
    const row = await delegate.findFirst({
      where: { title: { startsWith: prefix } },
      select,
    });
    if (row) return row;
  }
  return null;
}

/**
 * @param {PrismaClient} prisma
 * @param {Target} target
 * @param {string} id
 * @param {string[]} urls
 */
async function updateListing(prisma, target, id, urls) {
  const data = { [target.field]: JSON.stringify(urls) };
  return prisma[target.model].update({
    where: { id },
    data,
    select:
      target.field === "photoUrls"
        ? { id: true, name: true, photoUrls: true, status: true }
        : { id: true, title: true, imageUrls: true, status: true },
  });
}

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL missing in .env");
    process.exit(1);
  }
  console.log(`DB host kind: ${hostKind(url)}`);
  console.log(`Force: ${FORCE}`);
  console.log(`Samples dir: public/ads/samples`);

  for (const t of TARGETS) {
    for (const f of t.files) {
      const p = join(SAMPLES, f);
      if (!existsSync(p)) {
        console.error(`Missing sample file: ${f}`);
        process.exit(1);
      }
    }
  }

  /** @type {object[]} */
  const results = [];

  for (const target of TARGETS) {
    const row = await findListing(prisma, target);
    if (!row) {
      results.push({
        section: target.section,
        action: "missing",
        error: "listing not found",
      });
      continue;
    }

    const title = "title" in row ? row.title : row.name;
    const existing = parseUrls(row[target.field]);
    if (!FORCE && hasRemoteImages(existing)) {
      results.push({
        section: target.section,
        action: "skipped",
        id: row.id,
        title,
        status: row.status,
        field: target.field,
        imageCount: existing.length,
        imageUrls: existing,
        note: "already has remote images (use --force to replace)",
      });
      continue;
    }

    const abs = target.files.map((f) => join(SAMPLES, f));
    console.log(`\nUploading ${target.section} (${target.files.length} file(s))…`);
    const uploaded = await uploadFiles(abs);
    const updated = await updateListing(prisma, target, row.id, uploaded);
    const urls = parseUrls(updated[target.field]);

    for (const u of urls) {
      const head = await fetch(u, { method: "HEAD" });
      console.log(
        `  HEAD ${head.status} ${head.headers.get("content-type") || "?"} ${u.slice(0, 60)}…`,
      );
    }

    results.push({
      section: target.section,
      action: "updated",
      id: updated.id,
      title: "title" in updated ? updated.title : updated.name,
      status: updated.status,
      field: target.field,
      imageCount: urls.length,
      imageUrls: urls,
    });
  }

  console.log("\n=== Results ===");
  console.log(JSON.stringify(results, null, 2));
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
