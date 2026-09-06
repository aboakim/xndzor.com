/**
 * Restore missing i18n that drive the Next.js Issues badge:
 * pricing free-mode keys, earlyBird pricing badges, farm hub extras.
 * Run after merge-farm-i18n.js and inject-feature-about-i18n.mjs.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function load(locale) {
  return JSON.parse(
    fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8"),
  );
}
function save(locale, data) {
  fs.writeFileSync(
    path.join(root, "messages", `${locale}.json`),
    JSON.stringify(data, null, 2) + "\n",
  );
}

const pricingExtras = {
  en: {
    ledeFree:
      "All packages are free for now. Activate and use them. Paid packages coming soon.",
    ledeEarlyBird:
      "{remaining} free spots left — register and activate Pro packages at no cost.",
    free: "Free",
    activate: "Activate",
    activateMonth: "Activate · monthly",
    activateYear: "Activate · yearly",
    freeBannerTitle: "Free packages",
    freeBanner:
      "No payment required. Click Activate to unlock. Paid packages coming soon.",
    demoModeTitle: "Demo mode",
    demoModeHint: "Try demo payment",
    offlineNoteFree:
      "Deal amounts stay between parties. Platform packages are free for now.",
  },
  hy: {
    ledeFree:
      "Այժմ բոլոր փաթեթները անվճար են։ Ակտիվացրեք և օգտվեք։ Վճարովի փաթեթները շուտով։",
    ledeEarlyBird:
      "Առաջին {remaining} անվճար տեղը մնացել է — գրանցվեք և ակտիվացրեք Pro փաթեթները անվճար։",
    free: "Անվճար",
    activate: "Ակտիվացնել",
    activateMonth: "Ակտիվացնել · ամիս",
    activateYear: "Ակտիվացնել · տարի",
    freeBannerTitle: "Անվճար փաթեթներ",
    freeBanner:
      "Վճարում չի պահանջվում։ Սեղմեք «Ակտիվացնել»։ Վճարովի փաթեթները շուտով։",
    demoModeTitle: "Դեմո ռեժիմ",
    demoModeHint: "Փորձարկել դեմո վճարում",
    offlineNoteFree:
      "Գործարքի գումարը կողմերի միջև է։ Հարթակի փաթեթներն այժմ անվճար են։",
  },
  ru: {
    ledeFree:
      "Сейчас все пакеты бесплатны. Активируйте и пользуйтесь. Платные пакеты — скоро.",
    ledeEarlyBird:
      "Осталось {remaining} бесплатных мест — зарегистрируйтесь и активируйте Pro бесплатно.",
    free: "Бесплатно",
    activate: "Активировать",
    activateMonth: "Активировать · месяц",
    activateYear: "Активировать · год",
    freeBannerTitle: "Бесплатные пакеты",
    freeBanner:
      "Оплата не нужна. Нажмите «Активировать». Платные пакеты — скоро.",
    demoModeTitle: "Демо-режим",
    demoModeHint: "Попробовать демо-оплату",
    offlineNoteFree:
      "Сумма сделки — между сторонами. Пакеты платформы сейчас бесплатны.",
  },
};

const boostExtras = {
  en: {
    taglineFree: "Activate TOP placement to pin your ad at the top of lists",
    f3Free: "Free for now — no payment",
    fromListingFree:
      "Open your listing → «Boost / Place in TOP» → activate for 7 or 30 days.",
    chooseFree: "Choose TOP duration (free)",
    activate7: "TOP 7 days · Free",
    activate30: "TOP 30 days · Free",
  },
  hy: {
    taglineFree:
      "Ակտիվացրեք թոփ տեղադրումը՝ ձեր հայտարարությունը ցուցակի վերևում տեսնելու համար",
    f3Free: "Այժմ անվճար — վճարում չի պահանջվում",
    fromListingFree:
      "Բացեք ձեր հայտարարությունը → «Խթանել / Թոփում տեղադրել» → ակտիվացրեք 7 կամ 30 օր։",
    chooseFree: "Ընտրեք թոփ տևողությունը (անվճար)",
    activate7: "Թոփ 7 օր · Անվճար",
    activate30: "Թոփ 30 օր · Անվճար",
  },
  ru: {
    taglineFree:
      "Активируйте TOP-размещение, чтобы закрепить объявление вверху списка",
    f3Free: "Сейчас бесплатно — оплата не нужна",
    fromListingFree:
      "Откройте объявление → «Продвинуть / В TOP» → активируйте на 7 или 30 дней.",
    chooseFree: "Выберите срок TOP (бесплатно)",
    activate7: "TOP 7 дней · Бесплатно",
    activate30: "TOP 30 дней · Бесплатно",
  },
};

const verifiedExtras = {
  en: {
    taglineFree: "Verification · ✅ badge (free)",
    f2Free: "Activates immediately after you click Activate",
  },
  hy: {
    taglineFree: "Ստուգում · ✅ նշան (անվճար)",
    f2Free: "Ակտիվանում է անմիջապես «Ակտիվացնել» սեղմելուց հետո",
  },
  ru: {
    taglineFree: "Проверка · ✅ значок (бесплатно)",
    f2Free: "Активируется сразу после нажатия «Активировать»",
  },
};

const earlyBirdExtras = {
  en: {
    pricingBadge: "Early bird — {remaining} spots left",
    pricingBadgeNote: "{registered} / {limit} already registered",
    pricingQualified: "You unlocked free access!",
    pricingQualifiedFull:
      "Activate packages for free — your early bird slot is saved.",
    pricingQualifiedOpen:
      "{remaining} free spots left — activate now.",
  },
  hy: {
    pricingBadge: "Early bird — մնաց {remaining} տեղ",
    pricingBadgeNote: "{registered} / {limit} արդեն գրանցվել է",
    pricingQualified: "Դուք ստացել եք անվճար մուտք!",
    pricingQualifiedFull:
      "Ակտիվացրեք փաթեթները անվճար — ձեր early bird իրավունքը պահպանված է։",
    pricingQualifiedOpen: "Մնաց {remaining} անվճար տեղ — ակտիվացրեք հիմա։",
  },
  ru: {
    pricingBadge: "Early bird — осталось {remaining} мест",
    pricingBadgeNote: "{registered} / {limit} уже зарегистрировались",
    pricingQualified: "Вы получили бесплатный доступ!",
    pricingQualifiedFull:
      "Активируйте пакеты бесплатно — ваш early bird слот сохранён.",
    pricingQualifiedOpen:
      "Осталось {remaining} бесплатных мест — активируйте сейчас.",
  },
};

const farmHubExtras = {
  en: {
    startHere: "Start here",
    startCue: "Most useful tools for today",
    allTools: "All farm tools",
    toolsCue: "Weather, money, storage, village",
    scoreCue: "See what to improve",
  },
  hy: {
    startHere: "Սկսեք այստեղից",
    startCue: "Ամենաօգտակար գործիքները այսօրվա համար",
    allTools: "Բոլոր գործիքները",
    toolsCue: "Եղանակ, փող, պահեստ, գյուղ",
    scoreCue: "Տեսեք ինչ բարելավել",
  },
  ru: {
    startHere: "Начните здесь",
    startCue: "Самые полезные инструменты на сегодня",
    allTools: "Все инструменты фермы",
    toolsCue: "Погода, деньги, склад, село",
    scoreCue: "Смотрите, что улучшить",
  },
};

const farmRadarExtras = {
  en: {
    activityTitle: "Recent pulse",
    activity: {
      harvestPulse: "{n} harvest listings active",
      machinePulse: "{n} machinery offers nearby",
      supplyPulse: "{n} supply posts in village",
    },
  },
  hy: {
    activityTitle: "Վերջին զարկերակ",
    activity: {
      harvestPulse: "{n} ապագա բերքի հայտարարություն",
      machinePulse: "{n} տեխնիկայի առաջարկ մոտակայքում",
      supplyPulse: "{n} առաջարկ գյուղում",
    },
  },
  ru: {
    activityTitle: "Недавний пульс",
    activity: {
      harvestPulse: "{n} объявлений будущего урожая",
      machinePulse: "{n} предложений техники рядом",
      supplyPulse: "{n} предложений в селе",
    },
  },
};

for (const locale of ["hy", "en", "ru"]) {
  const j = load(locale);
  j.pricing = { ...j.pricing, ...pricingExtras[locale] };
  j.pricing.boost = { ...j.pricing.boost, ...boostExtras[locale] };
  j.pricing.verifiedFarm = {
    ...j.pricing.verifiedFarm,
    ...verifiedExtras[locale],
  };
  j.earlyBird = { ...j.earlyBird, ...earlyBirdExtras[locale] };

  if (!j.farm) {
    console.error(locale, "missing farm — run merge-farm-i18n.js first");
    process.exit(1);
  }
  j.farm.hub = { ...j.farm.hub, ...farmHubExtras[locale] };
  j.farm.radar = { ...j.farm.radar, ...farmRadarExtras[locale] };

  save(locale, j);
  console.log(
    locale,
    "patched",
    !!j.pricing.free,
    !!j.earlyBird.pricingBadge,
    !!j.farm.hub.startHere,
    !!j.features?.about?.solve,
  );
}
