import { NextResponse } from "next/server";
import { getVillagesForMarz, MARZES } from "@/lib/locations";
import { ensureVillagesForMarz } from "@/lib/ensure-locations";

export async function GET(req: Request) {
  const marzId = new URL(req.url).searchParams.get("marzId");
  if (!marzId) {
    return NextResponse.json({ error: "marzId required" }, { status: 400 });
  }

  // Static catalog is the source of truth (works even when DB was never seeded).
  const villages = getVillagesForMarz(marzId);

  // Best-effort: heal empty production DB so FK writes succeed later.
  if (
    villages.length > 0 &&
    (MARZES as readonly string[]).includes(marzId)
  ) {
    void ensureVillagesForMarz(marzId).catch(() => {});
  }

  return NextResponse.json(villages);
}
