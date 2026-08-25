import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Resource listings removed. Use /api/jobs and /api/providers." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Resource listings removed. Use /api/jobs and /api/providers." },
    { status: 410 }
  );
}
