import { NextResponse } from "next/server";
import {
  INDEXNOW_KEY,
  indexNowPriorityUrls,
  submitIndexNow,
} from "@/lib/indexnow";
import { resolveSiteUrl } from "@/lib/site-url";

/**
 * POST /api/indexnow — submit region + board URLs to IndexNow.
 * Optional bearer: INDEXNOW_SUBMIT_SECRET (if set, required).
 */
export async function POST(req: Request) {
  const secret = process.env.INDEXNOW_SUBMIT_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let extra: string[] = [];
  try {
    const json = (await req.json()) as { urls?: string[] };
    if (Array.isArray(json?.urls)) {
      extra = json.urls.filter((u) => typeof u === "string").slice(0, 200);
    }
  } catch {
    /* empty body ok */
  }

  const urls = [...new Set([...indexNowPriorityUrls(), ...extra])];
  const result = await submitIndexNow(urls);
  return NextResponse.json(
    {
      submitted: urls.length,
      status: result.status,
      ok: result.ok,
    },
    { status: result.ok ? 200 : 502 },
  );
}

export async function GET() {
  return NextResponse.json({
    key: INDEXNOW_KEY,
    keyLocation: `${resolveSiteUrl()}/${INDEXNOW_KEY}.txt`,
    sampleCount: indexNowPriorityUrls().length,
  });
}
