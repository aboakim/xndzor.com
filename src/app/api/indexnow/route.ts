import { NextResponse } from "next/server";
import { MARZES } from "@/lib/places";
import { resolveSiteUrl } from "@/lib/site-url";

/** Public IndexNow key (also served as /{key}.txt). Not a secret. */
export const INDEXNOW_KEY = "xndzor-armenia-index-2026";

const LOCALES = ["hy", "ru", "en"] as const;

/** Build high-priority URLs for IndexNow (homes, regions, main boards). */
export function indexNowPriorityUrls(site = resolveSiteUrl()): string[] {
  const urls: string[] = [site, `${site}/sitemap.xml`];
  for (const locale of LOCALES) {
    urls.push(`${site}/${locale}`);
    urls.push(`${site}/${locale}/regions`);
    urls.push(`${site}/${locale}/supply`);
    urls.push(`${site}/${locale}/demand`);
    urls.push(`${site}/${locale}/forward`);
    for (const marz of MARZES) {
      urls.push(`${site}/${locale}/regions/${marz}`);
    }
  }
  return urls;
}

export async function submitIndexNow(urls: string[]): Promise<{
  ok: boolean;
  status: number;
  body: string;
}> {
  const site = resolveSiteUrl();
  const host = new URL(site).host;
  const keyLocation = `${site}/${INDEXNOW_KEY}.txt`;
  const chunk = urls.slice(0, 10000);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation,
      urlList: chunk,
    }),
  });

  const body = await res.text().catch(() => "");
  return { ok: res.ok || res.status === 202, status: res.status, body };
}

/**
 * POST /api/indexnow — submit region + board URLs to IndexNow.
 * Optional bearer: INDEXNOW_SUBMIT_SECRET (if set, required).
 * Without secret, still allowed (key is public; rate-limit via CDN).
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
