import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Gone — use job applications" }, { status: 410 });
}
