import Stripe from "stripe";
import { isStripeConfigured, requireStripeInProduction } from "./pricing";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  const key = process.env.STRIPE_SECRET_KEY!.trim();
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export { isStripeConfigured, requireStripeInProduction };
