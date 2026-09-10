/**
 * Idempotent: ~20 ACTIVE admin Supply (վաճառք) listings with matching Blob photos.
 *
 * Marker: titles start with [Օրինակ] and include batch tag [batch-supply-v1]
 * so re-runs upsert by exact title (no endless duplicates).
 * Does NOT touch Vazgen flax-oil (or any non-matching titles).
 *
 * Sources: public/ads/samples/batch-supply-*.png
 * Upload: BLOB_READ_WRITE_TOKEN via @vercel/blob, else production /api/upload.
 * DB: DATABASE_URL (production Neon).
 *
 * Usage: node scripts/seed-admin-supply-batch.mjs
 *        node scripts/seed-admin-supply-batch.mjs --force-photos  # re-upload images
 * Does not print secrets.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { loadEnvFile } from "./load-env.mjs";
import { PrismaClient } from "@prisma/client";

loadEnvFile();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = join(ROOT, "public", "ads", "samples");
const MARKER = "[Օրինակ]";
const BATCH = "[batch-supply-v1]";
const BASE = "https://www.xndzor.com";
const FORCE_PHOTOS = process.argv.includes("--force-photos");

const prisma = new PrismaClient();

/**
 * @typedef {{
 *   key: string,
 *   titleHy: string,
 *   description: string,
 *   productId: string,
 *   qtyAvailable: number,
 *   unit: string,
 *   priceAmd: number,
 *   readyInDays: number,
 *   marzId: string,
 *   villageNameEn: string,
 *   imageFile: string,
 * }} SupplySpec
 */

