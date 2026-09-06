/**
 * Monetization price list — edit amounts here (AMD display).
 * Stripe charges in USD (AMD not a Stripe settlement currency for most accounts).
 * Conversion: amountUsdCents = round(amountAmd / AMD_PER_USD * 100)
 *
 * Free launch modes:
 * - PACKAGES_FREE=true → everything free (dev / override)
 * - EARLY_BIRD_FREE_LIMIT=100 → first N registrants free forever; see src/lib/early-bird.ts
 */

export const AMD_PER_USD = 400;

/** Monthly free featured boosts included with Farm Pro */
export const FARM_PRO_BOOST_QUOTA = 3;

/**
 * When true, all packages activate at 0 AMD (skip payment providers).
 * Set PACKAGES_FREE=true to force free for everyone. Otherwise use early-bird logic.
 */
export function arePackagesFree(): boolean {
  const raw = (
    process.env.PACKAGES_FREE ??
    process.env.NEXT_PUBLIC_PACKAGES_FREE ??
    "false"
  )
    .trim()
    .toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on";
}

/** Catalog/list price AMD; 0 when global free mode or user qualifies for early bird. */
export function getEffectiveAmountAmd(
  amountAmd: number,
  userQualifiesFree = false,
): number {
  if (arePackagesFree() || userQualifiesFree) return 0;
  return amountAmd;
}

export type ProductCode =
  | "FARM_PRO_MONTHLY"
  | "FARM_PRO_YEARLY"
  | "BUYER_PRO_MONTHLY"
  | "VERIFIED_FARM_YEARLY"
  | "BOOST_7"
  | "BOOST_30";

export type BoostTargetType =
  | "MACHINERY"
  | "ANIMAL"
  | "CATALOG"
  | "SUPPLY"
  | "FUTURE_HARVEST";

export type PricingProduct = {
  code: ProductCode;
  kind: "FARM_PRO" | "BUYER_PRO" | "VERIFIED_FARM" | "BOOST";
  amountAmd: number;
  /** MONTHLY | YEARLY | ONE_TIME | DAYS_7 | DAYS_30 */
  interval: string;
  /** Period length in days when activating entitlement */
  periodDays: number;
  nameKey: string;
  featuresKey: string;
};

export const PRICING_PRODUCTS: Record<ProductCode, PricingProduct> = {
  FARM_PRO_MONTHLY: {
    code: "FARM_PRO_MONTHLY",
    kind: "FARM_PRO",
    amountAmd: 4900,
    interval: "MONTHLY",
    periodDays: 30,
    nameKey: "pricing.farmPro.name",
    featuresKey: "pricing.farmPro.features",
  },
  FARM_PRO_YEARLY: {
    code: "FARM_PRO_YEARLY",
    kind: "FARM_PRO",
    amountAmd: 49000,
    interval: "YEARLY",
    periodDays: 365,
    nameKey: "pricing.farmPro.name",
    featuresKey: "pricing.farmPro.features",
  },
  BUYER_PRO_MONTHLY: {
    code: "BUYER_PRO_MONTHLY",
    kind: "BUYER_PRO",
    amountAmd: 9900,
    interval: "MONTHLY",
    periodDays: 30,
    nameKey: "pricing.buyerPro.name",
    featuresKey: "pricing.buyerPro.features",
  },
  VERIFIED_FARM_YEARLY: {
    code: "VERIFIED_FARM_YEARLY",
    kind: "VERIFIED_FARM",
    amountAmd: 9900,
    interval: "YEARLY",
    periodDays: 365,
    nameKey: "pricing.verifiedFarm.name",
    featuresKey: "pricing.verifiedFarm.features",
  },
  BOOST_7: {
    code: "BOOST_7",
    kind: "BOOST",
    amountAmd: 1500,
    interval: "DAYS_7",
    periodDays: 7,
    nameKey: "pricing.boost.name7",
    featuresKey: "pricing.boost.features",
  },
  BOOST_30: {
    code: "BOOST_30",
    kind: "BOOST",
    amountAmd: 3900,
    interval: "DAYS_30",
    periodDays: 30,
    nameKey: "pricing.boost.name30",
    featuresKey: "pricing.boost.features",
  },
};

export function amdToUsdCents(amountAmd: number): number {
  if (amountAmd <= 0) return 0;
  return Math.max(50, Math.round((amountAmd / AMD_PER_USD) * 100));
}

export function getProduct(code: string): PricingProduct | null {
  return (PRICING_PRODUCTS as Record<string, PricingProduct>)[code] ?? null;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
}

function isAnyPaymentConfigured(): boolean {
  const idram =
    Boolean(process.env.IDRAM_SECRET_KEY?.trim()) &&
    Boolean(process.env.IDRAM_EDP_REC_ACCOUNT?.trim());
  const telcell =
    Boolean(process.env.TELCELL_MERCHANT_ID?.trim()) &&
    Boolean(process.env.TELCELL_SECRET?.trim());
  return isStripeConfigured() || idram || telcell;
}

/**
 * Demo checkout / banners — off in production.
 * Set DEMO_MODE=true for local demo UX; DEMO_MODE=false for production-like local dev.
 * When unset: demo only if no payment provider is configured (legacy local default).
 */
export function isDemoModeAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const flag = process.env.DEMO_MODE?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !isAnyPaymentConfigured();
}

/**
 * In production, at least one payment provider must be configured —
 * unless packages are free (no charge path).
 * Returns false when checkout must be blocked.
 */
export function requirePaymentInProduction(): boolean {
  if (arePackagesFree()) return true;
  if (process.env.NODE_ENV === "production" && !isAnyPaymentConfigured()) {
    return false;
  }
  return true;
}

/** @deprecated Use requirePaymentInProduction */
export function requireStripeInProduction(): boolean {
  return requirePaymentInProduction();
}

export function isRecurringProduct(code: ProductCode): boolean {
  return code === "FARM_PRO_MONTHLY" || code === "BUYER_PRO_MONTHLY";
}

/** Optional pre-created Stripe Price IDs (Dashboard → Products). Falls back to price_data. */
export function getStripePriceId(code: ProductCode): string | null {
  const envKey = `STRIPE_PRICE_${code}` as keyof NodeJS.ProcessEnv;
  const val = process.env[envKey]?.trim();
  return val || null;
}
