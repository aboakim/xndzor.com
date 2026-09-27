import { NextResponse } from "next/server";
import { touchSession } from "@/lib/presence";

export const dynamic = "force-dynamic";

/** Public-page heartbeat. Admin pages do not call this. */
export async function POST(req: Request) {
  let sessionId = "";
  try {
    const raw = await req.text();
    if (raw) {
      const data = JSON.parse(raw) as { sessionId?: unknown };
      if (typeof data.sessionId === "string") sessionId = data.sessionId.slice(0, 80);
    }
  } catch {
    sessionId = "";
  }

  await touchSession(sessionId);
  return new NextResponse(null, { status: 204 });
}