/** @type {SupplySpec[]} */
const SPECS = [
  {
    key: "cucumber",
    titleHy: "Թարմ վարունգ — ջերմոցային",
    description:
      "Օրինակ վաճառք։ Թարմ ջերմոցային վարունգ Արարատից։ Ցուցադրական հայտարարություն է, ոչ իրական վաճառք։",
    productId: "cucumber",
    qtyAvailable: 800,
    unit: "kg",
    priceAmd: 350,
    readyInDays: 0,
    marzId: "Ararat",
    villageNameEn: "Masis",
    imageFile: "batch-supply-cucumber-01.png",
  },
  {
    key: "onion",
    titleHy: "Սոխ մեծածախ — աշնանային բերք",
    description:
      "Օրինակ վաճառք։ Չոր սոխ՝ պահեստային որակ, Արմավիր։ Ցուցադրական է։",
    productId: "onion",
    qtyAvailable: 2500,
    unit: "kg",
    priceAmd: 180,
    readyInDays: 0,
    marzId: "Armavir",
    villageNameEn: "Armavir",
    imageFile: "batch-supply-onion-01.png",
  },
  {
    key: "carrot",
    titleHy: "Գազար — թարմ բերքահավաք",
    description:
      "Օրինակ վաճառք։ Թարմ գազար Կոտայքից։ Ցուցադրական հայտարարություն է։",
    productId: "carrot",
    qtyAvailable: 1200,
    unit: "kg",
    priceAmd: 220,
    readyInDays: 1,
    marzId: "Kotayk",
    villageNameEn: "Abovyan",
    imageFile: "batch-supply-carrot-01.png",
  },
  {
    key: "cabbage",
    titleHy: "Կաղամբ — սպիտակ գլխիկներ",
    description:
      "Օրինակ վաճառք։ Սպիտակ կաղամբ Լոռուց։ Ցուցադրական է, ոչ իրական վաճառք։",
    productId: "cabbage",
    qtyAvailable: 1500,
    unit: "kg",
    priceAmd: 150,
    readyInDays: 0,
    marzId: "Lori",
    villageNameEn: "Vanadzor",
    imageFile: "batch-supply-cabbage-01.png",
  },
  {
    key: "eggplant",
    titleHy: "Սմբուկ — սեզոնային",
    description:
      "Օրինակ վաճառք։ Թարմ սմբուկ Արարատի դաշտից։ Ցուցադրական հայտարարություն է։",
    productId: "eggplant",
    qtyAvailable: 600,
    unit: "kg",
    priceAmd: 280,
    readyInDays: 0,
    marzId: "Ararat",
    villageNameEn: "Artashat",
    imageFile: "batch-supply-eggplant-01.png",
  },
  {
    key: "apple",
    titleHy: "Խնձոր — աշնանային սորտեր",
    description:
      "Օրինակ վաճառք։ Խնձոր Վայոց ձորից՝ պահեստային սորտեր։ Ցուցադրական է։",
    productId: "apple",
    qtyAvailable: 4,
    unit: "ton",
    priceAmd: 280000,
    readyInDays: 0,
    marzId: "VayotsDzor",
    villageNameEn: "Yeghegnadzor",
    imageFile: "batch-supply-apple-01.png",
  },
  {
    key: "apricot",
    titleHy: "Ծիրան — թարմ բերք",
    description:
      "Օրինակ վաճառք։ Թարմ ծիրան Արագածոտնից։ Ցուցադրական հայտարարություն է։",
    productId: "apricot",
    qtyAvailable: 900,
    unit: "kg",
    priceAmd: 450,
    readyInDays: 0,
    marzId: "Aragatsotn",
    villageNameEn: "Ashtarak",
    imageFile: "batch-supply-apricot-01.png",
  },
  {
    key: "peach",
    titleHy: "Դեղձ — հյութալի սորտեր",
    description:
      "Օրինակ վաճառք։ Դեղձ Արարատից։ Ցուցադրական է, ոչ իրական վաճառք։",
    productId: "peach",
    qtyAvailable: 700,
    unit: "kg",
    priceAmd: 500,
    readyInDays: 1,
    marzId: "Ararat",
    villageNameEn: "Masis",
    imageFile: "batch-supply-peach-01.png",
  },
  {
    key: "grape",
    titleHy: "Խաղող գինու համար — Արենի",
    description:
      "Օրինակ վաճառք։ Գինու խաղող Վայոց ձորից։ Ցուցադրական հայտարարություն է։",
    productId: "grape",
    qtyAvailable: 3,
    unit: "ton",
    priceAmd: 320000,
    readyInDays: 2,
    marzId: "VayotsDzor",
    villageNameEn: "Areni",
    imageFile: "batch-supply-grape-01.png",
  },
  {
    key: "strawberry",
    titleHy: "Ելակ — թարմ հատապտուղ",
    description:
      "Օրինակ վաճառք։ Թարմ ելակ Կոտայքից։ Ցուցադրական է։",
    productId: "strawberry",
    qtyAvailable: 250,
    unit: "kg",
    priceAmd: 1800,
    readyInDays: 0,
    marzId: "Kotayk",
    villageNameEn: "Abovyan",
    imageFile: "batch-supply-strawberry-01.png",
  },
  {
    key: "walnut",
    titleHy: "Ընկույզ — կեղևով",
    description:
      "Օրինակ վաճառք։ Կեղևով ընկույզ Տավուշից։ Ցուցադրական հայտարարություն է։",
    productId: "walnut",
    qtyAvailable: 400,
    unit: "kg",
    priceAmd: 2200,
    readyInDays: 0,
    marzId: "Tavush",
    villageNameEn: "Ijevan",
    imageFile: "batch-supply-walnut-01.png",
  },
  {
    key: "wheat",
    titleHy: "Ցորեն — սննդային",
    description:
      "Օրինակ վաճառք։ Սննդային ցորեն Շիրակից։ Ցուցադրական է, ոչ իրական վաճառք։",
    productId: "wheat",
    qtyAvailable: 12,
    unit: "ton",
    priceAmd: 180000,
    readyInDays: 0,
    marzId: "Shirak",
    villageNameEn: "Gyumri",
    imageFile: "batch-supply-wheat-01.png",
  },
  {
    key: "barley",
    titleHy: "Գարի — անասնակեր / սննդային",
    description:
      "Օրինակ վաճառք։ Գարի Շիրակից։ Ցուցադրական հայտարարություն է։",
    productId: "barley",
    qtyAvailable: 8,
    unit: "ton",
    priceAmd: 140000,
    readyInDays: 0,
    marzId: "Shirak",
    villageNameEn: "Gyumri",
    imageFile: "batch-supply-barley-01.png",
  },
  {
    key: "honey",
    titleHy: "Լեռնային մեղր — բնական",
    description:
      "Օրինակ վաճառք։ Լեռնային մեղր Լոռուց։ Ցուցադրական է։",
    productId: "mountain-honey",
    qtyAvailable: 80,
    unit: "kg",
    priceAmd: 5500,
    readyInDays: 0,
    marzId: "Lori",
    villageNameEn: "Vanadzor",
    imageFile: "batch-supply-honey-01.png",
  },
  {
    key: "cheese",
    titleHy: "Լոռի պանիր — տնական",
    description:
      "Օրինակ վաճառք։ Տնական լոռի պանիր։ Ցուցադրական հայտարարություն է։",
    productId: "lori-cheese",
    qtyAvailable: 120,
    unit: "kg",
    priceAmd: 3200,
    readyInDays: 0,
    marzId: "Lori",
    villageNameEn: "Vanadzor",
    imageFile: "batch-supply-cheese-01.png",
  },
  {
    key: "milk",
    titleHy: "Թարմ կովի կաթ",
    description:
      "Օրինակ վաճառք։ Թարմ կովի կաթ Գեղարքունիքից։ Ցուցադրական է, ոչ իրական վաճառք։",
    productId: "milk",
    qtyAvailable: 200,
    unit: "liter",
    priceAmd: 400,
    readyInDays: 0,
    marzId: "Gegharkunik",
    villageNameEn: "Gavar",
    imageFile: "batch-supply-milk-01.png",
  },
  {
    key: "dried-apricot",
    titleHy: "Ծիրանի չիր — արևով չորացրած",
    description:
      "Օրինակ վաճառք։ Արևով չորացրած ծիրանի չիր Արարատից։ Ցուցադրական է։",
    productId: "dried-apricot",
    qtyAvailable: 150,
    unit: "kg",
    priceAmd: 2800,
    readyInDays: 0,
    marzId: "Ararat",
    villageNameEn: "Artashat",
    imageFile: "batch-supply-dried-apricot-01.png",
  },
  {
    key: "greens",
    titleHy: "Թարմ կանաչի խառնուրդ",
    description:
      "Օրինակ վաճառք։ Թարմ կանաչի Կոտայքից։ Ցուցադրական հայտարարություն է։",
    productId: "greens",
    qtyAvailable: 100,
    unit: "kg",
    priceAmd: 900,
    readyInDays: 0,
    marzId: "Kotayk",
    villageNameEn: "Abovyan",
    imageFile: "batch-supply-greens-01.png",
  },
  {
    key: "herbs",
    titleHy: "Ռեհան և խոտաբույսեր",
    description:
      "Օրինակ վաճառք։ Թարմ ռեհան և խոտաբույսեր Սյունիքից։ Ցուցադրական է։",
    productId: "basil",
    qtyAvailable: 60,
    unit: "kg",
    priceAmd: 1200,
    readyInDays: 0,
    marzId: "Syunik",
    villageNameEn: "Kapan",
    imageFile: "batch-supply-herbs-01.png",
  },
  {
    key: "eggs",
    titleHy: "Հավի ձու — ֆերմային",
    description:
      "Օրինակ վաճառք։ Ֆերմային հավի ձու Արմավիրից։ Ցուցադրական հայտարարություն է, ոչ իրական վաճառք։",
    productId: "chicken-eggs",
    qtyAvailable: 500,
    unit: "piece",
    priceAmd: 60,
    readyInDays: 0,
    marzId: "Armavir",
    villageNameEn: "Armavir",
    imageFile: "batch-supply-eggs-01.png",
  },
];

