import { NextResponse } from "next/server";
import { validateCsrf } from "@/lib/csrf";
import {
  clientIp,
  rateLimitAsync,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-audit";

export async function requireCsrf(
  req: Request,
): Promise<NextResponse | null> {
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }
  return null;
}

export async function enforceRateLimit(
  req: Request,
  key: string,
  opts: { limit: number; windowMs: number },
  path?: string,
): Promise<RateLimitResult> {
  const limited = await rateLimitAsync(key, opts);
  if (!limited.ok) {
    await logSecurityEvent({
      type: "rate_limit_block",
      ip: clientIp(req),
      path: path ?? new URL(req.url).pathname,
      meta: { key, retryAfterSec: limited.retryAfterSec },
    });
  }
  return limited;
}

export function rateLimitResponse(
  limited: Extract<RateLimitResult, { ok: false }>,
  message = "Too many requests",
): NextResponse {
  return NextResponse.json(
    { error: message, code: "RATE_LIMITED" },
    {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    },
  );
}