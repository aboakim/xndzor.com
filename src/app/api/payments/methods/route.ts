import { NextResponse } from "next/server";
import { getPaymentAvailability } from "@/lib/payment-providers";

/** Public read-only: which payment methods are configured (no secrets). */
export async function GET() {
  return NextResponse.json(getPaymentAvailability());
}