function hostKind(url) {
  if (url.includes("neon.tech")) return "neon";
  if (url.startsWith("file:")) return "sqlite";
  if (/localhost|127\.0\.0\.1/.test(url)) return "local";
  return "other";
}

function titleFor(spec) {
  return `${MARKER} ${spec.titleHy} ${BATCH}`;
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

function contentTypeFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function resolveAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const fallbackEmail = "albertakimyan1@gmail.com";

  let user =
    (await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true },
      orderBy: { createdAt: "asc" },
    })) || null;

  if (!user && adminEmail) {
    user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, name: true, role: true },
    });
  }
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: fallbackEmail },
      select: { id: true, email: true, name: true, role: true },
    });
  }
  if (!user) {
    throw new Error(
      "No ADMIN user found (role ADMIN / ADMIN_EMAIL / albertakimyan1@gmail.com)",
    );
  }

  const nextName = user.name?.trim() === "Xndzor Admin" ? user.name : "Xndzor Admin";
  const needsRole = user.role !== "ADMIN";
  const needsName = user.name !== nextName;
  if (needsRole || needsName) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(needsRole ? { role: "ADMIN" } : {}),
        ...(needsName ? { name: nextName } : {}),
      },
      select: { id: true, email: true, name: true, role: true },
    });
  }
  return user;
}

