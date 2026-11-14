import { Redis } from "@upstash/redis";

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isUpstashConfigured()) return null;
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}