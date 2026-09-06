import { NextResponse } from "next/server";
import { getEarlyBirdStats, getEarlyBirdUserContext } from "@/lib/early-bird";
import { getSession } from "@/lib/session";
import { arePackagesFree } from "@/lib/pricing";

export async function GET() {
  const session = await getSession();
  const ctx = await getEarlyBirdUserContext(session?.user?.id);
  const stats = await getEarlyBirdStats();

  return NextResponse.json({
    totalRegistered: stats.totalRegistered,
    freeLimit: stats.freeLimit,
    remaining: stats.remaining,
    slotsFull: stats.slotsFull,
    earlyBirdClaimed: stats.earlyBirdClaimed,
    packagesFreeOverride: arePackagesFree(),
    earlyBirdEnabled: stats.freeLimit > 0 && !arePackagesFree(),
    showFreePricing: ctx.showFreePricing,
    userEarlyBirdFree: ctx.earlyBirdFree,
    userCheckoutFree: ctx.checkoutFree,
  });
}
