import { NextResponse } from "next/server";
import { countOnline } from "@/lib/presence";
import { adminApiGuard } from "@/lib/require-admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const online = await countOnline();
  return NextResponse.json(
    { online },
    { headers: { "Cache-Control": "no-store" } },
  );
}
