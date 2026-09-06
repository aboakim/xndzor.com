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
