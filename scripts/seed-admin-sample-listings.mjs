/**
 * Idempotent: one ACTIVE sample listing per major public marketplace board,
 * owned by site ADMIN so Call/WhatsApp stay hidden (OwnerContactActions + userIsAdmin).
 *
 * Marker title prefix: [Օրինակ] — re-run skips/updates existing rows with the same title.
 *
 * Usage: node scripts/seed-admin-sample-listings.mjs
 * Does not print DATABASE_URL or other secrets.
 */
import { loadEnvFile } from "./load-env.mjs";
import { PrismaClient } from "@prisma/client";

loadEnvFile();

const MARKER = "[Օրինակ]";
const prisma = new PrismaClient();

/** @param {string} url */
function hostKind(url) {
  if (url.includes("neon.tech")) return "neon";
  if (url.startsWith("file:")) return "sqlite";
  if (/localhost|127\.0\.0\.1/.test(url)) return "local";
  return "other";
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

async function requireProduct(id) {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) throw new Error(`Product missing: ${id} — run db:sync-reference first`);
  return p;
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

/**
 * Upsert by exact title on a model that has title + userId + status.
 * @template T
 * @param {object} opts
 * @param {string} opts.section
 * @param {string} opts.pathPrefix
 * @param {() => Promise<T | null>} opts.find
 * @param {(existing: T) => Promise<T>} opts.update
 * @param {() => Promise<T>} opts.create
 * @param {(row: T) => string} opts.idOf
 * @param {(row: T) => string} opts.titleOf
 */
async function upsertListing({
  section,
  pathPrefix,
  find,
  update,
  create,
  idOf,
  titleOf,
}) {
  const existing = await find();
  if (existing) {
    const row = await update(existing);
    return {
      section,
      action: "updated",
      id: idOf(row),
      title: titleOf(row),
      path: `${pathPrefix}/${idOf(row)}`,
    };
  }
  const row = await create();
  return {
    section,
    action: "created",
    id: idOf(row),
    title: titleOf(row),
    path: `${pathPrefix}/${idOf(row)}`,
  };
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL missing in .env");
    process.exit(1);
  }
  console.log(`DB host kind: ${hostKind(url)}`);

  const admin = await resolveAdmin();
  console.log(
    `Admin: ${admin.name} role=${admin.role} id=${admin.id} domain=${admin.email.split("@")[1]}`,
  );

  await requireProduct("tomato");
  await requireProduct("potato");
  await requireProduct("apple");
  await requireProduct("wheat");
  await requireProduct("other");

  const gyumri = await resolveVillage("Shirak", "Gyumri");
  const masis = await resolveVillage("Ararat", "Masis");
  const kentron = await resolveVillage("Yerevan", "Kentron");
  const abovyan = await resolveVillage("Kotayk", "Abovyan");
  const vanadzor = await resolveVillage("Lori", "Vanadzor");

  const phone = ""; // contact UI hidden for admin owners anyway
  const results = [];

  // 1) Supply
  {
    const title = `${MARKER} Բերք վաճառքի օրինակ — ինչպես է աշխատում «Վաճառել» բաժինը`;
    results.push(
      await upsertListing({
        section: "supply",
        pathPrefix: "/hy/supply",
        find: () =>
          prisma.supply.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.supply.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ հայտարարություն։ Այստեղ ֆերմերները տեղադրում են վաճառքի բերք՝ քանակ, գին և մարզ։ Սա ցուցադրական է, ոչ իրական վաճառք։",
              productId: "tomato",
              qtyAvailable: 500,
              unit: "kg",
              priceAmd: 200,
              readyInDays: 0,
              status: "ACTIVE",
              marzId: masis.marzId,
              villageId: masis.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.supply.create({
            data: {
              title,
              description:
                "Օրինակ հայտարարություն։ Այստեղ ֆերմերները տեղադրում են վաճառքի բերք՝ քանակ, գին և մարզ։ Սա ցուցադրական է, ոչ իրական վաճառք։",
              productId: "tomato",
              qtyAvailable: 500,
              unit: "kg",
              priceAmd: 200,
              readyInDays: 0,
              status: "ACTIVE",
              marzId: masis.marzId,
              villageId: masis.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 2) Demand
  {
    const title = `${MARKER} Գնորդի պահանջարկի օրինակ — ինչպես է աշխատում «Գնել» բաժինը`;
    results.push(
      await upsertListing({
        section: "demand",
        pathPrefix: "/hy/demand",
        find: () =>
          prisma.demand.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.demand.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ պահանջարկ։ Գնորդները այստեղ նշում են՝ ինչ բերք են փնտրում, քանակ և ժամկետ։ Ցուցադրական է։",
              productId: "potato",
              qtyMin: 1000,
              qtyMax: 3000,
              unit: "kg",
              priceMinAmd: 180,
              priceMaxAmd: 220,
              buyerKind: "WHOLESALE",
              timingNote: "Հոկտեմբեր–նոյեմբեր",
              status: "ACTIVE",
              marzId: kentron.marzId,
              villageId: kentron.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.demand.create({
            data: {
              title,
              description:
                "Օրինակ պահանջարկ։ Գնորդները այստեղ նշում են՝ ինչ բերք են փնտրում, քանակ և ժամկետ։ Ցուցադրական է։",
              productId: "potato",
              qtyMin: 1000,
              qtyMax: 3000,
              unit: "kg",
              priceMinAmd: 180,
              priceMaxAmd: 220,
              buyerKind: "WHOLESALE",
              timingNote: "Հոկտեմբեր–նոյեմբեր",
              status: "ACTIVE",
              marzId: kentron.marzId,
              villageId: kentron.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 3) Forward (FutureHarvest)
  {
    const title = `${MARKER} Ապագա բերքի օրինակ — նախավաճառք մինչև հավաքը`;
    const harvestDate = new Date();
    harvestDate.setMonth(harvestDate.getMonth() + 3);
    results.push(
      await upsertListing({
        section: "forward",
        pathPrefix: "/hy/forward",
        find: () =>
          prisma.futureHarvest.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.futureHarvest.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ ապագա բերք։ Այստեղ ֆերմերները հայտարարում են սպասվող բերքը մինչև հավաքը՝ գնորդները կարող են հետաքրքրվել նախօրոք։ Ցուցադրական է։",
              productId: "apple",
              qtyExpected: 5,
              unit: "ton",
              harvestDate,
              priceAmd: 250000,
              status: "ACTIVE",
              marzId: "VayotsDzor",
              villageId: null,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
              plotId: null,
            },
          }),
        create: () =>
          prisma.futureHarvest.create({
            data: {
              title,
              description:
                "Օրինակ ապագա բերք։ Այստեղ ֆերմերները հայտարարում են սպասվող բերքը մինչև հավաքը՝ գնորդները կարող են հետաքրքրվել նախօրոք։ Ցուցադրական է։",
              productId: "apple",
              qtyExpected: 5,
              unit: "ton",
              harvestDate,
              priceAmd: 250000,
              status: "ACTIVE",
              marzId: "VayotsDzor",
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 4) Animals
  {
    const title = `${MARKER} Կենդանիների վաճառքի օրինակ — անասնաբուծության բաժին`;
    results.push(
      await upsertListing({
        section: "animals",
        pathPrefix: "/hy/animals",
        find: () =>
          prisma.animalListing.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.animalListing.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ հայտարարություն։ Այստեղ վաճառում են կով, ոչխար, այծ և այլ կենդանիներ՝ տարիք, նպատակ և գին։ Ցուցադրական է։",
              animalType: "SHEEP",
              breed: "Տեղական",
              sex: "MIXED",
              ageValue: 12,
              ageUnit: "MONTHS",
              quantity: 10,
              purpose: "MEAT",
              vaccinated: true,
              priceAmd: 1_200_000,
              priceNegotiable: true,
              priceMode: "LOT",
              status: "ACTIVE",
              marzId: gyumri.marzId,
              villageId: gyumri.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.animalListing.create({
            data: {
              title,
              description:
                "Օրինակ հայտարարություն։ Այստեղ վաճառում են կով, ոչխար, այծ և այլ կենդանիներ՝ տարիք, նպատակ և գին։ Ցուցադրական է։",
              animalType: "SHEEP",
              breed: "Տեղական",
              sex: "MIXED",
              ageValue: 12,
              ageUnit: "MONTHS",
              quantity: 10,
              purpose: "MEAT",
              vaccinated: true,
              priceAmd: 1_200_000,
              priceNegotiable: true,
              priceMode: "LOT",
              status: "ACTIVE",
              marzId: gyumri.marzId,
              villageId: gyumri.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 5) Machinery
  {
    const title = `${MARKER} Տեխնիկայի վաճառքի օրինակ — գյուղտեխնիկայի բաժին`;
    results.push(
      await upsertListing({
        section: "machinery",
        pathPrefix: "/hy/machinery",
        find: () =>
          prisma.machineryListing.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.machineryListing.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ հայտարարություն։ Այստեղ վաճառում են տրակտոր, կոմբայն և այլ գյուղտեխնիկա՝ տարի, մոտորաժամ և վիճակ։ Ցուցադրական է։",
              machineryType: "TRACTOR",
              make: "MTZ",
              model: "82.1",
              year: 2018,
              engineHours: 4500,
              condition: "USED",
              priceAmd: 8_500_000,
              priceNegotiable: true,
              powerHp: 82,
              fuel: "Դիզել",
              status: "ACTIVE",
              marzId: abovyan.marzId,
              villageId: abovyan.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.machineryListing.create({
            data: {
              title,
              description:
                "Օրինակ հայտարարություն։ Այստեղ վաճառում են տրակտոր, կոմբայն և այլ գյուղտեխնիկա՝ տարի, մոտորաժամ և վիճակ։ Ցուցադրական է։",
              machineryType: "TRACTOR",
              make: "MTZ",
              model: "82.1",
              year: 2018,
              engineHours: 4500,
              condition: "USED",
              priceAmd: 8_500_000,
              priceNegotiable: true,
              powerHp: 82,
              fuel: "Դիզել",
              status: "ACTIVE",
              marzId: abovyan.marzId,
              villageId: abovyan.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 6) Jobs
  {
    const title = `${MARKER} Աշխատանքի պատվերի օրինակ — ինչպես է աշխատում «Պատվիրել աշխատանք»`;
    results.push(
      await upsertListing({
        section: "jobs",
        pathPrefix: "/hy/jobs",
        find: () =>
          prisma.jobRequest.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.jobRequest.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ պատվեր։ Այստեղ ֆերմերները պատվիրում են հերկ, ցանք, բերքահավաք և այլ աշխատանքներ։ Ցուցադրական է։",
              jobType: "HARVEST",
              hectares: 5,
              areaNote: "Մոտ 5 հա այգի",
              budgetAmd: 350000,
              status: "ACTIVE",
              marzId: vanadzor.marzId,
              villageId: vanadzor.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.jobRequest.create({
            data: {
              title,
              description:
                "Օրինակ պատվեր։ Այստեղ ֆերմերները պատվիրում են հերկ, ցանք, բերքահավաք և այլ աշխատանքներ։ Ցուցադրական է։",
              jobType: "HARVEST",
              hectares: 5,
              areaNote: "Մոտ 5 հա այգի",
              budgetAmd: 350000,
              status: "ACTIVE",
              marzId: vanadzor.marzId,
              villageId: vanadzor.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 7) Plots (login-only FarmOS board — still seeded for admin demo)
  {
    const name = `${MARKER} Հողամասի օրինակ — FarmOS հողամասերի բաժին`;
    const plantDate = new Date();
    plantDate.setMonth(plantDate.getMonth() - 2);
    const existing = await prisma.plot.findFirst({
      where: { name, userId: admin.id },
    });
    const data = {
      name,
      hectares: 2.5,
      cropProductId: "wheat",
      plantDate,
      irrigationNotes: "Օրինակ հողամաս։ Այստեղ ֆերմերը գրանցում է իր դաշտերը և մշակույթները։ Ցուցադրական է։",
      status: "ACTIVE",
      marzId: gyumri.marzId,
      villageId: gyumri.id,
      photoUrls: "[]",
      userId: admin.id,
    };
    const row = existing
      ? await prisma.plot.update({ where: { id: existing.id }, data })
      : await prisma.plot.create({ data });
    results.push({
      section: "plots",
      action: existing ? "updated" : "created",
      id: row.id,
      title: row.name,
      path: `/hy/plots/${row.id}`,
      note: "login-required board",
    });
  }

  // 8) Shop — natural products catalog
  {
    const title = `${MARKER} Բնական արտադրանքի օրինակ — խանութի բաժին`;
    results.push(
      await upsertListing({
        section: "shop/natural-products",
        pathPrefix: "/hy/shop/natural-products",
        find: () =>
          prisma.catalogListing.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.catalogListing.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ ապրանք։ Այստեղ վաճառում են մեղր, ձեթ, կաթնամթերք և այլ գյուղական արտադրանք։ Ցուցադրական է։",
              category: "NATURAL_PRODUCT",
              subtype: "HONEY",
              brand: "Xndzor Sample",
              specsJson: JSON.stringify({ origin: "Lori", organic: true, homemade: true }),
              quantity: 20,
              unit: "kg",
              packageSize: "1 kg",
              priceAmd: 4500,
              priceNegotiable: true,
              priceUnit: "PER_KG",
              status: "ACTIVE",
              marzId: vanadzor.marzId,
              villageId: vanadzor.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.catalogListing.create({
            data: {
              title,
              description:
                "Օրինակ ապրանք։ Այստեղ վաճառում են մեղր, ձեթ, կաթնամթերք և այլ գյուղական արտադրանք։ Ցուցադրական է։",
              category: "NATURAL_PRODUCT",
              subtype: "HONEY",
              brand: "Xndzor Sample",
              specsJson: JSON.stringify({ origin: "Lori", organic: true, homemade: true }),
              quantity: 20,
              unit: "kg",
              packageSize: "1 kg",
              priceAmd: 4500,
              priceNegotiable: true,
              priceUnit: "PER_KG",
              status: "ACTIVE",
              marzId: vanadzor.marzId,
              villageId: vanadzor.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
    // Fix path for catalog detail: /shop/natural-products/[id]
    const last = results[results.length - 1];
    last.path = `/hy/shop/natural-products/${last.id}`;
  }

  // 9) Providers
  {
    const title = `${MARKER} Ծառայության օրինակ — ինչպես է աշխատում «Կատարել աշխատանք»`;
    results.push(
      await upsertListing({
        section: "providers",
        pathPrefix: "/hy/providers",
        find: () =>
          prisma.serviceProvider.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.serviceProvider.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ ծառայություն։ Այստեղ մասնագետները առաջարկում են հերկ, ցանք, բերքահավաք և այլ աշխատանքներ պատվերով։ Ցուցադրական է։",
              jobTypesJson: JSON.stringify(["PLOW", "SOW", "HARVEST"]),
              coverageNote: "Շիրակ և հարակից մարզեր",
              hectaresMax: 20,
              rateAmd: 45000,
              rateUnit: "ha",
              status: "ACTIVE",
              marzId: gyumri.marzId,
              villageId: gyumri.id,
              phone,
              whatsapp: null,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.serviceProvider.create({
            data: {
              title,
              description:
                "Օրինակ ծառայություն։ Այստեղ մասնագետները առաջարկում են հերկ, ցանք, բերքահավաք և այլ աշխատանքներ պատվերով։ Ցուցադրական է։",
              jobTypesJson: JSON.stringify(["PLOW", "SOW", "HARVEST"]),
              coverageNote: "Շիրակ և հարակից մարզեր",
              hectaresMax: 20,
              rateAmd: 45000,
              rateUnit: "ha",
              status: "ACTIVE",
              marzId: gyumri.marzId,
              villageId: gyumri.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
  }

  // 10) Group-buy
  {
    const title = `${MARKER} Խմբային գնման օրինակ — միասին ավելի էժան`;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 45);
    const existing = await prisma.groupBuyCampaign.findFirst({
      where: { title, organizerId: admin.id },
    });
    const data = {
      title,
      description:
        "Օրինակ խմբային գնում։ Գյուղացիները միավորվում են մեծածախ պատվերի համար՝ ավելի լավ գին ստանալու համար։ Ցուցադրական է։",
      productId: "other",
      targetQty: 5000,
      unit: "kg",
      pricePerUnitAmd: 300,
      deadline,
      status: "OPEN",
      supplierNote: "Օրինակ մատակարար — ցուցադրական",
      marzId: abovyan.marzId,
      imageUrls: "[]",
      organizerId: admin.id,
    };
    const row = existing
      ? await prisma.groupBuyCampaign.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.groupBuyCampaign.create({ data });
    results.push({
      section: "group-buy",
      action: existing ? "updated" : "created",
      id: row.id,
      title: row.title,
      path: `/hy/group-buy`,
      note: "campaign list page (no per-id public route required)",
    });
  }

  // 11) Spaces (public Farm OS board)
  {
    const title = `${MARKER} Պահեստի տարածքի օրինակ — դատարկ տարածքների բաժին`;
    results.push(
      await upsertListing({
        section: "spaces",
        pathPrefix: "/hy/spaces",
        find: () =>
          prisma.spaceListing.findFirst({
            where: { title, userId: admin.id },
          }),
        update: (row) =>
          prisma.spaceListing.update({
            where: { id: row.id },
            data: {
              description:
                "Օրինակ տարածք։ Այստեղ հայտարարում են դատարկ պահեստ, սառնարան, ջերմոց և այլ տարածքներ։ Ցուցադրական է։",
              spaceType: "WAREHOUSE",
              area: 200,
              areaUnit: "m2",
              capacityNote: "Մոտ 200 մ² չոր պահեստ",
              priceAmd: 80000,
              priceUnit: "PER_MONTH",
              status: "ACTIVE",
              marzId: kentron.marzId,
              villageId: kentron.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        create: () =>
          prisma.spaceListing.create({
            data: {
              title,
              description:
                "Օրինակ տարածք։ Այստեղ հայտարարում են դատարկ պահեստ, սառնարան, ջերմոց և այլ տարածքներ։ Ցուցադրական է։",
              spaceType: "WAREHOUSE",
              area: 200,
              areaUnit: "m2",
              capacityNote: "Մոտ 200 մ² չոր պահեստ",
              priceAmd: 80000,
              priceUnit: "PER_MONTH",
              status: "ACTIVE",
              marzId: kentron.marzId,
              villageId: kentron.id,
              phone,
              imageUrls: "[]",
              userId: admin.id,
            },
          }),
        idOf: (r) => r.id,
        titleOf: (r) => r.title,
      }),
    );
    // Spaces board has no detail route in UI — keep board path
    const last = results[results.length - 1];
    last.path = `/hy/spaces`;
    last.note = `listing id=${last.id} (board list, no detail page)`;
  }

  // Verify ownership + admin flag for contact hide
  const owned = await Promise.all(
    results.map(async (r) => {
      const checks = {
        supply: () =>
          prisma.supply.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        demand: () =>
          prisma.demand.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        forward: () =>
          prisma.futureHarvest.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        animals: () =>
          prisma.animalListing.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        machinery: () =>
          prisma.machineryListing.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        jobs: () =>
          prisma.jobRequest.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        plots: () =>
          prisma.plot.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        "shop/natural-products": () =>
          prisma.catalogListing.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        providers: () =>
          prisma.serviceProvider.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
        "group-buy": () =>
          prisma.groupBuyCampaign.findUnique({
            where: { id: r.id },
            select: { organizerId: true, status: true },
          }),
        spaces: () =>
          prisma.spaceListing.findUnique({
            where: { id: r.id },
            select: { userId: true, status: true },
          }),
      };
      const fn = checks[r.section];
      const row = fn ? await fn() : null;
      const ownerId =
        row && "userId" in row
          ? row.userId
          : row && "organizerId" in row
            ? row.organizerId
            : null;
      return {
        section: r.section,
        ownerOk: ownerId === admin.id,
        status: row?.status ?? null,
        contactHidden: admin.role === "ADMIN",
      };
    }),
  );

  console.log("\n=== Sample listings ===");
  for (const r of results) {
    console.log(
      `${r.action.padEnd(8)} ${r.section.padEnd(22)} ${r.path}${r.note ? ` (${r.note})` : ""}`,
    );
    console.log(`         ${r.title}`);
  }

  console.log("\n=== Ownership check ===");
  for (const o of owned) {
    console.log(
      `${o.section.padEnd(22)} ownerOk=${o.ownerOk} status=${o.status} contactHidden=${o.contactHidden}`,
    );
  }

  const bad = owned.filter((o) => !o.ownerOk);
  if (bad.length) {
    console.error("Ownership verification FAILED for:", bad.map((b) => b.section).join(", "));
    process.exit(1);
  }

  console.log("\nDone. Live base: https://www.xndzor.com");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