async function resolveVillage(marzId, nameEnContains) {
  const v = await prisma.village.findFirst({
    where: {
      marzId,
      nameEn: { contains: nameEnContains, mode: "insensitive" },
    },
    select: { id: true, nameHy: true, marzId: true },
  });
  if (!v) throw new Error(`Village not found: ${nameEnContains} in ${marzId}`);
  return v;
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

/** @type {boolean} */
let sessionReady = false;

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

  await req("/api/auth/callback/credentials", {
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

  const session = await (await req("/api/auth/session")).json();
  if (!session?.user?.email) {
    throw new Error("Session empty after login — cannot upload via /api/upload");
  }
  console.log(`Session ok: role=${session.user.role || "?"}`);
}

/**
 * @param {string} absolutePath
 * @returns {Promise<string>}
 */
async function uploadOne(absolutePath) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const ctype = contentTypeFor(absolutePath);
  const ext = extname(absolutePath).toLowerCase() || ".jpg";

  if (blobToken) {
    const { put } = await import("@vercel/blob");
    const buffer = readFileSync(absolutePath);
    const filename = `${randomBytes(16).toString("hex")}${ext}`;
    const blob = await put(`uploads/listings/${filename}`, buffer, {
      access: "public",
      contentType: ctype,
      token: blobToken,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (!sessionReady) {
    console.log("No local Blob token — uploading via production /api/upload");
    await ensureAdminSession();
    sessionReady = true;
  }
  const buffer = readFileSync(absolutePath);
  const form = new FormData();
  form.append(
    "files",
    new Blob([buffer], { type: ctype }),
    `sample${ext}`,
  );
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
  if (!Array.isArray(urls) || urls.length < 1) {
    throw new Error(`Expected URLs, got: ${JSON.stringify(uploadBody)}`);
  }
  return urls[0];
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL missing in .env");
    process.exit(1);
  }
  console.log(`DB host kind: ${hostKind(url)}`);
  console.log(`Force photos: ${FORCE_PHOTOS}`);
  console.log(`Specs: ${SPECS.length}`);

  for (const spec of SPECS) {
    const p = join(SAMPLES, spec.imageFile);
    if (!existsSync(p)) {
      console.error(`Missing sample file: ${spec.imageFile}`);
      process.exit(1);
    }
  }

  const admin = await resolveAdmin();
  console.log(
    `Admin: ${admin.name} role=${admin.role} id=${admin.id} domain=${admin.email.split("@")[1]}`,
  );

  const productIds = [...new Set(SPECS.map((s) => s.productId))];
  for (const id of productIds) {
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) throw new Error(`Product missing: ${id} — run db:sync-reference first`);
  }

  /** @type {Map<string, {id:string,nameHy:string,marzId:string}>} */
  const villageCache = new Map();
  for (const spec of SPECS) {
    const cacheKey = `${spec.marzId}:${spec.villageNameEn}`;
    if (!villageCache.has(cacheKey)) {
      villageCache.set(
        cacheKey,
        await resolveVillage(spec.marzId, spec.villageNameEn),
      );
    }
  }

  const phone = "";
  /** @type {object[]} */
  const results = [];
  let created = 0;
  let updated = 0;
  let photosUploaded = 0;
  let photosSkipped = 0;

  for (const spec of SPECS) {
    const title = titleFor(spec);
    const village = villageCache.get(`${spec.marzId}:${spec.villageNameEn}`);
    if (!village) throw new Error(`Village cache miss for ${spec.key}`);

    const existing = await prisma.supply.findFirst({
      where: { title, userId: admin.id },
      select: { id: true, title: true, imageUrls: true, status: true },
    });

    let imageUrls = parseUrls(existing?.imageUrls);
    if (FORCE_PHOTOS || !hasRemoteImages(imageUrls)) {
      const abs = join(SAMPLES, spec.imageFile);
      console.log(`Uploading photo for ${spec.key}…`);
      const uploadedUrl = await uploadOne(abs);
      imageUrls = [uploadedUrl];
      photosUploaded += 1;
    } else {
      photosSkipped += 1;
    }

    const data = {
      title,
      description: spec.description,
      productId: spec.productId,
      qtyAvailable: spec.qtyAvailable,
      unit: spec.unit,
      priceAmd: spec.priceAmd,
      readyInDays: spec.readyInDays,
      status: "ACTIVE",
      marzId: village.marzId,
      villageId: village.id,
      phone,
      whatsapp: null,
      imageUrls: JSON.stringify(imageUrls),
      userId: admin.id,
    };

    const row = existing
      ? await prisma.supply.update({
          where: { id: existing.id },
          data,
          select: {
            id: true,
            title: true,
            status: true,
            productId: true,
            imageUrls: true,
            priceAmd: true,
            qtyAvailable: true,
            unit: true,
            marzId: true,
          },
        })
      : await prisma.supply.create({
          data,
          select: {
            id: true,
            title: true,
            status: true,
            productId: true,
            imageUrls: true,
            priceAmd: true,
            qtyAvailable: true,
            unit: true,
            marzId: true,
          },
        });

    if (existing) updated += 1;
    else created += 1;

    const urls = parseUrls(row.imageUrls);
    results.push({
      action: existing ? "updated" : "created",
      id: row.id,
      title: row.title,
      productId: row.productId,
      marzId: row.marzId,
      qty: `${row.qtyAvailable} ${row.unit}`,
      priceAmd: row.priceAmd,
      status: row.status,
      imageUrl: urls[0] || null,
      path: `/hy/supply/${row.id}`,
    });
  }

  // Safety: never modify Vazgen flax listing
  const vazgenTouched = await prisma.supply.findFirst({
    where: {
      title: { contains: "Կտավատի" },
      user: { email: "vazgenasatryan00@mail.ru" },
    },
    select: { id: true, title: true, updatedAt: true },
  });

  console.log("\n=== Batch supply results ===");
  for (const r of results) {
    console.log(
      `${r.action.padEnd(8)} ${r.id}  ${r.title}`,
    );
    console.log(
      `         ${r.productId} | ${r.marzId} | ${r.qty} | ${r.priceAmd} AMD | ${r.path}`,
    );
    console.log(`         image: ${r.imageUrl || "(none)"}`);
  }

  console.log("\n=== Summary ===");
  console.log(
    JSON.stringify(
      {
        total: results.length,
        created,
        updated,
        photosUploaded,
        photosSkipped,
        vazgenFlaxUntouched: Boolean(vazgenTouched),
        vazgenId: vazgenTouched?.id ?? null,
      },
      null,
      2,
    ),
  );

  const missingImg = results.filter((r) => !r.imageUrl);
  if (missingImg.length) {
    console.error("Some listings missing image URLs:", missingImg.map((r) => r.id));
    process.exit(1);
  }

  console.log("\nDone. Live base: https://www.xndzor.com/hy/supply");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
