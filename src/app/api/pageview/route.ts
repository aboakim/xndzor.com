import { NextResponse } from "next/server";
import { isPublicPagePath, recordPageView } from "@/lib/pageviews";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let path = "";
  try {
    const raw = await req.text();
    if (raw) {
      const data = JSON.parse(raw) as { path?: unknown };
      if (typeof data.path === "string") path = data.path.slice(0, 200);
    }
  } catch {
    path = "";
  }

  if (isPublicPagePath(path)) {
    await recordPageView();
  }

  return new NextResponse(null, { status: 204 });
}
