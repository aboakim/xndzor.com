import { NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-admin-api";
import { getTrafficStats } from "@/lib/traffic";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const traffic = await getTrafficStats();
  return NextResponse.json(traffic, {
    headers: { "Cache-Control": "no-store" },
  });
}
