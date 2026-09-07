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

/** Visual assets for feature about pages (paths under /public). */
export const FEATURE_ABOUT_VISUALS = {
  solve: {
    heroSrc: "/features/solve/harvest.webp",
    scenes: [
      { src: "/features/solve/harvest.webp", key: "harvest" as const },
      { src: "/features/solve/transport.webp", key: "transport" as const },
      { src: "/features/solve/market.webp", key: "market" as const },
      { src: "/features/solve/farmwork.webp", key: "farmwork" as const },
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
} as const;
