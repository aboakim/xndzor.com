import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import locations from "../data/armenia-locations.json";
import { estimateYieldTons } from "../src/lib/yield";
import { buildTodaySuggestions } from "../src/lib/farm-today";

const prisma = new PrismaClient();

const products = [
  { slug: "tomato", nameKey: "products.tomato", sortOrder: 1 },
  { slug: "potato", nameKey: "products.potato", sortOrder: 2 },
  { slug: "grape", nameKey: "products.grape", sortOrder: 3 },
  { slug: "apple", nameKey: "products.apple", sortOrder: 4 },
  { slug: "wheat", nameKey: "products.wheat", sortOrder: 5 },
  { slug: "milk", nameKey: "products.milk", sortOrder: 6 },
  { slug: "honey", nameKey: "products.honey", sortOrder: 7 },
  { slug: "other", nameKey: "products.other", sortOrder: 8 },
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

/** Crop icons (SVG) and machinery photos (JPEG under /seed/machinery/). */
const photos = (...names: string[]) =>
  JSON.stringify(
    names.map((n) => (n.includes("/") ? `/seed/${n}` : `/seed/${n}.svg`))
  );

async function main() {
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
    },
  });
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
      qtyMax: 8000,
      unit: "kg",
      priceMinAmd: 120,
      priceMaxAmd: 220,
      marzId: "Yerevan",
      villageId: v.kentron,
      phone: buyer.phone!,
      userId: buyer.id,
    },
  });

  await prisma.demand.create({
    data: {
      title: "Լոլիկ մեծածախ Կոտայք",
      description: "Պետք է 3–5 տոննա օգոստոսի վերջին։",
      productId: bySlug.tomato,
      qtyMin: 3000,
      qtyMax: 5000,
      unit: "kg",
      priceMinAmd: 140,
      priceMaxAmd: 200,
      marzId: "Kotayk",
      villageId: v.abovyan,
      phone: buyerB.phone!,
      userId: buyerB.id,
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
      marzId: "Armavir",
      villageId: v.vagharshapat,
      phone: shop.phone!,
      userId: shop.id,
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
      marzId: "Ararat",
      villageId: v.masis,
      phone: buyer.phone!,
      userId: buyer.id,
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
      timingNote: "Սեպտեմբեր–հոկտեմբեր",
      neededBy: new Date("2026-10-05"),
      marzId: "Armavir",
      villageId: v.metsamor,
      phone: exporter.phone!,
      whatsapp: exporter.phone!,
      userId: exporter.id,
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
      timingNote: "Ամբողջ տարի",
      marzId: "Gegharkunik",
      villageId: v.gavar,
      phone: shop.phone!,
      userId: shop.id,
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
      marzId: "Lori",
      villageId: v.vanadzor,
      phone: buyerB.phone!,
      userId: buyerB.id,
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
      neededBy: new Date("2026-11-20"),
      marzId: "Tavush",
      villageId: v.ijevan,
      phone: shop.phone!,
      userId: shop.id,
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
      imageUrls: photos("tomato"),
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
      imageUrls: photos("potato"),
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
      imageUrls: photos("apple"),
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
      imageUrls: photos("milk"),
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
      imageUrls: photos("honey"),
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
      imageUrls: photos("grape"),
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
      imageUrls: photos("wheat"),
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
  });
  console.log("Demo: farmer@demo.am / password123 — plot → forecast → demand → pre-sale");
  console.log("Machinery: /hy/machinery — John Deere, MTZ, Case, Claas…");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
