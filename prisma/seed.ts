import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import locations from "../data/armenia-locations.json";
import { estimateYieldTons } from "../src/lib/yield";
import { buildTodaySuggestions } from "../src/lib/farm-today";

/** Full demo seed — wipes all data. For production use: npm run db:seed:minimal */

const prisma = new PrismaClient();

const products = [
  { slug: "tomato", nameKey: "products.tomato", sortOrder: 1 },
  { slug: "potato", nameKey: "products.potato", sortOrder: 2 },
  { slug: "grape", nameKey: "products.grape", sortOrder: 3 },
  { slug: "apple", nameKey: "products.apple", sortOrder: 4 },
  { slug: "peach", nameKey: "products.peach", sortOrder: 5 },
  { slug: "wheat", nameKey: "products.wheat", sortOrder: 6 },
  { slug: "milk", nameKey: "products.milk", sortOrder: 7 },
  { slug: "honey", nameKey: "products.honey", sortOrder: 8 },
  { slug: "other", nameKey: "products.other", sortOrder: 9 },
];

function findVillageId(marzId: string, nameEn: string): string {
  const matches = locations.villages.filter(
    (v) => v.marzId === marzId && v.nameEn.toLowerCase() === nameEn.toLowerCase()
  );
  // Prefer the community centre when a marz has both a town and a village of that name.
  const match = matches.find((v) => v.kind === "town" || v.kind === "district") || matches[0];
  if (!match) throw new Error(`Village not found: ${nameEn} in ${marzId}`);
  return match.id;
}

/** Local JPEG/WebP photos under /public/seed/ — always pass path with extension. */
const photos = (...paths: string[]) =>
  JSON.stringify(paths.map((p) => `/seed/${p}`));

const cropPhoto = (slug: string) => photos(`crops/${slug}.jpg`);
const harvestPhoto = (slug: string) => {
  const map: Record<string, string> = {
    tomato: "harvest/tomato-field.jpg",
    wheat: "harvest/wheat-field.jpg",
    grape: "harvest/grape-vineyard.jpg",
    apple: "harvest/apple-orchard.jpg",
    potato: "harvest/potato-field.jpg",
    peach: "harvest/peach-orchard.jpg",
    milk: "harvest/dairy-farm.jpg",
    honey: "harvest/beehives.jpg",
  };
  return photos(map[slug] ?? `crops/${slug}.jpg`);
};
/** Per-listing animal photos — each path must match livestock type in title.
 *  Source files: public/seed/animals/*.jpg (Wikimedia Commons; see scripts/fix-animal-listing-images.mjs) */
const ANIMAL_PHOTOS = {
  holsteinCow: photos("animals/cow.jpg"),
  beefBull: photos("animals/bull.jpg"),
  sheepFlock: photos("animals/sheep.jpg"),
  saanenGoat: photos("animals/goat.jpg"),
  meatPig: photos("animals/pig.jpg"),
  workHorse: photos("animals/horse.jpg"),
  layingChicken: photos("animals/chicken.jpg"),
  beeColony: photos("animals/bees.jpg"),
  guardDog: photos("animals/dog.jpg"),
} as const;

