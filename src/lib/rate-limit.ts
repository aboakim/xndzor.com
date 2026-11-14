/**
 * Rate limiting: Upstash Redis in production when configured; in-memory fallback for local dev.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis, isUpstashConfigured } from "@/lib/rate-limit-upstash";

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

const slidingLimiters = new Map<string, Ratelimit>();

function slidingLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  let existing = slidingLimiters.get(key);
  if (!existing) {
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    existing = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `xndzor-rl:${key}`,
    });
    slidingLimiters.set(key, existing);
  }
  return existing;
}

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

export async function isLockedAsync(
  key: string,
): Promise<{ locked: boolean; retryAfterSec: number }> {
  const redis = getRedis();
  if (redis) {
    const ttl = await redis.ttl(`xndzor-auth-lock:${key}`);
    if (ttl > 0) {
      return { locked: true, retryAfterSec: ttl };
    }
    return { locked: false, retryAfterSec: 0 };
  }
  return isLocked(key);
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
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

export async function rateLimitAsync(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const limiter = slidingLimiter(limit, windowMs);
  if (limiter) {
    const result = await limiter.limit(key);
    if (!result.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    }
    return { ok: true, remaining: result.remaining };
  }
  return rateLimit(key, { limit, windowMs });
}

/** Count a failed login; locks after `lockAfter` failures in the window. */
export function recordAuthFailure(
  key: string,
  {
    windowMs = 15 * 60 * 1000,
    lockAfter = 8,
    lockMs = 15 * 60 * 1000,
  }: { windowMs?: number; lockAfter?: number; lockMs?: number } = {},
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

export async function recordAuthFailureAsync(
  key: string,
  opts: {
    windowMs?: number;
    lockAfter?: number;
    lockMs?: number;
  } = {},
): Promise<RateLimitResult> {
  const {
    windowMs = 15 * 60 * 1000,
    lockAfter = 8,
    lockMs = 15 * 60 * 1000,
  } = opts;
  const redis = getRedis();
  if (!redis) {
    return recordAuthFailure(key, opts);
  }

  const lockKey = `xndzor-auth-lock:${key}`;
  const failKey = `xndzor-auth-fail:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const lockSec = Math.max(1, Math.ceil(lockMs / 1000));

  const lockTtl = await redis.ttl(lockKey);
  if (lockTtl > 0) {
    return { ok: false, retryAfterSec: lockTtl, locked: true };
  }

  const count = await redis.incr(failKey);
  if (count === 1) {
    await redis.expire(failKey, windowSec);
  }
  if (count >= lockAfter) {
    await redis.set(lockKey, "1", { ex: lockSec });
    await redis.del(failKey);
    return { ok: false, retryAfterSec: lockSec, locked: true };
  }
  return { ok: true, remaining: Math.max(0, lockAfter - count) };
}

export function clearAuthFailures(key: string) {
  buckets.delete(key);
}

export async function clearAuthFailuresAsync(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`xndzor-auth-fail:${key}`, `xndzor-auth-lock:${key}`);
  }
  clearAuthFailures(key);
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimitBackend(): "upstash" | "memory" {
  return isUpstashConfigured() ? "upstash" : "memory";
}