import { EarlyBirdBannerClient } from "@/components/xndzor/EarlyBirdBannerClient";
import { getEarlyBirdUserContext } from "@/lib/early-bird";
import { getSession } from "@/lib/session";
import { arePackagesFree } from "@/lib/pricing";

type Props = {
  variant?: "hero" | "strip";
};

export async function EarlyBirdBanner({ variant = "hero" }: Props) {
  if (arePackagesFree()) return null;

  try {
    const session = await getSession();
    const ctx = await getEarlyBirdUserContext(session?.user?.id);

    if (ctx.stats.freeLimit <= 0) return null;

    const initial = {
      totalRegistered: ctx.stats.earlyBirdClaimed,
      earlyBirdClaimed: ctx.stats.earlyBirdClaimed,
      freeLimit: ctx.stats.freeLimit,
      remaining: ctx.stats.remaining,
      slotsFull: ctx.stats.slotsFull,
      earlyBirdEnabled: true,
      packagesFreeOverride: false,
      showFreePricing: ctx.showFreePricing,
      userEarlyBirdFree: ctx.earlyBirdFree,
      userCheckoutFree: ctx.checkoutFree,
    };

    return <EarlyBirdBannerClient initial={initial} variant={variant} />;
  } catch (error) {
    console.error(
      "[Xndzor] EarlyBirdBanner skipped",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
