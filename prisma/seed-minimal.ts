/**
 * Minimal seed — reference data + admin user, no demo listings.
 * Safe to run on production DB without wiping existing users.
 *
 * Usage: npm run db:seed:minimal
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import locations from "../data/armenia-locations.json";
import productsData from "../data/products.json";

const prisma = new PrismaClient();

const products = productsData.products.map((p) => ({
  id: p.id,
  slug: p.slug,
  nameKey: p.nameKey,
  sortOrder: p.sortOrder,
}));

const plans = [
  { code: "FARM_PRO_MONTHLY", kind: "FARM_PRO", nameKey: "pricing.farmPro.name", amountAmd: 4900, interval: "MONTHLY", sortOrder: 1 },
  { code: "FARM_PRO_YEARLY", kind: "FARM_PRO", nameKey: "pricing.farmPro.name", amountAmd: 49000, interval: "YEARLY", sortOrder: 2 },
  { code: "BUYER_PRO_MONTHLY", kind: "BUYER_PRO", nameKey: "pricing.buyerPro.name", amountAmd: 9900, interval: "MONTHLY", sortOrder: 3 },
  { code: "VERIFIED_FARM_YEARLY", kind: "VERIFIED_FARM", nameKey: "pricing.verifiedFarm.name", amountAmd: 9900, interval: "YEARLY", sortOrder: 4 },
  { code: "BOOST_7", kind: "BOOST", nameKey: "pricing.boost.name7", amountAmd: 1500, interval: "DAYS_7", sortOrder: 5 },
  { code: "BOOST_30", kind: "BOOST", nameKey: "pricing.boost.name30", amountAmd: 3900, interval: "DAYS_30", sortOrder: 6 },
];

async function upsertReferenceData() {
  for (const m of locations.marzes) {
    await prisma.marz.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        slug: m.slug,
        nameHy: m.nameHy,
        nameEn: m.nameEn,
        nameRu: m.nameRu,
        sortOrder: m.sortOrder,
      },
      update: {
        slug: m.slug,
        nameHy: m.nameHy,
        nameEn: m.nameEn,
        nameRu: m.nameRu,
        sortOrder: m.sortOrder,
      },
    });
  }

  for (let i = 0; i < locations.villages.length; i += 100) {
    const chunk = locations.villages.slice(i, i + 100);
    for (const v of chunk) {
      await prisma.village.upsert({
        where: { id: v.id },
        create: {
          id: v.id,
          slug: v.slug,
          marzId: v.marzId,
          nameHy: v.nameHy,
          nameEn: v.nameEn,
          nameRu: v.nameRu,
          kind: v.kind,
          lat: v.lat,
          lng: v.lng,
        },
        update: {
          slug: v.slug,
          marzId: v.marzId,
          nameHy: v.nameHy,
          nameEn: v.nameEn,
          nameRu: v.nameRu,
          kind: v.kind,
          lat: v.lat,
          lng: v.lng,
        },
      });
    }
  }

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        id: p.id,
        slug: p.slug,
        nameKey: p.nameKey,
        sortOrder: p.sortOrder,
      },
      update: { nameKey: p.nameKey, sortOrder: p.sortOrder },
    });
  }

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        kind: plan.kind,
        nameKey: plan.nameKey,
        amountAmd: plan.amountAmd,
        interval: plan.interval,
        sortOrder: plan.sortOrder,
      },
    });
  }
}

async function ensureAdminUser() {
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@farmos.am";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", suspended: false },
    });
    console.log("Admin promoted:", email);
    return;
  }

  const password = process.env.ADMIN_PASSWORD?.trim() || "Akim1234";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Xndzor Admin",
      role: "ADMIN",
      marzId: "Yerevan",
    },
  });
  console.log("Admin created:", email);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("Default ADMIN_PASSWORD used: Akim1234 (override via ADMIN_PASSWORD in .env).");
  }
}

async function main() {
  await upsertReferenceData();
  await ensureAdminUser();
  console.log("Minimal seed complete (reference data + admin, no demo listings).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
