/** Category tree for the header mega menu — links map to existing routes. */

export type MegaMenuSub = {
  id: string;
  href: string;
};

export type MegaMenuGroup = {
  /** i18n key under megaMenu.groups.* */
  id: string;
  subs: MegaMenuSub[];
};

export type MegaMenuCategory = {
  id: string;
  href: string;
  /** ActionIcon / category icon key from AgIcons */
  icon: string;
  iconTone: "pine" | "gold" | "sky" | "earth" | "berry" | "leaf" | "rust" | "violet" | "teal";
  groups: MegaMenuGroup[];
};

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
  {
    id: "grow",
    href: "/grow",
    icon: "grow",
    iconTone: "leaf",
    groups: [
      {
        id: "signals",
        subs: [
          { id: "demandBoard", href: "/demand" },
          { id: "overproduction", href: "/grow#grow-signal" },
          { id: "cropRanking", href: "/grow#grow-rankings" },
        ],
      },
      {
        id: "maps",
        subs: [{ id: "marzMap", href: "/grow#grow-map" }],
      },
    ],
  },
  {
    id: "plots",
    href: "/plots",
    icon: "plot",
    iconTone: "earth",
    groups: [
      {
        id: "fields",
        subs: [
          { id: "myPlots", href: "/plots" },
          { id: "addPlot", href: "/plots/new" },
        ],
      },
      {
        id: "harvestTrade",
        subs: [
          { id: "futureHarvest", href: "/forward" },
          { id: "preSell", href: "/forward" },
        ],
      },
    ],
  },
  {
    id: "trade",
    href: "/supply",
    icon: "market",
    iconTone: "gold",
    groups: [
      {
        id: "marketplace",
        subs: [
          { id: "supply", href: "/supply" },
          { id: "demand", href: "/demand" },
        ],
      },
      {
        id: "contracts",
        subs: [
          { id: "forward", href: "/forward" },
          { id: "groupBuy", href: "/group-buy" },
        ],
      },
    ],
  },
  {
    id: "machinery",
    href: "/machinery",
    icon: "machinery",
    iconTone: "rust",
    groups: [
      {
        id: "fieldMachines",
        subs: [
          { id: "tractors", href: "/machinery?type=TRACTOR" },
          { id: "combines", href: "/machinery?type=COMBINE" },
          { id: "cultivators", href: "/machinery?type=CULTIVATOR" },
          { id: "seeders", href: "/machinery?type=SEEDER" },
          { id: "sprayers", href: "/machinery?type=SPRAYER" },
        ],
      },
      {
        id: "transportMachines",
        subs: [
          { id: "trailers", href: "/machinery?type=TRAILER" },
          { id: "trucks", href: "/machinery?type=TRUCK" },
        ],
      },
      {
        id: "partsGroup",
        subs: [{ id: "parts", href: "/machinery?type=OTHER" }],
      },
    ],
  },
  {
    id: "animals",
    href: "/animals",
    icon: "animals",
    iconTone: "berry",
    groups: [
      {
        id: "livestock",
        subs: [
          { id: "cattle", href: "/animals?type=CATTLE" },
          { id: "cows", href: "/animals?type=COW" },
          { id: "bulls", href: "/animals?type=BULL" },
          { id: "sheepGoats", href: "/animals?type=SHEEP" },
          { id: "goats", href: "/animals?type=GOAT" },
          { id: "pigs", href: "/animals?type=PIG" },
          { id: "horses", href: "/animals?type=HORSE" },
        ],
      },
      {
        id: "poultryGroup",
        subs: [
          { id: "poultry", href: "/animals?type=CHICKEN" },
          { id: "turkeys", href: "/animals?type=TURKEY" },
        ],
      },
      {
        id: "beekeeping",
        subs: [{ id: "bees", href: "/animals?type=BEE_COLONY" }],
      },
      {
        id: "otherAnimals",
        subs: [
          { id: "dogs", href: "/animals?type=DOG" },
          { id: "otherAnimalsSub", href: "/animals?type=OTHER" },
        ],
      },
    ],
  },
  {
    id: "inputs",
    href: "/shop/fertilizers",
    icon: "fertilizers",
    iconTone: "teal",
    groups: [
      {
        id: "cropInputs",
        subs: [
          { id: "fertilizers", href: "/shop/fertilizers" },
          { id: "seeds", href: "/shop/seeds" },
          { id: "chemicals", href: "/shop/chemicals" },
        ],
      },
      {
        id: "animalInputs",
        subs: [{ id: "feed", href: "/shop/feed" }],
      },
    ],
  },
  {
    id: "naturalProducts",
    href: "/shop/natural-products",
    icon: "naturalProducts",
    iconTone: "gold",
    groups: [
      {
        id: "farmFood",
        subs: [
          { id: "naturalProducts", href: "/shop/natural-products" },
          { id: "naturalProductsDairy", href: "/shop/natural-products?subtype=MILK" },
          { id: "naturalProductsOils", href: "/shop/natural-products?subtype=FLAX_OIL" },
          { id: "naturalProductsHoney", href: "/shop/natural-products?subtype=HONEY" },
          { id: "naturalProductsOther", href: "/shop/natural-products?subtype=OTHER" },
        ],
      },
    ],
  },
  {
    id: "toolsLand",
    href: "/shop/tools",
    icon: "tools",
    iconTone: "sky",
    groups: [
      {
        id: "equipmentShop",
        subs: [{ id: "tools", href: "/shop/tools" }],
      },
      {
        id: "landShop",
        subs: [{ id: "land", href: "/shop/land" }],
      },
    ],
  },
  {
    id: "jobs",
    href: "/jobs",
    icon: "orderJob",
    iconTone: "violet",
    groups: [
      {
        id: "hire",
        subs: [
          { id: "orderWork", href: "/jobs/new" },
          { id: "providers", href: "/providers" },
        ],
      },
      {
        id: "jobTypes",
        subs: [
          { id: "harvest", href: "/jobs?type=HARVEST" },
          { id: "plow", href: "/jobs?type=PLOW" },
          { id: "spray", href: "/jobs?type=SPRAY" },
          { id: "transport", href: "/jobs?type=TRANSPORT" },
        ],
      },
    ],
  },
  {
    id: "groupBuySection",
    href: "/group-buy",
    icon: "groupBuy",
    iconTone: "gold",
    groups: [
      {
        id: "groupBuyLinks",
        subs: [
          { id: "openCampaigns", href: "/group-buy" },
          { id: "groupBuyAbout", href: "/group-buy/about" },
        ],
      },
    ],
  },
  {
    id: "passport",
    href: "/farms/me",
    icon: "today",
    iconTone: "pine",
    groups: [
      {
        id: "farmOs",
        subs: [
          { id: "farmHub", href: "/farm" },
          { id: "farmRisks", href: "/farm/risks" },
          { id: "farmDiary", href: "/farm/diary" },
          { id: "farmCosts", href: "/farm/costs" },
          { id: "farmSpaces", href: "/farm/spaces" },
          { id: "farmReturns", href: "/farm/returns" },
          { id: "farmScore", href: "/farm/score" },
          { id: "todayCockpit", href: "/today" },
        ],
      },
      {
        id: "farmVillage",
        subs: [
          { id: "farmRadar", href: "/farm/radar" },
          { id: "farmTogether", href: "/farm/together" },
        ],
      },
      {
        id: "trust",
        subs: [
          { id: "qr", href: "/farms/me#farm-qr" },
          { id: "productPassport", href: "/farms/me#farm-batches" },
        ],
      },
      {
        id: "plans",
        subs: [{ id: "pricingTop", href: "/pricing" }],
      },
    ],
  },
];

/** Flat subs helper for prefetch / search. */
export function megaMenuAllSubs(cat: MegaMenuCategory): MegaMenuSub[] {
  return cat.groups.flatMap((g) => g.subs);
}
