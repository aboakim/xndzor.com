/** Inline agricultural glyphs — one visual language for products, jobs, and actions. */

import type { ReactElement, ReactNode } from "react";

type IconProps = {
  className?: string;
  size?: number;
  title?: string;
};

function Svg({
  children,
  className,
  size = 18,
  title,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className ?? "ag-icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconBuy(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 4h2l2.2 11h10.3l2-7H7.2" />
    </Svg>
  );
}

export function IconSell(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v18M8 7h6.5a3 3 0 010 6H9a3 3 0 000 6h7" />
    </Svg>
  );
}

export function IconOrderJob(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </Svg>
  );
}

export function IconDoJob(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 16h11l2-4h3v4" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
      <path d="M5 12V9h4l1.5 3" />
    </Svg>
  );
}

export function IconForward(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 18c2-6 5-10 8-12 3 2 6 6 8 12" />
      <path d="M8 18h8" />
      <path d="M12 6v2" />
    </Svg>
  );
}

export function IconGroupBuy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 10a3 3 0 116 0 3 3 0 01-6 0" />
      <path d="M3.5 19a4.5 4.5 0 019 0" />
      <path d="M16 11a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0" />
      <path d="M14.5 19a3.8 3.8 0 016 0" />
    </Svg>
  );
}

export function IconMatch(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="12" r="4" />
      <circle cx="16" cy="12" r="4" />
    </Svg>
  );
}

export function IconTomato(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 8c-4 0-6.5 3-6.5 7a6.5 6.5 0 0013 0c0-4-2.5-7-6.5-7z" />
      <path d="M12 8c0-2 1.5-3.5 3.5-4M12 8c0-2-1.5-3.5-3.5-4" />
    </Svg>
  );
}

export function IconPotato(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="13" rx="6.5" ry="5" />
      <circle cx="10" cy="12" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="11" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconGrape(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10" cy="10" r="2.2" />
      <circle cx="14" cy="10" r="2.2" />
      <circle cx="12" cy="13.5" r="2.2" />
      <circle cx="9.5" cy="15.5" r="2" />
      <circle cx="14.5" cy="15.5" r="2" />
      <path d="M12 5v3M12 5c1.5-1 3-1 4 0" />
    </Svg>
  );
}

export function IconApple(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 7c-4.5.2-7 3.2-7 7.2S8.5 21 12 21s7-2.6 7-6.8S16.5 7.2 12 7z" />
      <path d="M12 7c0-2 1.2-3.5 3-4M10 4.5c.5 1 1.5 2 2.5 2.5" />
    </Svg>
  );
}

export function IconApricot(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13" r="6" />
      <path d="M12 7V5M10 5.5c1-.8 3-.8 4 0" />
      <path d="M12 9v8" opacity="0.45" />
    </Svg>
  );
}

export function IconPeach(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 8c-4 0-7 3.2-7 7.2S8.2 21 12 21s7-2.6 7-5.8c0-2.2-1.2-4-3-5.2" />
      <path d="M12 8c0-2 1.2-3.5 3-4M9.5 9c1.5-1 3.5-1 5 0" />
    </Svg>
  );
}

export function IconWheat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21V8" />
      <path d="M12 10c-2-1.5-3.5-1.5-5-1M12 13c-2-1.5-3.5-1.5-5-1M12 16c-2-1.5-3.5-1.5-5-1" />
      <path d="M12 10c2-1.5 3.5-1.5 5-1M12 13c2-1.5 3.5-1.5 5-1M12 16c2-1.5 3.5-1.5 5-1" />
      <path d="M12 8c0-2 1-3.5 2.5-4.5" />
    </Svg>
  );
}

export function IconMilk(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 8h8l1 13H7L8 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
      <path d="M9.5 13h5" />
    </Svg>
  );
}

export function IconHoney(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 10h8v10H8z" />
      <path d="M8 14h8M8 17h8" />
      <path d="M10 10V7l2-2 2 2v3" />
    </Svg>
  );
}

/** Bottle for oils / farm food products */
export function IconOil(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 3h4v3l1.5 2v12a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V8L10 6V3z" />
      <path d="M10 11h4" opacity="0.55" />
      <path d="M11 3h2" />
    </Svg>
  );
}

export function IconCucumber(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 14c2-5 5-8 7-8s5 3 7 8-2 7-7 7-9-2-7-7z" />
      <path d="M9 11l1.5 1M12 10l1 1.5M14.5 12l1 1" opacity="0.6" />
    </Svg>
  );
}

export function IconOnion(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21c-3.5 0-5.5-2.8-5.5-6.5S10 8 12 8s5.5 2.8 5.5 6.5S15.5 21 12 21z" />
      <path d="M10 8c0-2.5 1-4.5 2-5.5 1 1 2 3 2 5.5" />
    </Svg>
  );
}

export function IconHay(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="16" rx="7" ry="4" />
      <path d="M6 15c2-3 4-5 6-6 2 1 4 3 6 6" />
      <path d="M9 12c1-2 2-3 3-3.5M15 12c-1-2-2-3-3-3.5" />
    </Svg>
  );
}

