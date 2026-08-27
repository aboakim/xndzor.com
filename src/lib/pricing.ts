/**
 * Monetization price list — edit amounts here (AMD display).
 * Stripe charges in USD (AMD not a Stripe settlement currency for most accounts).
 * Conversion: amountUsdCents = round(amountAmd / AMD_PER_USD * 100)
 */

export const AMD_PER_USD = 400;

/** Monthly free featured boosts included with Farm Pro */
export const FARM_PRO_BOOST_QUOTA = 3;

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
