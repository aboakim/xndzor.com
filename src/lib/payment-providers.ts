import { isDemoModeAllowed, isStripeConfigured } from "./pricing";
import { isIdramConfigured } from "./payments/idram";
import { isTelcellConfigured } from "./payments/telcell";
import { isBankTransferConfigured } from "./payments/bank-transfer";

export type LocalPaymentProvider = "idram" | "telcell" | "bank";

export type PaymentMethodId =
  | "stripe"
  | "visa"
  | "mastercard"
  | "arca"
  | "idram"
  | "telcell"
  | "bank";

export type PaymentMethod = {
  id: PaymentMethodId;
  /** Display label (brand name) */
  label: string;
  /** Short badge text for pill UI */
  badge: string;
  /** CSS modifier for badge styling */
  variant: string;
  /** Shown in footer / checkout when method is available today */
  active: boolean;
  /** Optional note (e.g. "via Stripe") */
  noteKey?: string;
};

/** At least one real payment provider is configured. */
export function isAnyPaymentConfigured(): boolean {
  return (
    isStripeConfigured() ||
    isIdramConfigured() ||
    isTelcellConfigured() ||
    isBankTransferConfigured()
  );
}

export function isLocalProviderEnabled(provider: LocalPaymentProvider): boolean {
  if (provider === "idram") return isIdramConfigured();
  if (provider === "telcell") return isTelcellConfigured();
  if (provider === "bank") return isBankTransferConfigured();
  return false;
}

/** Default PAYMENT_PROVIDER env — stripe remains primary when set. */
export function getDefaultPaymentProvider(): "stripe" | LocalPaymentProvider {
  const v = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (v === "idram" || v === "telcell" || v === "bank") return v;
  if (isStripeConfigured()) return "stripe";
  if (isIdramConfigured()) return "idram";
  if (isTelcellConfigured()) return "telcell";
  if (isBankTransferConfigured()) return "bank";
  return "stripe";
}

export function getPaymentMethods(): PaymentMethod[] {
  const stripeActive = isStripeConfigured();

  return [
    {
      id: "visa",
      label: "Visa",
      badge: "Visa",
      variant: "visa",
      active: stripeActive,
      noteKey: "viaStripe",
    },
    {
      id: "mastercard",
      label: "Mastercard",
      badge: "MC",
      variant: "mastercard",
      active: stripeActive,
      noteKey: "viaStripe",
    },
    {
      id: "arca",
      label: "ArCa",
      badge: "ArCa",
      variant: "arca",
      active: stripeActive,
      noteKey: "arcaViaStripe",
    },
    {
      id: "idram",
      label: "iDram",
      badge: "iDram",
      variant: "idram",
      active: isIdramConfigured(),
    },
    {
      id: "telcell",
      label: "TelCell",
      badge: "TelCell",
      variant: "telcell",
      active: isTelcellConfigured(),
    },
    {
      id: "bank",
      label: "Bank transfer",
      badge: "Bank",
      variant: "bank",
      active: isBankTransferConfigured(),
    },
  ];
}

/** Methods shown in footer — Visa, MC, ArCa, iDram, TelCell. */
export function getFooterPaymentMethods(): PaymentMethod[] {
  return getPaymentMethods();
}

export function getSocialUrl(
  network: "facebook" | "instagram" | "telegram",
): string {
  const keys = {
    facebook: "NEXT_PUBLIC_SOCIAL_FACEBOOK",
    instagram: "NEXT_PUBLIC_SOCIAL_INSTAGRAM",
    telegram: "NEXT_PUBLIC_SOCIAL_TELEGRAM",
  } as const;
  const v = process.env[keys[network]]?.trim();
  return v || "#";
}

/** Server-side availability for checkout UI (no secrets exposed). */
export function getPaymentAvailability(): {
  stripe: boolean;
  idram: boolean;
  telcell: boolean;
  bank: boolean;
  any: boolean;
  demo: boolean;
} {
  const stripe = isStripeConfigured();
  const idram = isIdramConfigured();
  const telcell = isTelcellConfigured();
  const bank = isBankTransferConfigured();
  const any = stripe || idram || telcell || bank;
  const demo = isDemoModeAllowed();
  return { stripe, idram, telcell, bank, any, demo };
}