export function IconOther(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Svg>
  );
}

export function IconPlow(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 18h7l2-5h4" />
      <path d="M13 13l4 6" />
      <circle cx="7" cy="18" r="2" />
      <path d="M4 10h5l2 3" />
    </Svg>
  );
}

export function IconSow(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 18h16" />
      <path d="M7 18V12M12 18V9M17 18V13" />
      <circle cx="7" cy="10" r="1.5" />
      <circle cx="12" cy="7" r="1.5" />
      <circle cx="17" cy="11" r="1.5" />
    </Svg>
  );
}

export function IconSpray(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 21V10h5v11" />
      <path d="M7 10V7h3" />
      <path d="M14 6c2 0 4 1.5 4 3.5S16 13 14 13" />
      <path d="M15 4l1 1.5M18 5l.5 1.5M19.5 8H21" />
    </Svg>
  );
}

export function IconHarvest(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 17h12l3-5h3" />
      <circle cx="8" cy="19" r="2" />
      <circle cx="16" cy="19" r="2" />
      <path d="M5 12c1.5-4 4-7 7-8 0 3-1 5.5-3 8" />
    </Svg>
  );
}

export function IconTransport(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 16h11V8H3z" />
      <path d="M14 11h4l3 3v2h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  );
}

export function IconPrune(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 4c4 4 6 8 6 12" />
      <path d="M8 8c3 1 5 3 6 6" />
      <path d="M14 14l5 5M15 19l4-4" />
    </Svg>
  );
}

export function IconGreenhouse(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V11l8-7 8 7v9" />
      <path d="M4 11h16" />
      <path d="M12 4v16" />
      <path d="M9 20v-4h6v4" />
    </Svg>
  );
}

export function IconConsult(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 20c1.5-3.5 4-5 6-5s4.5 1.5 6 5" />
      <path d="M16 7h3M17.5 5.5v3" />
    </Svg>
  );
}

/** FarmOS — Today / Plots / ops */
export function IconToday(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M9 14h2M13 14h2M9 17h6" />
    </Svg>
  );
}

export function IconPlot(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 18l4-10 4 4 4-8 4 14H4z" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function IconIrrigate(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3c-2.5 3.5-5 6.2-5 9a5 5 0 0010 0c0-2.8-2.5-5.5-5-9z" />
      <path d="M10 14c.5 1.2 1.2 2 2 2s1.5-.8 2-2" opacity="0.5" />
    </Svg>
  );
}

export function IconFertilize(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 21V10l4-6 4 6v11" />
      <path d="M8 14h8M8 17h8" />
      <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconYield(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 19h16" />
      <path d="M7 19V11M12 19V7M17 19v-5" />
      <path d="M5 11h4M10 7h4M15 14h4" />
    </Svg>
  );
}

export function IconMarket(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 10h16l-1 10H5L4 10z" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </Svg>
  );
}

export function IconMachinery(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="7" cy="17" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
      <path d="M4 17h1.5M9.5 17H12l2-5h4l1.5 5H19.5" />
      <path d="M6 12V8h5l1.5 4" />
      <path d="M11 8h3" />
    </Svg>
  );
}

export function IconAnimals(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="14" rx="6" ry="4" />
      <circle cx="8.5" cy="9" r="2.2" />
      <circle cx="15.5" cy="9" r="2.2" />
      <path d="M7 8.2l-1.5-2M17 8.2l1.5-2" />
      <path d="M10 16.5v2.5M14 16.5v2.5" />
    </Svg>
  );
}

export function IconCow(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="13.5" rx="6.5" ry="4" />
      <circle cx="8" cy="8.5" r="2.3" />
      <path d="M6.2 7.2l-1.4-1.8M9.5 7l1-1.6" />
      <path d="M9.5 16.5v2.2M14.5 16.5v2.2" />
      <circle cx="7.2" cy="8.2" r="0.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconSheep(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 13a6 4.5 0 0112 0" />
      <circle cx="8" cy="9" r="2" />
      <path d="M7 14.5v3M11 15v3M15 14.5v3" />
      <path d="M16 10c1.2 0 2 .8 2 2" />
    </Svg>
  );
}

export function IconBee(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="13" rx="4" ry="3" />
      <path d="M10 12h4M10 14h4" />
      <path d="M8 10c-2-1-3-3-2.5-4.5M16 10c2-1 3-3 2.5-4.5" />
      <path d="M12 10V7" />
    </Svg>
  );
}

export function IconDog(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 11l2-4 3 2 4-1 3 3v5H6z" />
      <path d="M7 16v3M11 16.5v3M15 16v3" />
      <circle cx="8.5" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconTractor(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="M4 17h1M10 17h5l1.5-5H19l1 5" />
      <path d="M5 12V8h6l2 4" />
      <path d="M11 8v-2h3v2" />
    </Svg>
  );
}

