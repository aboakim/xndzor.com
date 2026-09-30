import { NextResponse } from "next/server";
import { countOnline, presenceStorageReady } from "@/lib/presence";
import { adminApiGuard } from "@/lib/require-admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const [online, trackingReady] = await Promise.all([countOnline(), presenceStorageReady()]);
  return NextResponse.json(
    { online, trackingReady },
    { headers: { "Cache-Control": "no-store" } },
  );
}
