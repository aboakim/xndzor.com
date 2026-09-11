/**
 * Monetization price list — edit amounts here (AMD display).
 * Stripe charges in USD (AMD not a Stripe settlement currency for most accounts).
 * Conversion: amountUsdCents = round(amountAmd / AMD_PER_USD * 100)
 *
 * Free launch modes:
 * - PACKAGES_FREE=true → everything free (dev / override)
 * - EARLY_BIRD_FREE_LIMIT=50 → first N users who *claim/activate* a package get free forever
 *   (registration alone does not reduce remaining spots — see src/lib/early-bird.ts)
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
  | "BOOST_30"
  | "URGENT_3"
  | "URGENT_7";

export type BoostTargetType =
  | "MACHINERY"
  | "ANIMAL"
  | "CATALOG"
  | "SUPPLY"
  | "FUTURE_HARVEST";

export type PricingProduct = {
  code: ProductCode;
  kind: "FARM_PRO" | "BUYER_PRO" | "VERIFIED_FARM" | "BOOST" | "URGENT";
  amountAmd: number;
  /** MONTHLY | YEARLY | ONE_TIME | DAYS_7 | DAYS_30 | DAYS_3 */
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
  /** Homepage «Շտապ վաճառք» — badge + dedicated section (Supply only) */
  URGENT_3: {
    code: "URGENT_3",
    kind: "URGENT",
    amountAmd: 1200,
    interval: "DAYS_3",
    periodDays: 3,
    nameKey: "pricing.urgent.name3",
    featuresKey: "pricing.urgent.features",
  },
  URGENT_7: {
    code: "URGENT_7",
    kind: "URGENT",
    amountAmd: 2500,
    interval: "DAYS_7",
    periodDays: 7,
    nameKey: "pricing.urgent.name7",
    featuresKey: "pricing.urgent.features",
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
  const bank =
    Boolean(process.env.OWNER_BANK_ACCOUNT?.trim()) &&
    Boolean(process.env.OWNER_BANK_HOLDER?.trim());
  return isStripeConfigured() || idram || telcell || bank;
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