export function IconCombine(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="10" width="11" height="6" rx="1" />
      <path d="M14 12h5l2 4H14" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M3 10V7h6v3" />
    </Svg>
  );
}

export function IconTrailer(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="9" width="14" height="6" rx="1" />
      <path d="M18 12h3" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="15" cy="17" r="2" />
    </Svg>
  );
}

export function IconCultivator(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 8h16" />
      <path d="M6 8v8M10 8v10M14 8v8M18 8v10" />
      <path d="M5 16h2M9 18h2M13 16h2M17 18h2" />
    </Svg>
  );
}

export function IconSeeder(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 10h16v4H4z" />
      <path d="M7 14v4M12 14v5M17 14v4" />
      <circle cx="7" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19" r="1" fill="currentColor" stroke="none" />
      <path d="M8 7h8l2 3H6z" />
    </Svg>
  );
}

export function IconTruck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 14h11V8H3z" />
      <path d="M14 11h4l3 3v2h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  );
}

const PRODUCT_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  tomato: IconTomato,
  potato: IconPotato,
  grape: IconGrape,
  apple: IconApple,
  apricot: IconApricot,
  peach: IconPeach,
  wheat: IconWheat,
  milk: IconMilk,
  honey: IconHoney,
  cucumber: IconCucumber,
  onion: IconOnion,
  hay: IconHay,
  other: IconOther,
};

const JOB_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  PLOW: IconPlow,
  SOW: IconSow,
  SPRAY: IconSpray,
  HARVEST: IconHarvest,
  TRANSPORT: IconTransport,
  PRUNE: IconPrune,
  GREENHOUSE: IconGreenhouse,
  CONSULT: IconConsult,
  OTHER: IconOther,
};

const ACTION_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  buy: IconBuy,
  sell: IconSell,
  orderJob: IconOrderJob,
  doJob: IconDoJob,
  forward: IconForward,
  grow: IconForward,
  groupBuy: IconGroupBuy,
  match: IconMatch,
  today: IconToday,
  plot: IconPlot,
  irrigate: IconIrrigate,
  fertilize: IconFertilize,
  yield: IconYield,
  market: IconMarket,
  machinery: IconMachinery,
  animals: IconAnimals,
  fertilizers: IconFertilize,
  seeds: IconSow,
  feed: IconHay,
  chemicals: IconSpray,
  tools: IconOrderJob,
  land: IconPlot,
  naturalProducts: IconOil,
};

const MACHINERY_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  TRACTOR: IconTractor,
  COMBINE: IconCombine,
  TRAILER: IconTrailer,
  CULTIVATOR: IconCultivator,
  SPRAYER: IconSpray,
  TRUCK: IconTruck,
  SEEDER: IconSeeder,
  OTHER: IconMachinery,
};

const ANIMAL_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  CATTLE: IconCow,
  COW: IconCow,
  BULL: IconCow,
  SHEEP: IconSheep,
  GOAT: IconSheep,
  PIG: IconAnimals,
  HORSE: IconAnimals,
  CHICKEN: IconAnimals,
  TURKEY: IconAnimals,
  BEE_COLONY: IconBee,
  DOG: IconDog,
  OTHER: IconAnimals,
};

const FARM_TASK_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  irrigate: IconIrrigate,
  fertilize: IconFertilize,
  spray: IconSpray,
  harvest: IconHarvest,
  check: IconToday,
  plot: IconPlot,
  yield: IconYield,
};

export function FarmTaskIcon({
  kind,
  size = 18,
  className,
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  const Comp = FARM_TASK_ICONS[kind] ?? IconToday;
  return <Comp size={size} className={className ?? "ag-icon"} />;
}

export function ProductIcon({
  slugOrKey,
  size = 18,
  className,
}: {
  slugOrKey: string;
  size?: number;
  className?: string;
}) {
  const slug = slugOrKey.replace(/^products\./, "");
  const Comp = PRODUCT_ICONS[slug] ?? IconOther;
  return <Comp size={size} className={className ?? "ag-icon"} />;
}

export function JobTypeIcon({
  type,
  size = 18,
  className,
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const Comp = JOB_ICONS[type] ?? IconOther;
  return <Comp size={size} className={className ?? "ag-icon"} />;
}

export function MachineryTypeIcon({
  type,
  size = 18,
  className,
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const Comp = MACHINERY_ICONS[type] ?? IconMachinery;
  return <Comp size={size} className={className ?? "ag-icon"} />;
}

export function AnimalTypeIcon({
  type,
  size = 18,
  className,
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const Comp = ANIMAL_ICONS[type] ?? IconAnimals;
  return <Comp size={size} className={className ?? "ag-icon"} />;
}

export function ActionIcon({
  action,
  size = 22,
  className,
}: {
  action: string;
  size?: number;
  className?: string;
}) {
  const Comp = ACTION_ICONS[action] ?? IconOther;
  return <Comp size={size} className={className ?? "ag-icon"} />;
}

/** Label + icon row used in boards, filters, forms */
export function IconLabel({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className ?? "icon-label"}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
