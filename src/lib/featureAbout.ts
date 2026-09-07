export const FEATURE_ABOUT_SLUGS = [
  "solve",
  "route",
  "grow",
  "passport",
] as const;

export type FeatureAboutSlug = (typeof FEATURE_ABOUT_SLUGS)[number];

export function isFeatureAboutSlug(value: string): value is FeatureAboutSlug {
  return (FEATURE_ABOUT_SLUGS as readonly string[]).includes(value);
}

/** Demo AMD figures used in feature about compare blocks. */
export const FEATURE_ABOUT_EXAMPLE = {
  solve: { before: 420_000, after: 310_000 },
  route: { before: 120_000, after: 48_000 },
  grow: { before: 800_000, after: 0 },
  passport: { before: 150, after: 180 },
} as const;

export const FEATURE_PRIMARY_HREF: Record<FeatureAboutSlug, string> = {
  solve: "/#xndzor-hero",
  route: "/#xndzor-route",
  grow: "/grow",
  passport: "/farms/me",
};

type FeatureVisualPack = {
  heroSrc: string;
  scenes: ReadonlyArray<{ src: string; key: string }>;
  problemImages: readonly string[];
  stepImages: readonly string[];
};

/** Visual assets for feature about pages (paths under /public). */
export const FEATURE_ABOUT_VISUALS: Record<FeatureAboutSlug, FeatureVisualPack> = {
  solve: {
    heroSrc: "/features/solve/harvest.webp",
    scenes: [
      { src: "/features/solve/harvest.webp", key: "harvest" },
      { src: "/features/solve/transport.webp", key: "transport" },
      { src: "/features/solve/market.webp", key: "market" },
      { src: "/features/solve/farmwork.webp", key: "farmwork" },
    ],
    problemImages: [
      "/features/solve/harvest.webp",
      "/features/solve/market.webp",
      "/features/solve/transport.webp",
      "/features/solve/farmwork.webp",
    ],
    stepImages: [
      "/features/solve/farmwork.webp",
      "/features/solve/harvest.webp",
      "/features/solve/transport.webp",
      "/features/solve/market.webp",
    ],
  },
  route: {
    heroSrc: "/features/route/truck.webp",
    scenes: [
      { src: "/features/route/truck.webp", key: "truck" },
      { src: "/features/route/stops.webp", key: "stops" },
      { src: "/features/route/load.webp", key: "load" },
      { src: "/features/route/city.webp", key: "city" },
    ],
    problemImages: [
      "/features/route/truck.webp",
      "/features/route/load.webp",
      "/features/route/stops.webp",
      "/features/route/city.webp",
    ],
    stepImages: [
      "/features/route/load.webp",
      "/features/route/stops.webp",
      "/features/route/truck.webp",
      "/features/route/city.webp",
    ],
  },
  grow: {
    heroSrc: "/features/grow/seedlings.webp",
    scenes: [
      { src: "/features/grow/seedlings.webp", key: "seedlings" },
      { src: "/features/grow/market.webp", key: "market" },
      { src: "/features/grow/decide.webp", key: "decide" },
      { src: "/features/grow/oversupply.webp", key: "oversupply" },
    ],
    problemImages: [
      "/features/grow/oversupply.webp",
      "/features/grow/market.webp",
      "/features/grow/decide.webp",
      "/features/grow/seedlings.webp",
    ],
    stepImages: [
      "/features/grow/market.webp",
      "/features/grow/decide.webp",
      "/features/grow/seedlings.webp",
      "/features/grow/oversupply.webp",
    ],
  },
  passport: {
    heroSrc: "/features/passport/farm.webp",
    scenes: [
      { src: "/features/passport/farm.webp", key: "farm" },
      { src: "/features/passport/qr.webp", key: "qr" },
      { src: "/features/passport/trust.webp", key: "trust" },
      { src: "/features/passport/origin.webp", key: "origin" },
    ],
    problemImages: [
      "/features/passport/trust.webp",
      "/features/passport/farm.webp",
      "/features/passport/qr.webp",
      "/features/passport/origin.webp",
    ],
    stepImages: [
      "/features/passport/farm.webp",
      "/features/passport/trust.webp",
      "/features/passport/qr.webp",
      "/features/passport/origin.webp",
    ],
  },
};

/** Visual assets for /group-buy/about (same layout pattern). */
export const GROUP_BUY_ABOUT_VISUALS: FeatureVisualPack = {
  heroSrc: "/features/group-buy/gather.webp",
  scenes: [
    { src: "/features/group-buy/gather.webp", key: "gather" },
    { src: "/features/group-buy/supplies.webp", key: "supplies" },
    { src: "/features/group-buy/delivery.webp", key: "delivery" },
    { src: "/features/group-buy/deal.webp", key: "deal" },
  ],
  problemImages: [
    "/features/group-buy/supplies.webp",
    "/features/group-buy/gather.webp",
    "/features/group-buy/delivery.webp",
    "/features/group-buy/deal.webp",
  ],
  stepImages: [
    "/features/group-buy/gather.webp",
    "/features/group-buy/supplies.webp",
    "/features/group-buy/deal.webp",
    "/features/group-buy/delivery.webp",
  ],
};
