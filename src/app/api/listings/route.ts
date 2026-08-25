import { NextResponse } from "next/server";

/** Legacy classifieds API — product is now demand/supply matching. */
export async function GET() {
  return NextResponse.json(
    { error: "Listings API removed. Use /api/supply and /api/demand." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Listings API removed. Use /api/supply and /api/demand." },
    { status: 410 }
  );
}