async function main() {
  await prisma.demandAlert.deleteMany();
  await prisma.boost.deleteMany();
  await prisma.returnCapacityOffer.deleteMany();
  await prisma.spaceListing.deleteMany();
  await prisma.farmDiaryEntry.deleteMany();
  await prisma.farmExpense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.farmReview.deleteMany();
  await prisma.productBatch.deleteMany();
  await prisma.preOffer.deleteMany();
  await prisma.plotTask.deleteMany();
  await prisma.yieldEstimate.deleteMany();
  await prisma.futureHarvest.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.groupBuyJoin.deleteMany();
  await prisma.jobRequest.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.groupBuyCampaign.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.supply.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.machineryListing.deleteMany();
  await prisma.animalListing.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.catalogListing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.village.deleteMany();
  await prisma.marz.deleteMany();

  for (const m of locations.marzes) {
    await prisma.marz.create({
      data: {
        id: m.id,
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
    await prisma.village.createMany({
      data: chunk.map((v) => ({
        id: v.id,
        slug: v.slug,
        marzId: v.marzId,
        nameHy: v.nameHy,
        nameEn: v.nameEn,
        nameRu: v.nameRu,
        kind: v.kind,
        lat: v.lat,
        lng: v.lng,
      })),
    });
  }

  // Demo-only weak password — change or skip seed in production (see SECURITY.md)
  const passwordHash = await bcrypt.hash("password123", 12);

  const farmer = await prisma.user.create({
    data: {
      email: "farmer@demo.am",
      passwordHash,
      name: "Արամ Հովհաննիսյան",
      phone: "+37491111222",
      role: "FARMER",
      marzId: "Ararat",
      villageId: findVillageId("Ararat", "Masis"),
      farmId: "AR-002184",
      farmName: "Մասիսի ֆերմա Արամ",
      farmVerified: true,
      isPro: true,
      proUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isVerifiedPaid: true,
      verifiedPaidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      showPhoneOnPassport: false,
      createdAt: new Date("2024-03-12"),
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@demo.am",
      passwordHash,
      name: "Xndzor Admin",
      phone: "+37490000000",
      role: "ADMIN",
      marzId: "Yerevan",
    },
  });

  await prisma.plan.createMany({
    data: [
      { code: "FARM_PRO_MONTHLY", kind: "FARM_PRO", nameKey: "pricing.farmPro.name", amountAmd: 4900, interval: "MONTHLY", sortOrder: 1 },
      { code: "FARM_PRO_YEARLY", kind: "FARM_PRO", nameKey: "pricing.farmPro.name", amountAmd: 49000, interval: "YEARLY", sortOrder: 2 },
      { code: "BUYER_PRO_MONTHLY", kind: "BUYER_PRO", nameKey: "pricing.buyerPro.name", amountAmd: 9900, interval: "MONTHLY", sortOrder: 3 },
      { code: "VERIFIED_FARM_YEARLY", kind: "VERIFIED_FARM", nameKey: "pricing.verifiedFarm.name", amountAmd: 9900, interval: "YEARLY", sortOrder: 4 },
      { code: "BOOST_7", kind: "BOOST", nameKey: "pricing.boost.name7", amountAmd: 1500, interval: "DAYS_7", sortOrder: 5 },
      { code: "BOOST_30", kind: "BOOST", nameKey: "pricing.boost.name30", amountAmd: 3900, interval: "DAYS_30", sortOrder: 6 },
    ],
  });

  await prisma.subscription.create({
    data: {
      userId: farmer.id,
      planCode: "FARM_PRO_YEARLY",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      userId: farmer.id,
      amountAmd: 49000,
      amountCharge: 12250,
      currencyCharge: "usd",
      status: "SUCCEEDED",
      provider: "DEMO",
      productCode: "FARM_PRO_YEARLY",
      metadataJson: "{}",
    },
  });
  console.log("Admin:", admin.email);
  const buyer = await prisma.user.create({
    data: {
      email: "buyer@demo.am",
      passwordHash,
      name: "Նարեկ Հյութագործ",
      phone: "+37493333444",
      role: "BUYER",
      marzId: "Yerevan",
    },
  });
  const buyerB = await prisma.user.create({
    data: {
      email: "buyer2@demo.am",
      passwordHash,
      name: "Լիլիթ Մեծածախ",
      phone: "+37494444555",
      role: "BUYER",
      marzId: "Kotayk",
    },
  });
  const provider = await prisma.user.create({
    data: {
      email: "provider@demo.am",
      passwordHash,
      name: "Վահան Կոմբայնավար",
      phone: "+37495555666",
      role: "PROVIDER",
      marzId: "Armavir",
      farmId: "AR-002190",
    },
  });
  const farmer2 = await prisma.user.create({
    data: {
      email: "levon@demo.am",
      passwordHash,
      name: "Լևոն Գրիգորյան",
      phone: "+37497777888",
      role: "FARMER",
      marzId: "Lori",
      villageId: findVillageId("Lori", "Vanadzor"),
      farmId: "AR-002185",
      farmName: "Լոռու այգի Լևոն",
      farmVerified: true,
      createdAt: new Date("2024-06-01"),
    },
  });
  const shop = await prisma.user.create({
    data: {
      email: "shop@demo.am",
      passwordHash,
      name: "Անի Սարգսյան",
      phone: "+37499123456",
      role: "BUYER",
      marzId: "Kotayk",
    },
  });
  const farmer3 = await prisma.user.create({
    data: {
      email: "gayane@demo.am",
      passwordHash,
      name: "Գայանե Պետրոսյան",
      phone: "+37477112233",
      role: "FARMER",
      marzId: "Gegharkunik",
      villageId: findVillageId("Gegharkunik", "Sevan"),
      farmId: "AR-002186",
      farmName: "Սևանի մեղվաբուծություն",
      farmVerified: false,
      createdAt: new Date("2025-01-20"),
    },
  });
  const farmer4 = await prisma.user.create({
    data: {
      email: "sargis@demo.am",
      passwordHash,
      name: "Սարգիս Ավետիսյան",
      phone: "+37498445566",
      role: "FARMER",
      marzId: "VayotsDzor",
      farmId: "AR-002188",
      createdAt: new Date("2025-08-01"),
    },
  });
  const farmer5 = await prisma.user.create({
    data: {
      email: "hasmik@demo.am",
      passwordHash,
      name: "Հասմիկ Մարտիրոսյան",
      phone: "+37455778899",
      role: "BOTH",
      marzId: "Tavush",
      farmId: "AR-002189",
    },
  });
  const provider2 = await prisma.user.create({
    data: {
      email: "tractor@demo.am",
      passwordHash,
      name: "Գագիկ Տրակտորիստ",
      phone: "+37496334455",
      role: "PROVIDER",
      marzId: "Shirak",
      farmId: "AR-002191",
    },
  });
  const exporter = await prisma.user.create({
    data: {
      email: "export@demo.am",
      passwordHash,
      name: "Արտակ Էքսպորտ",
      phone: "+37491667788",
      role: "BUYER",
      marzId: "Armavir",
    },
  });
  const factory = await prisma.user.create({
    data: {
      email: "factory@demo.am",
      passwordHash,
      name: "Երևան Կոնսերվ",
      phone: "+37491110001",
      role: "BUYER",
      marzId: "Yerevan",
    },
  });
  const restaurant = await prisma.user.create({
    data: {
      email: "resto@demo.am",
      passwordHash,
      name: "Գառնի Ռեստորան",
      phone: "+37491110002",
      role: "BUYER",
      marzId: "Kotayk",
    },
  });
  const farmerArmavir = await prisma.user.create({
    data: {
      email: "armavir@demo.am",
      passwordHash,
      name: "Հովհաննես Արմավիր",
      phone: "+37491110003",
      role: "FARMER",
      marzId: "Armavir",
      villageId: findVillageId("Armavir", "Vagharshapat"),
      farmId: "AR-002187",
      farmName: "Արմավիրի լոլիկ",
      farmVerified: false,
      createdAt: new Date("2025-02-10"),
    },
  });
  const farmerArmavir2 = await prisma.user.create({
    data: {
      email: "armavir2@demo.am",
      passwordHash,
      name: "Մարիամ Մեծամոր",
      phone: "+37491110004",
      role: "FARMER",
      marzId: "Armavir",
      farmId: "AR-002192",
    },
  });

  const cats = await Promise.all(products.map((p) => prisma.product.create({ data: p })));
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  const v = {
    masis: findVillageId("Ararat", "Masis"),
    artashat: findVillageId("Ararat", "Artashat"),
    vedi: findVillageId("Ararat", "Vedi"),
    aygestan: findVillageId("Ararat", "Aygestan"),
    vagharshapat: findVillageId("Armavir", "Vagharshapat"),
    metsamor: findVillageId("Armavir", "Metsamor"),
    aygeshat: findVillageId("Armavir", "Aygeshat"),
    kentron: findVillageId("Yerevan", "Kentron"),
    vanadzor: findVillageId("Lori", "Vanadzor"),
    stepanavan: findVillageId("Lori", "Stepanavan"),
    spitak: findVillageId("Lori", "Spitak"),
    abovyan: findVillageId("Kotayk", "Abovyan"),
    charentsavan: findVillageId("Kotayk", "Charentsavan"),
    hrazdan: findVillageId("Kotayk", "Hrazdan"),
    gavar: findVillageId("Gegharkunik", "Gavar"),
    martuni: findVillageId("Gegharkunik", "Martuni"),
    sevan: findVillageId("Gegharkunik", "Sevan"),
    gyumri: findVillageId("Shirak", "Gyumri"),
    artik: findVillageId("Shirak", "Artik"),
    ijevan: findVillageId("Tavush", "Ijevan"),
    dilijan: findVillageId("Tavush", "Dilijan"),
    berd: findVillageId("Tavush", "Berd"),
    areni: findVillageId("VayotsDzor", "Areni"),
    yeghegnadzor: findVillageId("VayotsDzor", "Yeghegnadzor"),
    ashtarak: findVillageId("Aragatsotn", "Ashtarak"),
    aparan: findVillageId("Aragatsotn", "Aparan"),
    talin: findVillageId("Aragatsotn", "Talin"),
    goris: findVillageId("Syunik", "Goris"),
    kapan: findVillageId("Syunik", "Kapan"),
    sisian: findVillageId("Syunik", "Sisian"),
  };

  const dTomato = await prisma.demand.create({
    data: {
      title: "Լոլիկ հյութի գործարանի համար",
      description: "Շաբաթական մթերում։ Կարող ենք նախապես ամրագրել օգոստոս–սեպտեմբեր։",
      productId: bySlug.tomato,
      qtyMin: 2000,
      qtyMax: 5000,
      unit: "kg",
      priceMinAmd: 120,
      priceMaxAmd: 180,
      buyerKind: "FACTORY",
      marzId: "Yerevan",
      villageId: v.kentron,
      phone: factory.phone!,
      userId: factory.id,
      imageUrls: cropPhoto("tomato"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Լոլիկ մեծածախ Կոտայք",
      description: "Պետք է 2–3 տոննա օգոստոսի վերջին։",
      productId: bySlug.tomato,
      qtyMin: 2000,
      qtyMax: 3000,
      unit: "kg",
      priceMinAmd: 140,
      priceMaxAmd: 190,
      buyerKind: "WHOLESALE",
      marzId: "Kotayk",
      villageId: v.abovyan,
      phone: buyerB.phone!,
      userId: buyerB.id,
      imageUrls: cropPhoto("tomato"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Լոլիկ ռեստորանի համար — փոքր ծավալ",
      description: "Շաբաթական 200–400 կգ թարմ լոլիկ։",
      productId: bySlug.tomato,
      qtyMin: 200,
      qtyMax: 400,
      unit: "kg",
      priceMinAmd: 220,
      priceMaxAmd: 280,
      buyerKind: "RESTAURANT",
      marzId: "Kotayk",
      villageId: v.abovyan,
      phone: restaurant.phone!,
      userId: restaurant.id,
      imageUrls: cropPhoto("tomato"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Ցորեն մեծածախ",
      description: "Աշնանային մթերում։",
      productId: bySlug.wheat,
      qtyMin: 10,
      qtyMax: 50,
      unit: "ton",
      priceMinAmd: 140000,
      priceMaxAmd: 180000,
      buyerKind: "WHOLESALE",
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: shop.phone!,
      userId: shop.id,
      imageUrls: cropPhoto("wheat"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Խաղող գինու համար",
      description: "Կարմիր սորտեր, սեպտեմբեր։",
      productId: bySlug.grape,
      qtyMin: 5,
      qtyMax: 20,
      unit: "ton",
      priceMinAmd: 180000,
      priceMaxAmd: 250000,
      buyerKind: "FACTORY",
      marzId: "Ararat",
      villageId: v.masis,
      phone: buyer.phone!,
      userId: buyer.id,
      imageUrls: cropPhoto("grape"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Խնձոր արտահանման համար — 1-ին կարգ",
      description: "Պետք է 20–40 տ խնձոր, տեսակավորված, արկղերով։ Բեռնումը՝ Արմավիրում։",
      productId: bySlug.apple,
      qtyMin: 20,
      qtyMax: 40,
      unit: "ton",
      priceMinAmd: 210000,
      priceMaxAmd: 280000,
      buyerKind: "EXPORTER",
      timingNote: "Սեպտեմբեր–հոկտեմբեր",
      neededBy: new Date("2026-10-05"),
      marzId: "Armavir",
      villageId: v.metsamor,
      phone: exporter.phone!,
      whatsapp: exporter.phone!,
      userId: exporter.id,
      imageUrls: cropPhoto("apple"),
    },
  });

  // Strong peach demand (undersupply demo) — almost no registered supply
  await prisma.demand.create({
    data: {
      title: "Դեղձ կոնսերվի գործարանի համար — 80 տ",
      description: "Օգոստոս–սեպտեմբեր, հասուն դեղձ, մեծ ծավալ։ Կարող ենք նախապես ամրագրել։",
      productId: bySlug.peach,
      qtyMin: 50,
      qtyMax: 80,
      unit: "ton",
      priceMinAmd: 280000,
      priceMaxAmd: 350000,
      buyerKind: "FACTORY",
      timingNote: "Օգոստոս–սեպտեմբեր 2026",
      neededBy: new Date("2026-09-15"),
      marzId: "Ararat",
      villageId: v.artashat,
      phone: factory.phone!,
      userId: factory.id,
      imageUrls: cropPhoto("peach"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Դեղձ արտահանում — 1-ին կարգ",
      description: "30–45 տ տեսակավորված դեղձ, սառնարանային շղթա։",
      productId: bySlug.peach,
      qtyMin: 30,
      qtyMax: 45,
      unit: "ton",
      priceMinAmd: 320000,
      priceMaxAmd: 400000,
      buyerKind: "EXPORTER",
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: exporter.phone!,
      userId: exporter.id,
      imageUrls: cropPhoto("peach"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Դեղձ խանութների ցանց — շաբաթական",
      description: "Շաբաթական 3–5 տ, փոքր փաթեթավորում։",
      productId: bySlug.peach,
      qtyMin: 12,
      qtyMax: 20,
      unit: "ton",
      priceMinAmd: 300000,
      priceMaxAmd: 360000,
      buyerKind: "SHOP_CHAIN",
      marzId: "Yerevan",
      villageId: v.kentron,
      phone: shop.phone!,
      userId: shop.id,
      imageUrls: cropPhoto("peach"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Դեղձ ռեստորաններ — սեզոնային",
      description: "2–4 տ թարմ դեղձ մենյուի համար։",
      productId: bySlug.peach,
      qtyMin: 2,
      qtyMax: 4,
      unit: "ton",
      priceMinAmd: 380000,
      priceMaxAmd: 450000,
      buyerKind: "RESTAURANT",
      marzId: "Kotayk",
      villageId: v.abovyan,
      phone: restaurant.phone!,
      userId: restaurant.id,
      imageUrls: cropPhoto("peach"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Կաթ ամենօրյա մթերում — Գեղարքունիք",
      description: "Օրական 600–1200 լ կաթ, սեփական տրանսպորտով վերցնում ենք գյուղից։",
      productId: bySlug.milk,
      qtyMin: 600,
      qtyMax: 1200,
      unit: "liter",
      priceMinAmd: 180,
      priceMaxAmd: 230,
      buyerKind: "FACTORY",
      timingNote: "Ամբողջ տարի",
      marzId: "Gegharkunik",
      villageId: v.gavar,
      phone: shop.phone!,
      userId: shop.id,
      imageUrls: cropPhoto("milk"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Կարտոֆիլ խանութների ցանցի համար",
      description: "Շաբաթական 5–8 տ, չափսը՝ 55 մմ+։ Վճարումը՝ առաքումից 3 օր հետո։",
      productId: bySlug.potato,
      qtyMin: 5,
      qtyMax: 8,
      unit: "ton",
      priceMinAmd: 190000,
      priceMaxAmd: 240000,
      buyerKind: "SHOP_CHAIN",
      marzId: "Lori",
      villageId: v.vanadzor,
      phone: buyerB.phone!,
      userId: buyerB.id,
      imageUrls: cropPhoto("potato"),
    },
  });

  await prisma.demand.create({
    data: {
      title: "Մեղր՝ նվերների փաթեթների համար",
      description: "300–600 կգ բնական մեղր, հնարավոր է սորտերով բաժանված։",
      productId: bySlug.honey,
      qtyMin: 300,
      qtyMax: 600,
      unit: "kg",
      priceMinAmd: 3200,
      priceMaxAmd: 4500,
      buyerKind: "SHOP_CHAIN",
      neededBy: new Date("2026-11-20"),
      marzId: "Tavush",
      villageId: v.ijevan,
      phone: shop.phone!,
      userId: shop.id,
      imageUrls: cropPhoto("honey"),
    },
  });

  const sTomato = await prisma.supply.create({
    data: {
      title: "Թարմ լոլիկ — Արարատ",
      description: "Պատրաստ է հիմա։ Դաշտից՝ արկղերով, օրական մինչև 1.5 տ։",
      productId: bySlug.tomato,
      qtyAvailable: 4500,
      unit: "kg",
      priceAmd: 180,
      readyInDays: 0,
      marzId: "Ararat",
      villageId: v.masis,
      phone: farmer.phone!,
      whatsapp: farmer.phone!,
      imageUrls: cropPhoto("tomato"),
      userId: farmer.id,
    },
  });

  await prisma.supply.create({
    data: {
      title: "Կարտոֆիլ Լոռի — տեսակավորված",
      description: "Տեսակավորված, պարկերով 25 կգ։ Պահեստը՝ Վանաձորում։",
      productId: bySlug.potato,
      qtyAvailable: 2500,
      unit: "kg",
      priceAmd: 200,
      readyInDays: 0,
      marzId: "Lori",
      villageId: v.vanadzor,
      phone: farmer2.phone!,
      imageUrls: cropPhoto("potato"),
      userId: farmer2.id,
    },
  });

  await prisma.supply.create({
    data: {
      title: "Խնձոր՝ Արենի, 1-ին կարգ",
      description: "Այգուց՝ ձեռքով հավաքված։ Հնարավոր է առաքում Երևան։",
      productId: bySlug.apple,
      qtyAvailable: 6000,
      unit: "kg",
      priceAmd: 240,
      readyInDays: 3,
      marzId: "VayotsDzor",
      villageId: v.areni,
      phone: farmer4.phone!,
      whatsapp: farmer4.phone!,
      imageUrls: cropPhoto("apple"),
      userId: farmer4.id,
    },
  });

  await prisma.supply.create({
    data: {
      title: "Կաթ՝ օրական 800 լ, Սևան",
      description: "Առավոտյան և երեկոյան կիթ։ Սառեցված տանկով։",
      productId: bySlug.milk,
      qtyAvailable: 800,
      unit: "liter",
      priceAmd: 205,
      readyInDays: 0,
      marzId: "Gegharkunik",
      villageId: v.sevan,
      phone: farmer3.phone!,
      imageUrls: cropPhoto("milk"),
      userId: farmer3.id,
    },
  });

  await prisma.supply.create({
    data: {
      title: "Բնական մեղր՝ Իջևան",
      description: "Ծաղկամեղր և ալպիական։ 0.5 և 1 կգ տարաներով։",
      productId: bySlug.honey,
      qtyAvailable: 420,
      unit: "kg",
      priceAmd: 3800,
      readyInDays: 0,
      marzId: "Tavush",
      villageId: v.ijevan,
      phone: farmer5.phone!,
      whatsapp: farmer5.phone!,
      imageUrls: cropPhoto("honey"),
      userId: farmer5.id,
    },
  });

  await prisma.supply.create({
    data: {
      title: "Խաղող՝ Արտաշատ, գինու սորտեր",
      description: "Արենի սև և Կանգուն։ Բերքահավաքը սկսվում է սեպտեմբերի 5-ից։",
      productId: bySlug.grape,
      qtyAvailable: 9000,
      unit: "kg",
      priceAmd: 210,
      readyInDays: 11,
      marzId: "Ararat",
      villageId: v.artashat,
      phone: farmer.phone!,
      imageUrls: cropPhoto("grape"),
      userId: farmer.id,
    },
  });

  await prisma.supply.create({
    data: {
      title: "Ցորեն՝ Շիրակ, բերք 2026",
      description: "Չոր, մաքրված։ Բեռնումը՝ Արթիկի պահեստից։",
      productId: bySlug.wheat,
      qtyAvailable: 24,
      unit: "ton",
      priceAmd: 152000,
      readyInDays: 0,
      marzId: "Shirak",
      villageId: v.artik,
      phone: provider2.phone!,
      imageUrls: cropPhoto("wheat"),
      userId: provider2.id,
    },
  });

  await prisma.offer.create({
    data: {
      supplyId: sTomato.id,
      demandId: dTomato.id,
      fromUserId: farmer.id,
      message: "4.5 տ լոլիկ՝ 180֏/կգ",
    },
  });

  const jobHarvest = await prisma.jobRequest.create({
    data: {
      jobType: "HARVEST",
      title: "6 հա ցորեն — պետք է կոմբայն օգոստոսի 28-ին",
      description:
        "Արմավիրում ունեմ 6 հեկտար ցորեն։ Պետք է բերքահավաք օգոստոսի 28-ին։ Առաջարկում եմ 450,000֏ ամբողջ աշխատանքի համար։",
      hectares: 6,
      areaNote: "6 հա ցորեն",
      workDate: new Date("2026-08-28"),
      budgetAmd: 450000,
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: farmer.phone!,
      whatsapp: farmer.phone!,
      userId: farmer.id,
    },
  });

  await prisma.jobRequest.create({
    data: {
      jobType: "PLOW",
      title: "Հերկ 4 հա — Արարատ",
      description: "Գարնանային հերկ։",
      hectares: 4,
      areaNote: "4 հա",
      workDate: new Date("2026-09-10"),
      budgetAmd: 200000,
      marzId: "Ararat",
      villageId: v.masis,
      phone: farmer.phone!,
      userId: farmer.id,
    },
  });

  await prisma.jobRequest.create({
    data: {
      jobType: "SPRAY",
      title: "Սրսկում 3 հա խնձորի այգի — Վայոց ձոր",
      description: "Պետք է սրսկող տեխնիկա և օպերատոր։ Դեղը՝ իմ հաշվին։",
      hectares: 3,
      areaNote: "3 հա խնձորի այգի",
      dateFrom: new Date("2026-08-27"),
      dateTo: new Date("2026-08-31"),
      budgetAmd: 120000,
      marzId: "VayotsDzor",
      villageId: v.areni,
      phone: farmer4.phone!,
      whatsapp: farmer4.phone!,
      userId: farmer4.id,
    },
  });

  await prisma.jobRequest.create({
    data: {
      jobType: "TRANSPORT",
      title: "Բերքի տեղափոխում Սևան → Երևան, 8 տ",
      description: "Շաբաթը երկու անգամ։ Պետք է սառնարանային կամ ծածկված մեքենա։",
      areaNote: "8 տ բեռ",
      workDate: new Date("2026-09-02"),
      budgetAmd: 90000,
      marzId: "Gegharkunik",
      villageId: v.sevan,
      phone: farmer3.phone!,
      userId: farmer3.id,
    },
  });

  await prisma.jobRequest.create({
    data: {
      jobType: "PRUNE",
      title: "Խաղողի էտ 2.5 հա — Իջևան",
      description: "Աշնանային էտ, փորձառու աշխատողներ։ Օրավարձ բանակցելի։",
      hectares: 2.5,
      areaNote: "2.5 հա այգի",
      dateFrom: new Date("2026-11-01"),
      dateTo: new Date("2026-11-20"),
      budgetAmd: 160000,
      marzId: "Tavush",
      villageId: v.ijevan,
      phone: farmer5.phone!,
      userId: farmer5.id,
    },
  });

  await prisma.jobRequest.create({
    data: {
      jobType: "SOW",
      title: "Ցանք 12 հա գարի — Շիրակ",
      description: "Պետք է սերմացանիչ և տրակտոր։ Սերմը՝ պատրաստ է պահեստում։",
      hectares: 12,
      areaNote: "12 հա գարի",
      workDate: new Date("2026-09-18"),
      budgetAmd: 380000,
      marzId: "Shirak",
      villageId: v.artik,
      phone: provider2.phone!,
      userId: provider2.id,
    },
  });

  const combaine = await prisma.serviceProvider.create({
    data: {
      title: "Կոմբայն + օպերատոր — Արմավիր / Արարատ",
      description: "Կատարում եմ բերքահավաք և հերկ։ Ոչ թե տեխնիկա եմ վարձով տալիս, այլ պատվեր եմ վերցնում։",
      jobTypesJson: JSON.stringify(["HARVEST", "PLOW"]),
      coverageNote: "Արմավիր, Արարատ, Երևանի մատույցներ",
      hectaresMax: 40,
      rateAmd: 70000,
      rateUnit: "ha",
      availableFrom: new Date("2026-08-20"),
      availableTo: new Date("2026-10-15"),
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: provider.phone!,
      whatsapp: provider.phone!,
      userId: provider.id,
    },
  });

  await prisma.serviceProvider.create({
    data: {
      title: "Տրակտոր + սերմացանիչ — Շիրակ / Լոռի",
      description: "Հերկ, ցանք, կուլտիվացիա։ Աշխատում եմ պատվերով, ոչ ժամավարձով։",
      jobTypesJson: JSON.stringify(["PLOW", "SOW", "TRANSPORT"]),
      coverageNote: "Շիրակ, Լոռի, Արագածոտն",
      hectaresMax: 60,
      rateAmd: 42000,
      rateUnit: "ha",
      availableFrom: new Date("2026-08-15"),
      availableTo: new Date("2026-11-30"),
      marzId: "Shirak",
      villageId: v.gyumri,
      phone: provider2.phone!,
      whatsapp: provider2.phone!,
      userId: provider2.id,
    },
  });

  await prisma.serviceProvider.create({
    data: {
      title: "Սրսկող տեխնիկա և ագրոնոմ — Վայոց ձոր / Սյունիք",
      description: "Այգիների սրսկում, էտ, ագրոնոմիական խորհրդատվություն։",
      jobTypesJson: JSON.stringify(["SPRAY", "PRUNE", "CONSULT"]),
      coverageNote: "Վայոց ձոր, Սյունիք, Արարատ",
      hectaresMax: 25,
      rateAmd: 35000,
      rateUnit: "ha",
      availableFrom: new Date("2026-08-20"),
      availableTo: new Date("2026-12-15"),
      marzId: "VayotsDzor",
      villageId: v.yeghegnadzor,
      phone: farmer5.phone!,
      userId: farmer5.id,
    },
  });

  await prisma.jobApplication.create({
    data: {
      jobRequestId: jobHarvest.id,
      providerId: combaine.id,
      fromUserId: provider.id,
      message: "Կարող եմ օգոստոսի 28-ին։ Առաջարկ՝ 420,000֏։",
      proposedPriceAmd: 420000,
    },
  });

  // ——— FarmOS plots (killer loop demo) ———
  const now = new Date("2026-08-25T08:00:00+04:00");
  const tomatoEst = estimateYieldTons("tomato", 2.5, "hy");
  const wheatEst = estimateYieldTons("wheat", 6, "hy");
  const grapeEst = estimateYieldTons("grape", 1.8, "hy");

  const plotTomato = await prisma.plot.create({
    data: {
      name: "Մասիսի լոլիկի դաշտ",
      hectares: 2.5,
      cropProductId: bySlug.tomato,
      plantDate: new Date("2026-04-15"),
      irrigationNotes: "Կաթիլային ոռոգում, առավոտյան",
      lastFertilizer: "NPK 15-15-15 · հուլիս",
      lastIrrigationAt: new Date("2026-08-20"),
      harvestFrom: new Date("2026-08-28"),
      harvestTo: new Date("2026-09-20"),
      marzId: "Ararat",
      villageId: v.masis,
      userId: farmer.id,
      yieldEstimate: {
        create: {
          tonsMin: tomatoEst.tonsMin,
          tonsMax: tomatoEst.tonsMax,
          assumptionNote: tomatoEst.assumptionNote,
          farmerOverrideTons: 80,
          source: "RULE_TABLE",
        },
      },
    },
  });

  const plotWheat = await prisma.plot.create({
    data: {
      name: "Արմավիրի ցորեն",
      hectares: 6,
      cropProductId: bySlug.wheat,
      plantDate: new Date("2025-10-20"),
      irrigationNotes: "Մասամբ ոռոգվող",
      lastFertilizer: "Ազոտ · մարտ",
      lastIrrigationAt: new Date("2026-08-10"),
      harvestFrom: new Date("2026-08-26"),
      harvestTo: new Date("2026-09-05"),
      marzId: "Armavir",
      villageId: v.vagharshapat,
      userId: farmer.id,
      yieldEstimate: {
        create: {
          tonsMin: wheatEst.tonsMin,
          tonsMax: wheatEst.tonsMax,
          assumptionNote: wheatEst.assumptionNote,
          source: "RULE_TABLE",
        },
      },
    },
  });

  const plotGrape = await prisma.plot.create({
    data: {
      name: "Խաղողի այգի — Մասիս",
      hectares: 1.8,
      cropProductId: bySlug.grape,
      plantDate: new Date("2020-03-01"),
      irrigationNotes: "Խրամատային",
      lastFertilizer: "Օրգանական · գարուն",
      lastIrrigationAt: new Date("2026-08-18"),
      harvestFrom: new Date("2026-09-10"),
      harvestTo: new Date("2026-09-30"),
      marzId: "Ararat",
      villageId: v.masis,
      userId: farmer.id,
      yieldEstimate: {
        create: {
          tonsMin: grapeEst.tonsMin,
          tonsMax: grapeEst.tonsMax,
          assumptionNote: grapeEst.assumptionNote,
          source: "RULE_TABLE",
        },
      },
    },
  });

  for (const plot of [
    { p: plotTomato, slug: "tomato", buyers: 2 },
    { p: plotWheat, slug: "wheat", buyers: 1 },
    { p: plotGrape, slug: "grape", buyers: 0 },
  ]) {
    const suggestions = buildTodaySuggestions({
      cropSlug: plot.slug,
      lastIrrigationAt: plot.p.lastIrrigationAt,
      harvestFrom: plot.p.harvestFrom,
      harvestTo: plot.p.harvestTo,
      interestedBuyers: plot.buyers,
      now,
    });
    await prisma.plotTask.createMany({
      data: suggestions.map((s) => ({
        plotId: plot.p.id,
        kind: s.kind,
        title: s.titleKey,
        detail: `${s.detailKey}|${JSON.stringify(s.detailParams || {})}`,
        priority: s.priority,
        dueDate: now,
        status: "OPEN",
      })),
    });
  }

  const tomatoFuture = await prisma.futureHarvest.create({
    data: {
      productId: bySlug.tomato,
      plotId: plotTomato.id,
      title: "Մասիսի լոլիկ — ապագա բերք (օգոստոս–սեպտեմբեր)",
      description: `Հողամասից կանխատեսում՝ ${tomatoEst.tonsMin}–${tomatoEst.tonsMax} տ (ֆերմերի նշում՝ 80 տ). ${tomatoEst.assumptionNote}`,
      qtyExpected: 80,
      unit: "ton",
      harvestDate: new Date("2026-09-05"),
      priceAmd: 160000,
      marzId: "Ararat",
      villageId: v.masis,
      phone: farmer.phone!,
      whatsapp: farmer.phone!,
      imageUrls: harvestPhoto("tomato"),
      userId: farmer.id,
    },
  });

  await prisma.preOffer.create({
    data: {
      futureHarvestId: tomatoFuture.id,
      fromUserId: buyer.id,
      qtyWanted: 25,
      message: "Հյութի գործարան — 25 տ ամրագրում",
      status: "RESERVED",
    },
  });

  await prisma.preOffer.create({
    data: {
      futureHarvestId: tomatoFuture.id,
      fromUserId: buyerB.id,
      qtyWanted: 15,
      message: "Մեծածախ — 15 տ",
      status: "SENT",
    },
  });

  // ——— Farm OS demo expenses + space listing ———
  await prisma.farmExpense.createMany({
    data: [
      {
        userId: farmer.id,
        plotId: plotTomato.id,
        category: "diesel",
        amountAmd: 85000,
        note: "Տրակտոր · ոռոգման պոմպ",
        date: new Date("2026-08-12"),
      },
      {
        userId: farmer.id,
        plotId: plotTomato.id,
        category: "labor",
        amountAmd: 120000,
        note: "Բերքահավաքի աշխատողներ",
        date: new Date("2026-08-18"),
      },
      {
        userId: farmer.id,
        plotId: plotWheat.id,
        category: "seed",
        amountAmd: 95000,
        note: "Ցորենի սերմ",
        date: new Date("2025-10-15"),
      },
      {
        userId: farmer.id,
        plotId: plotTomato.id,
        category: "water",
        amountAmd: 42000,
        note: "Ոռոգման վարձ",
        date: new Date("2026-08-05"),
      },
      {
        userId: farmer.id,
        category: "other",
        amountAmd: 28000,
        note: "Տարաներ / արկղեր",
        date: new Date("2026-08-22"),
      },
    ],
  });

  await prisma.spaceListing.create({
    data: {
      title: "Սառը պահեստ — Մասիս (դեմո)",
      description: "Դատարկ սառնարանային տարածք բերքի համար։ Farm OS դեմո հայտարարություն։",
      spaceType: "COLD",
      capacityNote: "~40 տ",
      availableFrom: new Date("2026-09-01"),
      availableTo: new Date("2026-11-30"),
      priceAmd: 180000,
      priceUnit: "PER_MONTH",
      marzId: "Ararat",
      villageId: v.masis,
      phone: farmer.phone!,
      userId: farmer.id,
    },
  });

  await prisma.farmDiaryEntry.create({
    data: {
      userId: farmer.id,
      plotId: plotTomato.id,
      rawText: "Այսօր ոռոգեցի 1.5 հա, տվեցի 40 կգ պարարտանյութ, վաղը 3 աշխատող։",
      parsedJson: JSON.stringify({
        wateredHa: 1.5,
        fertilizerKg: 40,
        workersTomorrow: 3,
        keywords: ["irrigation", "fertilizer", "workers"],
      }),
      entryDate: new Date("2026-08-24"),
    },
  });

  // Armavir tomato concentration → overproduction signal demo
  const armavirTomatoA = await prisma.plot.create({
    data: {
      name: "Արմավիրի լոլիկ — 3 հա",
      hectares: 3,
      cropProductId: bySlug.tomato,
      plantDate: new Date("2026-03-20"),
      irrigationNotes: "Կաթիլային",
      harvestFrom: new Date("2026-08-10"),
      harvestTo: new Date("2026-09-15"),
      marzId: "Armavir",
      villageId: v.vagharshapat,
      userId: farmerArmavir.id,
      yieldEstimate: {
        create: {
          tonsMin: 75,
          tonsMax: 110,
          assumptionNote: "Արմավիր · ոռոգվող · ֆերմերի գնահատական",
          farmerOverrideTons: 95,
          source: "RULE_TABLE",
        },
      },
    },
  });

  const armavirTomatoB = await prisma.plot.create({
    data: {
      name: "Մեծամորի լոլիկ — 4 հա",
      hectares: 4,
      cropProductId: bySlug.tomato,
      plantDate: new Date("2026-03-25"),
      irrigationNotes: "Ոռոգվող",
      harvestFrom: new Date("2026-08-15"),
      harvestTo: new Date("2026-09-20"),
      marzId: "Armavir",
      villageId: v.metsamor,
      userId: farmerArmavir2.id,
      yieldEstimate: {
        create: {
          tonsMin: 100,
          tonsMax: 140,
          assumptionNote: "Մեծամոր · բաց դաշտ",
          farmerOverrideTons: 120,
          source: "RULE_TABLE",
        },
      },
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.tomato,
      plotId: armavirTomatoA.id,
      title: "Արմավիր · լոլիկ 95 տ (օգոստոս)",
      description: "3 հա · սպասվող ~95 տ։ Կենտրոնացված Արմավիրում — գերարտադրության օրինակ։",
      qtyExpected: 95,
      unit: "ton",
      harvestDate: new Date("2026-08-20"),
      priceAmd: 145000,
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: farmerArmavir.phone!,
      imageUrls: harvestPhoto("tomato"),
      userId: farmerArmavir.id,
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.tomato,
      plotId: armavirTomatoB.id,
      title: "Մեծամոր · լոլիկ 120 տ (օգոստոս–սեպտեմբեր)",
      description: "4 հա · սպասվող ~120 տ։",
      qtyExpected: 120,
      unit: "ton",
      harvestDate: new Date("2026-08-28"),
      priceAmd: 140000,
      marzId: "Armavir",
      villageId: v.metsamor,
      phone: farmerArmavir2.phone!,
      imageUrls: harvestPhoto("tomato"),
      userId: farmerArmavir2.id,
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.tomato,
      title: "Այգեշատ · լոլիկ 60 տ",
      description: "Լրացուցիչ Արմավիրի մատակարարում՝ գերարտադրության ազդանշանի համար։",
      qtyExpected: 60,
      unit: "ton",
      harvestDate: new Date("2026-09-01"),
      priceAmd: 150000,
      marzId: "Armavir",
      villageId: v.aygeshat,
      phone: farmerArmavir.phone!,
      imageUrls: harvestPhoto("tomato"),
      userId: farmerArmavir.id,
    },
  });

  // Tiny peach supply vs huge demand → green undersupply
  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.peach,
      title: "Փոքր դեղձի այգի — Արարատ (օրինակ)",
      description: "Միայն ~3 տ գրանցված առաջարկ՝ ընդդեմ 100+ տ պահանջարկի։",
      qtyExpected: 3,
      unit: "ton",
      harvestDate: new Date("2026-08-25"),
      priceAmd: 340000,
      marzId: "Ararat",
      villageId: v.vedi,
      phone: farmer.phone!,
      imageUrls: harvestPhoto("peach"),
      userId: farmer.id,
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.wheat,
      plotId: plotWheat.id,
      title: "Ցորեն — նախապես վաճառք (օգոստոսի վերջ)",
      description: `Ակնկալվող՝ ${wheatEst.tonsMin}–${wheatEst.tonsMax} տ. ${wheatEst.assumptionNote}`,
      qtyExpected: Math.round((wheatEst.tonsMin + wheatEst.tonsMax) / 2),
      unit: "ton",
      harvestDate: new Date("2026-08-30"),
      priceAmd: 155000,
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: farmer.phone!,
      imageUrls: harvestPhoto("wheat"),
      userId: farmer.id,
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.grape,
      plotId: plotGrape.id,
      title: "Խաղող գինու համար — սեպտեմբեր",
      description: `Ակնկալվող՝ ${grapeEst.tonsMin}–${grapeEst.tonsMax} տ. ${grapeEst.assumptionNote}`,
      qtyExpected: 12,
      unit: "ton",
      harvestDate: new Date("2026-09-20"),
      priceAmd: 220000,
      marzId: "Ararat",
      villageId: v.masis,
      phone: farmer.phone!,
      imageUrls: harvestPhoto("grape"),
      userId: farmer.id,
    },
  });

  const appleFuture = await prisma.futureHarvest.create({
    data: {
      productId: bySlug.apple,
      title: "Խնձոր՝ Արենի — ապագա բերք (հոկտեմբեր)",
      description: "3 հա այգի, ակնկալվում է 45 տ։ Հնարավոր է նախնական ամրագրում մասերով։",
      qtyExpected: 45,
      unit: "ton",
      harvestDate: new Date("2026-10-05"),
      priceAmd: 235000,
      marzId: "VayotsDzor",
      villageId: v.areni,
      phone: farmer4.phone!,
      whatsapp: farmer4.phone!,
      imageUrls: harvestPhoto("apple"),
      userId: farmer4.id,
    },
  });

  await prisma.preOffer.create({
    data: {
      futureHarvestId: appleFuture.id,
      fromUserId: exporter.id,
      qtyWanted: 20,
      message: "Արտահանման համար՝ 20 տ, արկղերով",
      status: "RESERVED",
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.potato,
      title: "Կարտոֆիլ՝ Սպիտակ — ապագա բերք (սեպտեմբեր)",
      description: "8 հա, ակնկալվում է 160 տ։ Պահեստավորում հնարավոր է մինչև նոյեմբեր։",
      qtyExpected: 160,
      unit: "ton",
      harvestDate: new Date("2026-09-25"),
      priceAmd: 185000,
      marzId: "Lori",
      villageId: v.spitak,
      phone: farmer2.phone!,
      imageUrls: harvestPhoto("potato"),
      userId: farmer2.id,
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.milk,
      title: "Կաթ՝ պայմանագրային մատակարարում (հոկտեմբեր–մարտ)",
      description: "Օրական 900 լ երաշխավորված ծավալ ձմռան ամիսներին։",
      qtyExpected: 160000,
      unit: "liter",
      harvestDate: new Date("2026-10-01"),
      priceAmd: 200,
      marzId: "Gegharkunik",
      villageId: v.martuni,
      phone: farmer3.phone!,
      imageUrls: harvestPhoto("milk"),
      userId: farmer3.id,
    },
  });

  await prisma.futureHarvest.create({
    data: {
      productId: bySlug.honey,
      title: "Մեղր՝ Բերդ — աշնանային մթերում",
      description: "60 փեթակ, ակնկալվում է 900 կգ ծաղկամեղր։",
      qtyExpected: 900,
      unit: "kg",
      harvestDate: new Date("2026-09-15"),
      priceAmd: 3600,
      marzId: "Tavush",
      villageId: v.berd,
      phone: farmer5.phone!,
      imageUrls: harvestPhoto("honey"),
      userId: farmer5.id,
    },
  });

  const campaign = await prisma.groupBuyCampaign.create({
    data: {
      productId: bySlug.potato,
      title: "Խմբային գնում՝ սերմացու կարտոֆիլ",
      description: "Հավաքում ենք պատվեր մինչև նպատակային քանակ։ Վճարում՝ օֆլայն մատակարարին։",
      targetQty: 10000,
      unit: "kg",
      pricePerUnitAmd: 280,
      deadline: new Date("2026-09-15"),
      status: "OPEN",
      supplierNote: "Մատակարար՝ Կոտայք, նախնական գին 280֏/կգ",
      marzId: "Kotayk",
      organizerId: shop.id,
    },
  });

  await prisma.groupBuyJoin.createMany({
    data: [
      { campaignId: campaign.id, userId: farmer.id, qty: 2000 },
      { campaignId: campaign.id, userId: farmer2.id, qty: 1500 },
      { campaignId: campaign.id, userId: buyer.id, qty: 500 },
    ],
  });

  const fertilizerCampaign = await prisma.groupBuyCampaign.create({
    data: {
      productId: bySlug.other,
      title: "Խմբային գնում՝ պարարտանյութ (NPK)",
      description: "NPK 15-15-15 խառնուրդ։ Մեծածախ գին՝ 5 տոննայից սկսած։",
      targetQty: 5,
      unit: "ton",
      pricePerUnitAmd: 220000,
      deadline: new Date("2026-09-20"),
      status: "OPEN",
      supplierNote: "Մատակարար՝ Վանաձոր, առաքումը՝ ընդհանուր կենտրոն",
      organizerId: farmer2.id,
      marzId: "Lori",
    },
  });

  await prisma.groupBuyJoin.createMany({
    data: [
      { campaignId: fertilizerCampaign.id, userId: farmer.id, qty: 1 },
      { campaignId: fertilizerCampaign.id, userId: farmer3.id, qty: 2 },
    ],
  });

  const boxCampaign = await prisma.groupBuyCampaign.create({
    data: {
      productId: bySlug.other,
      title: "Խմբային գնում՝ փայտյա արկղեր բերքի համար",
      description: "Ստանդարտ 20 կգ արկղեր։ Որքան շատ ենք, այնքան էժան։",
      targetQty: 4000,
      unit: "piece",
      pricePerUnitAmd: 640,
      deadline: new Date("2026-09-10"),
      status: "OPEN",
      supplierNote: "Մատակարար՝ Արմավիր",
      organizerId: farmer4.id,
      marzId: "VayotsDzor",
    },
  });

  await prisma.groupBuyJoin.createMany({
    data: [
      { campaignId: boxCampaign.id, userId: farmer4.id, qty: 900 },
      { campaignId: boxCampaign.id, userId: farmer5.id, qty: 600 },
      { campaignId: boxCampaign.id, userId: farmer.id, qty: 1200 },
    ],
  });

  const dieselCampaign = await prisma.groupBuyCampaign.create({
    data: {
      productId: bySlug.other,
      title: "Խմբային գնում՝ դիզելային վառելիք բերքահավաքի համար",
      description: "Հավաքում ենք պատվեր բերքահավաքի սեզոնի համար՝ ցիստերնով առաքում գյուղ։",
      targetQty: 12000,
      unit: "liter",
      pricePerUnitAmd: 495,
      deadline: new Date("2026-08-31"),
      status: "QUOTED",
      supplierNote: "Գնանշում ստացված է՝ 495֏/լ 12,000 լ-ից",
      organizerId: farmer3.id,
      marzId: "Gegharkunik",
    },
  });

  await prisma.groupBuyJoin.createMany({
    data: [
      { campaignId: dieselCampaign.id, userId: farmer3.id, qty: 3000 },
      { campaignId: dieselCampaign.id, userId: farmer2.id, qty: 2500 },
      { campaignId: dieselCampaign.id, userId: provider.id, qty: 4000 },
      { campaignId: dieselCampaign.id, userId: provider2.id, qty: 1500 },
    ],
  });

  // —— Agricultural machinery for sale (inventory marketplace) ——
  await prisma.machineryListing.createMany({
    data: [
      {
        title: "John Deere 6155R · 2019 · 4 200 մոտ/ժ",
        description:
          "Լավ վիճակում տրակտոր Արարատի դաշտերից։ Կանոնավոր սպասարկում, յուղեր փոխված։ Հարմար է վարի, սերմնացանի և տրանսպորտի համար։ Կցորդներով չի վաճառվում՝ առանձին հնարավոր է։",
        machineryType: "TRACTOR",
        make: "John Deere",
        model: "6155R",
        year: 2019,
        engineHours: 4200,
        condition: "USED",
        priceAmd: 48_000_000,
        priceNegotiable: true,
        powerHp: 155,
        transmission: "AutoPowr IVT",
        driveType: "4WD",
        fuel: "Դիզել",
        attachments: "Առջևի բեռնիչ չկա",
        documentsNote: "Հայաստանում գրանցված, մաքսազերծված",
        marzId: "Ararat",
        villageId: v.masis,
        phone: farmer.phone!,
        whatsapp: farmer.phone!,
        imageUrls: photos("machinery/jd-6155r.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        title: "MTZ Belarus 82.1 · 2015",
        description:
          "Դասական բելառուսական տրակտոր՝ գյուղական աշխատանքների համար։ Մոտորաժամը ազնիվ է, հիդրավլիկան աշխատում է։ Վաճառվում է Արմավիրից։",
        machineryType: "TRACTOR",
        make: "MTZ Belarus",
        model: "82.1",
        year: 2015,
        engineHours: 6800,
        condition: "USED",
        priceAmd: 9_500_000,
        priceNegotiable: true,
        powerHp: 82,
        transmission: "Մեխանիկական",
        driveType: "4WD",
        fuel: "Դիզել",
        attachments: "ՊԼՆ-3, կցորդի կեռ",
        documentsNote: "Փաստաթղթերը կարգին են",
        marzId: "Armavir",
        villageId: v.vagharshapat,
        phone: farmer2.phone!,
        whatsapp: farmer2.phone!,
        imageUrls: photos("machinery/mtz-82.jpg"),
        userId: farmer2.id,
        status: "ACTIVE",
      },
      {
        title: "Case IH Axial-Flow 6140 կոմբայն",
        description:
          "Հացահատիկի կոմբայն՝ ցորենի և գարու բերքահավաքի համար։ Բունկերը մաքուր է, մաղերը փոխված 2024-ին։ Հասանելի է Կոտայքում։",
        machineryType: "COMBINE",
        make: "Case IH",
        model: "Axial-Flow 6140",
        year: 2016,
        engineHours: 3100,
        condition: "USED",
        priceAmd: 72_000_000,
        priceNegotiable: false,
        powerHp: 350,
        transmission: "Հիդրոստատիկ",
        driveType: "2WD",
        fuel: "Դիզել",
        capacity: "Бункер ~10 500 լ",
        workingWidth: "Հեդեր 7.6 մ (ոչ ներառված)",
        documentsNote: "Մաքսազերծված, տեխզննություն անցած",
        marzId: "Kotayk",
        villageId: v.abovyan,
        phone: provider.phone!,
        whatsapp: provider.phone!,
        imageUrls: photos("machinery/case-axial.jpg"),
        userId: provider.id,
        status: "ACTIVE",
      },
      {
        title: "Claas Lexion 570 · 2012",
        description:
          "Գեղարքունիքի դաշտերում աշխատած կոմբայն։ Վիճակը միջին, պահանջում է թեթև սպասարկում։ Գինը բանակցելի է։",
        machineryType: "COMBINE",
        make: "Claas",
        model: "Lexion 570",
        year: 2012,
        engineHours: 5400,
        condition: "USED",
        priceAmd: 38_000_000,
        priceNegotiable: true,
        powerHp: 326,
        fuel: "Դիզել",
        capacity: "Бункер 9 000 լ",
        workingWidth: "6 մ",
        marzId: "Gegharkunik",
        villageId: v.martuni,
        phone: farmer3.phone!,
        whatsapp: farmer3.phone!,
        imageUrls: photos("machinery/claas-lexion.jpg"),
        userId: farmer3.id,
        status: "ACTIVE",
      },
      {
        title: "Amazone UX 4200 սրսկիչ",
        description:
          "Կցովի սրսկիչ՝ այգիների և դաշտային մշակույթների համար։ Պոմպը ստուգված է, վարդակները նոր են։",
        machineryType: "SPRAYER",
        make: "Amazone",
        model: "UX 4200",
        year: 2018,
        engineHours: 1200,
        condition: "USED",
        priceAmd: 14_200_000,
        priceNegotiable: true,
        powerHp: null,
        fuel: "—",
        workingWidth: "24 մ",
        capacity: "4 200 լ բաք",
        marzId: "Ararat",
        villageId: v.artashat,
        phone: farmer.phone!,
        whatsapp: farmer.phone!,
        imageUrls: photos("machinery/amazone-sprayer.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        title: "Kverneland սերմնացան · 4 մ",
        description:
          "Մեխանիկական սերմնացան ցորենի և գարու համար։ Աշխատանքային լայնություն 4 մ։ Վիճակը լավ է, օգտագործվել է սահմանափակ։",
        machineryType: "SEEDER",
        make: "Kverneland",
        model: "u-drill 4000",
        year: 2020,
        engineHours: 800,
        condition: "USED",
        priceAmd: 11_800_000,
        priceNegotiable: false,
        workingWidth: "4 մ",
        capacity: "Սերմի բունկեր 3 000 լ",
        fuel: "—",
        marzId: "Shirak",
        villageId: v.gyumri,
        phone: farmer4.phone!,
        whatsapp: farmer4.phone!,
        imageUrls: photos("machinery/kverneland-seeder.jpg"),
        userId: farmer4.id,
        status: "ACTIVE",
      },
      {
        title: "Lemken կուլտիվատոր 5 մ",
        description:
          "Ծանր կուլտիվատոր՝ նախավարի մշակման համար։ Շիրակից։ Կարող է աշխատել MTZ 82+ տրակտորների հետ։",
        machineryType: "CULTIVATOR",
        make: "Lemken",
        model: "Karat 9",
        year: 2017,
        condition: "USED",
        priceAmd: 6_400_000,
        priceNegotiable: true,
        workingWidth: "5 մ",
        attachments: "Խորության անիվներ ներառված",
        marzId: "Shirak",
        villageId: v.artik,
        phone: farmer4.phone!,
        whatsapp: farmer4.phone!,
        imageUrls: photos("machinery/lemken-cultivator.jpg"),
        userId: farmer4.id,
        status: "ACTIVE",
      },
      {
        title: "Fliegl գյուղատնտեսական կցորդ 12 տ",
        description:
          "Եռակողմանի բեռնաթափումով կցորդ։ Հարմար է հացահատիկի և պարարտանյութի տեղափոխման համար։",
        machineryType: "TRAILER",
        make: "Fliegl",
        model: "DK 180",
        year: 2014,
        mileageKm: 45000,
        condition: "USED",
        priceAmd: 4_800_000,
        priceNegotiable: true,
        capacity: "12 տոննա",
        marzId: "Lori",
        villageId: v.vanadzor,
        phone: provider2.phone!,
        whatsapp: provider2.phone!,
        imageUrls: photos("machinery/fliegl-trailer.jpg"),
        userId: provider2.id,
        status: "ACTIVE",
      },
      {
        title: "КАМАЗ 55111 ինքնաթափ · 2008",
        description:
          "Գյուղատնտեսական բեռնափոխադրումների համար։ Շարժիչը աշխատում է, թափքը ամուր է։ Վաճառվում է Սյունիքից։",
        machineryType: "TRUCK",
        make: "Kamaz",
        model: "55111",
        year: 2008,
        mileageKm: 280000,
        condition: "USED",
        priceAmd: 7_200_000,
        priceNegotiable: true,
        powerHp: 240,
        transmission: "Մեխանիկական",
        driveType: "6×4",
        fuel: "Դիզել",
        capacity: "10 մ³ թափք",
        documentsNote: "Տեխպասպորտ կա",
        marzId: "Syunik",
        villageId: v.goris,
        phone: farmer5.phone!,
        whatsapp: farmer5.phone!,
        imageUrls: photos("machinery/kamaz-55111.jpg"),
        userId: farmer5.id,
        status: "ACTIVE",
      },
      {
        title: "New Holland T6.180 · նոր մնացորդ",
        description:
          "Գրեթե նոր տրակտոր՝ ցուցադրական ժամերով։ Երևանի մոտ պահեստում։ Երաշխիքային սպասարկման հնարավորություն։",
        machineryType: "TRACTOR",
        make: "New Holland",
        model: "T6.180",
        year: 2024,
        engineHours: 120,
        condition: "NEW",
        priceAmd: 62_000_000,
        priceNegotiable: false,
        powerHp: 175,
        transmission: "Dynamic Command",
        driveType: "4WD",
        fuel: "Դիզել",
        documentsNote: "Նոր ներմուծում, մաքսազերծված",
        marzId: "Yerevan",
        villageId: v.kentron,
        phone: shop.phone!,
        whatsapp: shop.phone!,
        imageUrls: photos("machinery/newholland-t6.jpg"),
        userId: shop.id,
        status: "ACTIVE",
      },
    ],
  });

  // Demo TOP boost — John Deere appears first on machinery board / home
  const topTractor = await prisma.machineryListing.findFirst({
    where: { title: { contains: "John Deere 6155R" }, userId: farmer.id },
  });
  if (topTractor) {
    const boostPay = await prisma.payment.create({
      data: {
        userId: farmer.id,
        amountAmd: 3900,
        amountCharge: 975,
        currencyCharge: "usd",
        status: "SUCCEEDED",
        provider: "DEMO",
        productCode: "BOOST_30",
        metadataJson: JSON.stringify({
          targetType: "MACHINERY",
          targetId: topTractor.id,
        }),
      },
    });
    await prisma.boost.create({
      data: {
        userId: farmer.id,
        targetType: "MACHINERY",
        targetId: topTractor.id,
        days: 30,
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: "PAID",
        paymentId: boostPay.id,
      },
    });
  }

  // —— Livestock / domestic animals marketplace ——
  await prisma.animalListing.createMany({
    data: [
      {
        title: "Կաթնատու կովեր՝ Հոլշտայն, Արարատ",
        description:
          "Երեք առողջ Հոլշտայն կովեր, օրական միջինը 22–26 լ կաթ։ Պատվաստումները արված են, փաստաթղթերը կան։ Վաճառվում են որպես խումբ կամ առանձին։ Հարմար է կաթնատնտեսության համար։",
        animalType: "COW",
        breed: "Holstein",
        sex: "FEMALE",
        ageValue: 4,
        ageUnit: "YEARS",
        weightKg: 580,
        quantity: 3,
        purpose: "DAIRY",
        vaccinated: true,
        healthNotes: "Պատվաստումներ արված են 2026 գարնանը",
        documentsNote: "Անասնաբուժական փաստաթղթեր կան",
        priceAmd: 1_800_000,
        priceNegotiable: true,
        priceMode: "PER_HEAD",
        marzId: "Ararat",
        villageId: v.masis,
        phone: farmer.phone!,
        whatsapp: farmer.phone!,
        imageUrls: ANIMAL_PHOTOS.holsteinCow,
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        title: "Մսատու ցուլ՝ Արաբուղաղ, Լոռի",
        description:
          "Լավ մարմնակազմությամբ ցուլ՝ բազմացման և մսի համար։ Խաղաղ բնավորություն, կերակրվել է խոտով և խտանյութով։ Կարող եք տեսնել տնտեսությունում։",
        animalType: "BULL",
        breed: "Arabughal",
        sex: "MALE",
        ageValue: 3,
        ageUnit: "YEARS",
        weightKg: 720,
        quantity: 1,
        purpose: "BREEDING",
        vaccinated: true,
        healthNotes: "Առողջ, վերջին զննում՝ հուլիս 2026",
        priceAmd: 950_000,
        priceNegotiable: true,
        priceMode: "LOT",
        marzId: "Lori",
        villageId: v.vanadzor,
        phone: farmer2.phone!,
        whatsapp: farmer2.phone!,
        imageUrls: ANIMAL_PHOTOS.beefBull,
        userId: farmer2.id,
        status: "ACTIVE",
      },
      {
        title: "Ոչխարների երամակ՝ 45 գլուխ, Շիրակ",
        description:
          "Խառը երամակ՝ մայրեր և գառներ։ Հիմնականում մսի և բրդի նպատակով։ Ամբողջական խումբով վաճառք՝ ավելի շահավետ։ Առողջական վիճակը լավ է։",
        animalType: "SHEEP",
        breed: "Local mix",
        sex: "MIXED",
        ageValue: 18,
        ageUnit: "MONTHS",
        quantity: 45,
        purpose: "MEAT",
        vaccinated: true,
        priceAmd: 6_500_000,
        priceNegotiable: true,
        priceMode: "LOT",
        marzId: "Shirak",
        villageId: v.gyumri,
        phone: farmer4.phone!,
        whatsapp: farmer4.phone!,
        imageUrls: ANIMAL_PHOTOS.sheepFlock,
        userId: farmer4.id,
        status: "ACTIVE",
      },
      {
        title: "Կաթնատու այծեր՝ Զաանեն, Կոտայք",
        description:
          "Ութ Զաանեն այծեր՝ կայուն կաթնատվությամբ։ Հարմար է փոքր ֆերմայի կամ ընտանեկան տնտեսության համար։ Պատվաստումներ արված։",
        animalType: "GOAT",
        breed: "Saanen",
        sex: "FEMALE",
        ageValue: 2,
        ageUnit: "YEARS",
        weightKg: 55,
        quantity: 8,
        purpose: "DAIRY",
        vaccinated: true,
        healthNotes: "Կաթնատվություն՝ օրական 2–3.5 լ",
        priceAmd: 220_000,
        priceNegotiable: false,
        priceMode: "PER_HEAD",
        marzId: "Kotayk",
        villageId: v.abovyan,
        phone: farmer.phone!,
        imageUrls: ANIMAL_PHOTOS.saanenGoat,
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        title: "Խոզեր՝ մսատու երիտասարդներ, Արմավիր",
        description:
          "Տասը երիտասարդ խոզ՝ մսի համար։ Կերակրված են ստանդարտ ռացիոնով։ Վաճառքը՝ խմբով։ Հնարավոր է տեսնել գոմում։",
        animalType: "PIG",
        breed: "Landrace mix",
        sex: "MIXED",
        ageValue: 5,
        ageUnit: "MONTHS",
        weightKg: 70,
        quantity: 10,
        purpose: "MEAT",
        vaccinated: true,
        priceAmd: 1_200_000,
        priceNegotiable: true,
        priceMode: "LOT",
        marzId: "Armavir",
        villageId: v.vagharshapat,
        phone: farmer3.phone!,
        whatsapp: farmer3.phone!,
        imageUrls: ANIMAL_PHOTOS.meatPig,
        userId: farmer3.id,
        status: "ACTIVE",
      },
      {
        title: "Աշխատանքային ձի՝ Վայոց ձոր",
        description:
          "Ուժեղ աշխատանքային ձի՝ դաշտային և լեռնային աշխատանքների համար։ Հանգիստ բնավորություն, սովոր է լծկանի։ Առողջ է, պայտերը կարգին։",
        animalType: "HORSE",
        breed: "Local work",
        sex: "MALE",
        ageValue: 7,
        ageUnit: "YEARS",
        weightKg: 480,
        quantity: 1,
        purpose: "WORK",
        vaccinated: true,
        documentsNote: "Սեփականության փաստաթուղթ կա",
        priceAmd: 1_100_000,
        priceNegotiable: true,
        priceMode: "LOT",
        marzId: "VayotsDzor",
        villageId: v.areni,
        phone: farmer5.phone!,
        whatsapp: farmer5.phone!,
        imageUrls: ANIMAL_PHOTOS.workHorse,
        userId: farmer5.id,
        status: "ACTIVE",
      },
      {
        title: "Հավեր՝ ձվատու երամակ, Գեղարքունիք",
        description:
          "120 ձվատու հավ՝ լավ արտադրողականությամբ։ Վանդակային/ազատ պահման փորձով։ Վաճառվում է որպես խումբ։",
        animalType: "CHICKEN",
        breed: "Laying mix",
        sex: "FEMALE",
        ageValue: 10,
        ageUnit: "MONTHS",
        quantity: 120,
        purpose: "OTHER",
        vaccinated: true,
        healthNotes: "Ձվատվություն՝ ~70%",
        priceAmd: 480_000,
        priceNegotiable: true,
        priceMode: "LOT",
        marzId: "Gegharkunik",
        villageId: v.sevan,
        phone: farmer3.phone!,
        imageUrls: ANIMAL_PHOTOS.layingChicken,
        userId: farmer3.id,
        status: "ACTIVE",
      },
      {
        title: "Մեղվաընտանիքներ՝ 20 փեթակ, Տավուշ",
        description:
          "Ուժեղ մեղվաընտանիքներ՝ աշնանային մեղրի սեզոնից հետո։ Փեթակները ստանդարտ են։ Հարմար է սկսնակ և փորձառու մեղվապահի համար։",
        animalType: "BEE_COLONY",
        breed: "Carnica mix",
        sex: "MIXED",
        ageValue: 1,
        ageUnit: "YEARS",
        quantity: 20,
        purpose: "OTHER",
        vaccinated: false,
        healthNotes: "Ուժեղ ընտանիքներ, աշնանային ստուգում անցած",
        priceAmd: 90_000,
        priceNegotiable: true,
        priceMode: "PER_HEAD",
        marzId: "Tavush",
        villageId: v.ijevan,
        phone: farmer5.phone!,
        whatsapp: farmer5.phone!,
        imageUrls: ANIMAL_PHOTOS.beeColony,
        userId: farmer5.id,
        status: "ACTIVE",
      },
      {
        title: "Հովվաշուն՝ Կովկասյան, Սյունիք",
        description:
          "Երիտասարդ Կովկասյան հովվաշուն՝ հոտի և տնտեսության պահպանության համար։ Պատվաստված է, սովոր է գյուղական միջավայրին։",
        animalType: "DOG",
        breed: "Caucasian Shepherd",
        sex: "MALE",
        ageValue: 14,
        ageUnit: "MONTHS",
        weightKg: 45,
        quantity: 1,
        purpose: "WORK",
        vaccinated: true,
        pedigreeNote: "Ծնողները՝ աշխատանքային գծից",
        priceAmd: 250_000,
        priceNegotiable: false,
        priceMode: "LOT",
        marzId: "Syunik",
        villageId: v.goris,
        phone: farmer2.phone!,
        whatsapp: farmer2.phone!,
        imageUrls: ANIMAL_PHOTOS.guardDog,
        userId: farmer2.id,
        status: "ACTIVE",
      },
    ],
  });

  // —— Unified catalog marketplace (fertilizer, seed, feed, chemical, tool, land, natural products) ——
  const catFertNpk = await prisma.catalogListing.create({
    data: {
      category: "FERTILIZER",
      subtype: "NPK",
      title: "NPK 15-15-15 · 50 կգ պարկեր",
      description:
        "Հանքային NPK 15-15-15՝ դաշտային մշակույթների համար։ Պարկերով 50 կգ։ Պահեստը՝ Կոտայքում։ Մանրամասն բաղադրությունը՝ պիտակի վրա։",
      brand: "AgroMix",
      specsJson: JSON.stringify({ composition: "N-P-K", npkRatio: "15-15-15" }),
      quantity: 12,
      unit: "ton",
      packageSize: "50 kg",
      priceAmd: 220_000,
      priceNegotiable: true,
      priceUnit: "PER_KG",
      marzId: "Kotayk",
      villageId: v.abovyan,
      phone: shop.phone!,
      whatsapp: shop.phone!,
      imageUrls: photos("catalog/npk-fertilizer.jpg"),
      userId: shop.id,
    },
  });

  await prisma.catalogListing.createMany({
    data: [
      {
        category: "FERTILIZER",
        subtype: "UREA",
        title: "Միզանյութ (urea) · մեծածախ",
        description: "Ազոտական պարարտանյութ ցորենի և բանջարեղենի համար։ Առաքում հնարավոր է մարզեր։",
        brand: "Uralchem",
        specsJson: JSON.stringify({ composition: "Urea 46% N", npkRatio: "46-0-0" }),
        quantity: 8,
        unit: "ton",
        packageSize: "50 kg",
        priceAmd: 195_000,
        priceNegotiable: true,
        priceUnit: "PER_KG",
        marzId: "Armavir",
        villageId: v.vagharshapat,
        phone: shop.phone!,
        imageUrls: photos("catalog/urea-fertilizer.jpg"),
        userId: shop.id,
        status: "ACTIVE",
      },
      {
        category: "FERTILIZER",
        subtype: "COMPOST",
        title: "Օրգանական կոմպոստ · 1 տ պարկեր",
        description: "Հասունացած կոմպոստ այգիների և ջերմոցների համար։ Առանց քիմիական հավելումների։",
        brand: "Local Compost",
        specsJson: JSON.stringify({ composition: "Organic compost", npkRatio: "—" }),
        quantity: 40,
        unit: "ton",
        packageSize: "1 ton",
        priceAmd: 35_000,
        priceNegotiable: false,
        priceUnit: "LOT",
        marzId: "Ararat",
        villageId: v.masis,
        phone: farmer.phone!,
        whatsapp: farmer.phone!,
        imageUrls: photos("catalog/compost.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        category: "SEED",
        subtype: "WHEAT",
        title: "Ցորենի սերմ · ծլունակություն 92%",
        description: "Սերտիֆիկացված ցորենի սերմ աշնանային ցանքի համար։ Պահեստը չոր է։",
        brand: "Shirak Seed",
        specsJson: JSON.stringify({ crop: "wheat", germinationPct: 92, certified: true }),
        quantity: 5,
        unit: "ton",
        packageSize: "25 kg",
        priceAmd: 280_000,
        priceNegotiable: true,
        priceUnit: "PER_KG",
        marzId: "Shirak",
        villageId: v.gyumri,
        phone: provider2.phone!,
        imageUrls: photos("catalog/wheat-seed.jpg"),
        userId: provider2.id,
        status: "ACTIVE",
      },
      {
        category: "SEED",
        subtype: "TOMATO",
        title: "Լոլիկի տնկիներ · բաց դաշտ",
        description: "Ուժեղ տնկիներ՝ բաց դաշտի համար։ Կարող եք վերցնել Մասիսից։",
        brand: "Masis Nursery",
        specsJson: JSON.stringify({ crop: "tomato", germinationPct: null, certified: false }),
        quantity: 2000,
        unit: "piece",
        packageSize: "tray",
        priceAmd: 80,
        priceNegotiable: true,
        priceUnit: "LOT",
        marzId: "Ararat",
        villageId: v.masis,
        phone: farmer.phone!,
        imageUrls: photos("catalog/tomato-seedlings.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        category: "FEED",
        subtype: "HAY",
        title: "Ալպիական խոտ · 20 տ",
        description: "Չոր ալպիական խոտ ոչխարների և խոշոր եղջերավորների համար։",
        brand: null,
        specsJson: JSON.stringify({ forAnimals: "sheep, cattle", proteinPct: 12 }),
        quantity: 20,
        unit: "ton",
        packageSize: "bale",
        priceAmd: 90_000,
        priceNegotiable: true,
        priceUnit: "LOT",
        marzId: "Gegharkunik",
        villageId: v.sevan,
        phone: farmer3.phone!,
        imageUrls: photos("catalog/hay-bales.jpg"),
        userId: farmer3.id,
        status: "ACTIVE",
      },
      {
        category: "CHEMICAL",
        subtype: "FUNGICIDE",
        title: "Ֆունգիցիդ այգիների համար",
        description:
          "Դաշտային/այգու ֆունգիցիդ։ Հետևեք պիտակի հրահանգներին։ Սա բժշկական խորհուրդ չէ։",
        brand: "CropGuard",
        specsJson: JSON.stringify({
          activeIngredient: "See label",
          caution: "Use PPE; follow label",
        }),
        quantity: 200,
        unit: "liter",
        packageSize: "5 L",
        priceAmd: 12_000,
        priceNegotiable: false,
        priceUnit: "PER_LITER",
        marzId: "VayotsDzor",
        villageId: v.areni,
        phone: farmer4.phone!,
        imageUrls: photos("catalog/fungicide.jpg"),
        userId: farmer4.id,
        status: "ACTIVE",
      },
      {
        category: "TOOL",
        subtype: "IRRIGATION",
        title: "Կաթիլային ոռոգման հավաքածու · 1 հա",
        description: "Կաթիլային գծեր, ֆիլտր և կցորդներ՝ մոտ 1 հա-ի համար։",
        brand: "DripArm",
        specsJson: JSON.stringify({ condition: "new", material: "PE" }),
        quantity: 5,
        unit: "piece",
        packageSize: "kit",
        priceAmd: 450_000,
        priceNegotiable: true,
        priceUnit: "LOT",
        marzId: "Armavir",
        villageId: v.metsamor,
        phone: shop.phone!,
        imageUrls: photos("catalog/drip-irrigation.jpg"),
        userId: shop.id,
        status: "ACTIVE",
      },
      {
        category: "LAND",
        subtype: "ARABLE",
        title: "2.5 հա վարելահող՝ ոռոգմամբ, Արարատ",
        description: "Վաճառք։ Ոռոգման հասանելիություն կա։ Հարմար է բանջարեղենի համար։",
        brand: null,
        specsJson: JSON.stringify({
          hectares: 2.5,
          waterAccess: "canal",
          dealType: "sale",
          soilNote: "loam",
        }),
        quantity: 2.5,
        unit: "ha",
        priceAmd: 18_000_000,
        priceNegotiable: true,
        priceUnit: "PER_HA",
        marzId: "Ararat",
        villageId: v.artashat,
        phone: farmer.phone!,
        whatsapp: farmer.phone!,
        imageUrls: photos("catalog/farmland.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        category: "NATURAL_PRODUCT",
        subtype: "FLAX_OIL",
        title: "Կտավատի ձեթ · սառը մամլված · 1 լ",
        description:
          "Տնային սառը մամլված կտավատի ձեթ։ Պահվում է մութ տեղում։ Հարմար է խոհանոցի և առողջ սննդի համար։ Կարող եք վերցնել Արարատից կամ առաքել մարզեր։",
        brand: "Geghama Flax",
        specsJson: JSON.stringify({ origin: "Gegharkunik", organic: true, homemade: true }),
        quantity: 80,
        unit: "liter",
        packageSize: "1 L",
        priceAmd: 4_500,
        priceNegotiable: true,
        priceUnit: "PER_LITER",
        marzId: "Gegharkunik",
        villageId: v.sevan,
        phone: farmer3.phone!,
        whatsapp: farmer3.phone!,
        imageUrls: photos("crops/wheat.jpg"),
        userId: farmer3.id,
        status: "ACTIVE",
      },
      {
        category: "NATURAL_PRODUCT",
        subtype: "SUNFLOWER_OIL",
        title: "Արևածաղկի ձեթ · սառը մամլված · 5 լ",
        description:
          "Տեղական արևածաղկի ձեթ՝ սառը մամլումով։ Խոշոր փաթեթավորում՝ ընտանիքի և խանութների համար։",
        brand: null,
        specsJson: JSON.stringify({ origin: "Armavir", organic: false, homemade: true }),
        quantity: 40,
        unit: "liter",
        packageSize: "5 L",
        priceAmd: 3_200,
        priceNegotiable: true,
        priceUnit: "PER_LITER",
        marzId: "Armavir",
        villageId: v.metsamor,
        phone: farmer.phone!,
        imageUrls: photos("crops/wheat.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
      {
        category: "NATURAL_PRODUCT",
        subtype: "HONEY",
        title: "Լեռնային մեղր · 1 կգ բանկա",
        description:
          "Լեռնային ծաղկային մեղր՝ Վայոց ձորից։ Առանց շաքարի հավելումների։ Կարող եք պատվիրել մի քանի բանկա։",
        brand: "Areni Bees",
        specsJson: JSON.stringify({ origin: "VayotsDzor", organic: true, homemade: true }),
        quantity: 60,
        unit: "kg",
        packageSize: "1 kg",
        priceAmd: 6_500,
        priceNegotiable: false,
        priceUnit: "PER_KG",
        marzId: "VayotsDzor",
        villageId: v.areni,
        phone: farmer4.phone!,
        whatsapp: farmer4.phone!,
        imageUrls: photos("crops/honey.jpg"),
        userId: farmer4.id,
        status: "ACTIVE",
      },
      {
        category: "NATURAL_PRODUCT",
        subtype: "PRESERVE",
        title: "Ծիրանի մուրաբա · 0.7 լ",
        description: "Տնային ծիրանի մուրաբա՝ առանց արհեստական ներկերի։ Սեզոնային արտադրանք։",
        brand: null,
        specsJson: JSON.stringify({ origin: "Ararat", organic: false, homemade: true }),
        quantity: 50,
        unit: "piece",
        packageSize: "0.7 L jar",
        priceAmd: 2_200,
        priceNegotiable: true,
        priceUnit: "LOT",
        marzId: "Ararat",
        villageId: v.masis,
        phone: farmer.phone!,
        imageUrls: photos("crops/peach.jpg"),
        userId: farmer.id,
        status: "ACTIVE",
      },
    ],
  });

  const firstMachine = await prisma.machineryListing.findFirst({ orderBy: { createdAt: "asc" } });
  const firstAnimal = await prisma.animalListing.findFirst({ orderBy: { createdAt: "asc" } });

  await prisma.comment.createMany({
    data: [
      {
        targetType: "CATALOG",
        targetId: catFertNpk.id,
        body: "Կարո՞ղ եմ վերցնել 2 տոննա այս շաբաթ։",
        rating: 5,
        userId: farmer.id,
      },
      {
        targetType: "CATALOG",
        targetId: catFertNpk.id,
        body: "Որակը լավ է, առաքումը ճշգրիտ էր։",
        rating: 4,
        userId: farmer2.id,
      },
      ...(firstMachine
        ? [
            {
              targetType: "MACHINERY" as const,
              targetId: firstMachine.id,
              body: "Մոտորաժամը հաստատվա՞ծ է սպասարկման գրքույկով։",
              rating: 4,
              userId: buyer.id,
            },
          ]
        : []),
      ...(firstAnimal
        ? [
            {
              targetType: "ANIMAL" as const,
              targetId: firstAnimal.id,
              body: "Կարելի՞ է տեսնել տնտեսությունում հանգստյան օրը։",
              rating: 5,
              userId: buyerB.id,
            },
          ]
        : []),
    ],
  });

  // —— Farm Passport demos: reviews + product batches ——
  await prisma.farmReview.createMany({
    data: [
      {
        farmUserId: farmer.id,
        fromUserId: buyer.id,
        rating: 5,
        body: "Պահպանեց ժամկետը և որակը — կրկին կաշխատենք։",
      },
      {
        farmUserId: farmer.id,
        fromUserId: buyerB.id,
        rating: 5,
        body: "Հստակ քանակ, լավ կապ։",
      },
      {
        farmUserId: farmer.id,
        fromUserId: factory.id,
        rating: 4,
        body: "Լավ գործարք գործարանի համար։",
      },
      {
        farmUserId: farmer2.id,
        fromUserId: shop.id,
        rating: 5,
        body: "Լոռու խնձոր — կայուն մատակարար։",
      },
      {
        farmUserId: farmer2.id,
        fromUserId: buyer.id,
        rating: 4,
      },
      {
        farmUserId: farmerArmavir.id,
        fromUserId: exporter.id,
        rating: 3,
        body: "Քանակը լավ էր, ժամկետը մի փոքր ուշ։",
      },
    ],
  });

  const armavirFh = await prisma.futureHarvest.findFirst({
    where: { userId: farmerArmavir.id, status: "ACTIVE" },
  });
  if (armavirFh) {
    await prisma.preOffer.create({
      data: {
        futureHarvestId: armavirFh.id,
        fromUserId: exporter.id,
        qtyWanted: 20,
        message: "Արտահանում — 20 տ",
        status: "RESERVED",
      },
    });
  }

  const levonSold = await prisma.futureHarvest.findFirst({
    where: { userId: farmer2.id },
  });
  if (levonSold) {
    await prisma.futureHarvest.update({
      where: { id: levonSold.id },
      data: { status: "SOLD" },
    });
  }

  await prisma.productBatch.createMany({
    data: [
      {
        batchCode: "TOMATO-AR-2026-00182",
        userId: farmer.id,
        productId: bySlug.tomato,
        plotId: plotTomato.id,
        futureHarvestId: tomatoFuture.id,
        qtyTons: 40,
        harvestDate: new Date("2026-09-05"),
        publishedAt: new Date("2026-08-20"),
        note: "Մասիսի լոլիկ — առաջին խմբաքանակ",
        status: "PUBLISHED",
      },
      {
        batchCode: "TOMATO-AR-2026-00183",
        userId: farmer.id,
        productId: bySlug.tomato,
        plotId: plotTomato.id,
        qtyTons: 25,
        harvestDate: new Date("2026-09-12"),
        note: "Երկրորդ խմբաքանակ",
        status: "PUBLISHED",
      },
      {
        batchCode: "APPLE-AR-2026-00041",
        userId: farmer2.id,
        productId: bySlug.apple,
        qtyTons: 12,
        harvestDate: new Date("2026-10-01"),
        note: "Լոռու խնձոր",
        status: "PUBLISHED",
      },
      {
        batchCode: "TOMATO-AR-2026-00201",
        userId: farmerArmavir.id,
        productId: bySlug.tomato,
        qtyTons: 30,
        harvestDate: new Date("2026-08-25"),
        status: "PUBLISHED",
      },
    ],
  });

  // Farm tools MVP demo (spaces, returns, journey, village goal)
  const farmerVillageId = farmer.villageId;
  if (farmerVillageId) {
    await prisma.spaceListing.createMany({
      data: [
        {
          title: "Cold room 40 t",
          description: "Demo cold storage near Ararat.",
          spaceType: "COLD",
          area: 120,
          capacityNote: "40 t",
          priceAmd: 250000,
          marzId: farmer.marzId || "Ararat",
          villageId: farmerVillageId,
          phone: farmer.phone || "",
          userId: farmer.id,
        },
        {
          title: "Empty greenhouse bay",
          description: "Unused bay for seedlings.",
          spaceType: "GREENHOUSE",
          area: 200,
          marzId: farmer.marzId || "Ararat",
          villageId: farmerVillageId,
          phone: farmer.phone || "",
          userId: farmer.id,
        },
      ],
    });
    await prisma.villageGoal.create({
      data: {
        villageId: farmerVillageId,
        title: "Shared cold storage — 200 t",
        targetQty: 200,
        unit: "ton",
        progressQty: 45,
      },
    });
  }
  await prisma.returnCapacityOffer.create({
    data: {
      userId: farmer.id,
      fromNote: "Yerevan market",
      toNote: "Ararat villages",
      fromMarzId: "Yerevan",
      toMarzId: "Ararat",
      freeTons: 12,
      priceAmd: 40000,
      departAt: new Date(Date.now() + 2 * 86400000),
      capacityNote: "12 t free return",
      phone: farmer.phone,
    },
  });
  await prisma.cropJourney.create({
    data: {
      userId: farmer.id,
      cropName: "Tomato",
      seasonYear: new Date().getFullYear(),
      stagesJson: JSON.stringify([
        { id: "s1", title: "Seed", costAmd: 120000 },
        { id: "s2", title: "Plant", costAmd: 80000 },
        { id: "s3", title: "Care", costAmd: 200000 },
        { id: "s4", title: "Harvest", costAmd: 150000 },
        { id: "s5", title: "Sell", costAmd: 40000 },
      ]),
      totalCostAmd: 590000,
      yieldKg: 4500,
      revenueAmd: 900000,
    },
  });
  await prisma.farmExpense.createMany({
    data: [
      { userId: farmer.id, category: "diesel", amountAmd: 85000, note: "Seed demo" },
      { userId: farmer.id, category: "labor", amountAmd: 120000, note: "Seed demo" },
      { userId: farmer.id, category: "water", amountAmd: 35000, note: "Seed demo" },
    ],
  });

  console.log({
    marzes: await prisma.marz.count(),
    villages: await prisma.village.count(),
    villagesWithCoords: await prisma.village.count({ where: { NOT: { lat: null } } }),
    plots: await prisma.plot.count(),
    tasks: await prisma.plotTask.count(),
    futureHarvests: await prisma.futureHarvest.count(),
    preOffers: await prisma.preOffer.count(),
    demands: await prisma.demand.count(),
    supplies: await prisma.supply.count(),
    jobRequests: await prisma.jobRequest.count(),
    providers: await prisma.serviceProvider.count(),
    campaigns: await prisma.groupBuyCampaign.count(),
    machinery: await prisma.machineryListing.count(),
    animals: await prisma.animalListing.count(),
    catalog: await prisma.catalogListing.count(),
    comments: await prisma.comment.count(),
    productBatches: await prisma.productBatch.count(),
    farmReviews: await prisma.farmReview.count(),
    spaceListings: await prisma.spaceListing.count(),
    returnOffers: await prisma.returnCapacityOffer.count(),
  });
  console.log("Demo: farmer@demo.am / password123 — plot → forecast → demand → pre-sale");
  console.log("Farm tools: /hy/farm — risks, diary, costs, spaces, returns, score");
  console.log("For production-like setup: npm run db:seed:minimal && npm run admin:promote");
  console.log("Farm passport: /hy/farms/AR-002184 (farmer@demo.am)");
  console.log("Batch: /hy/batches/TOMATO-AR-2026-00182");
  console.log("Machinery: /hy/machinery — John Deere, MTZ, Case, Claas…");
  console.log("Animals: /hy/animals — cows, sheep, goats, bees…");
  console.log("Shop: /hy/shop/fertilizers, /hy/shop/natural-products, … + comments on detail pages");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
