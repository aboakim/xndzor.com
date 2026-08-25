/**
 * Simple in-memory rate limiter (MVP).
 * For multi-instance / serverless production, replace with Redis (e.g. Upstash).
 */

type Bucket = { count: number; resetAt: number; lockedUntil?: number };

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 20_000;

function pruneIfNeeded() {
  if (buckets.size < MAX_KEYS) return;
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.resetAt < now && (!b.lockedUntil || b.lockedUntil < now)) {
      buckets.delete(key);
    }
  }
  if (buckets.size >= MAX_KEYS) {
    const first = buckets.keys().next().value;
    if (first) buckets.delete(first);
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number; locked?: boolean };

function getBucket(key: string): Bucket | undefined {
  return buckets.get(key);
}

export function isLocked(key: string): { locked: boolean; retryAfterSec: number } {
  const b = getBucket(key);
  const now = Date.now();
  if (b?.lockedUntil && b.lockedUntil > now) {
    return { locked: true, retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000) };
  }
  return { locked: false, retryAfterSec: 0 };
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  pruneIfNeeded();
  const now = Date.now();
  let b = buckets.get(key);

  if (b?.lockedUntil && b.lockedUntil > now) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000),
      locked: true,
    };
  }

  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }

  b.count += 1;
  if (b.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: Math.max(0, limit - b.count) };
}

/** Count a failed login; locks after `lockAfter` failures in the window. */
export function recordAuthFailure(
  key: string,
  {
    windowMs = 15 * 60 * 1000,
    lockAfter = 8,
    lockMs = 15 * 60 * 1000,
  }: { windowMs?: number; lockAfter?: number; lockMs?: number } = {}
): RateLimitResult {
  pruneIfNeeded();
  const now = Date.now();
  let b = buckets.get(key);

  if (b?.lockedUntil && b.lockedUntil > now) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000),
      locked: true,
    };
  }

  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }

  b.count += 1;
  if (b.count >= lockAfter) {
    b.lockedUntil = now + lockMs;
    return { ok: false, retryAfterSec: Math.ceil(lockMs / 1000), locked: true };
  }

  return { ok: true, remaining: Math.max(0, lockAfter - b.count) };
}

export function clearAuthFailures(key: string) {
  buckets.delete(key);
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
