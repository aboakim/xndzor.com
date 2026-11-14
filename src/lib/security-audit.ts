import { prisma } from "@/lib/prisma";

export type SecurityEventType =
  | "login_failure"
  | "login_success"
  | "login_lockout"
  | "register"
  | "register_rate_limited"
  | "rate_limit_block"
  | "csrf_reject"
  | "admin_bootstrap"
  | "admin_action"
  | "upload_rate_limited";

export type SecurityEventInput = {
  type: SecurityEventType;
  userId?: string | null;
  ip?: string | null;
  path?: string | null;
  meta?: Record<string, unknown> | null;
};

/** Persist + emit structured security audit line (Vercel log drain). */
export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  const row = {
    type: input.type,
    userId: input.userId ?? null,
    ip: input.ip ?? null,
    path: input.path ?? null,
    meta: input.meta ?? undefined,
    at: new Date().toISOString(),
  };

  console.info(
    JSON.stringify({
      scope: "security",
      ...row,
    }),
  );

  try {
    await prisma.securityEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        ip: input.ip ?? null,
        path: input.path ?? null,
        meta: input.meta ? (input.meta as object) : undefined,
      },
    });
  } catch (error) {
    console.error(
      "[Xndzor] securityEvent persist failed",
      error instanceof Error ? error.message : error,
    );
  }
}

/** Throttle noisy success events (e.g. login) — one row per user / 6h. */
const loginSuccessThrottle = new Map<string, number>();
const LOGIN_SUCCESS_THROTTLE_MS = 6 * 60 * 60 * 1000;

export async function logLoginSuccessThrottled(
  userId: string,
  ip: string | null,
): Promise<void> {
  const now = Date.now();
  const last = loginSuccessThrottle.get(userId) ?? 0;
  if (now - last < LOGIN_SUCCESS_THROTTLE_MS) return;
  loginSuccessThrottle.set(userId, now);
  await logSecurityEvent({
    type: "login_success",
    userId,
    ip,
    path: "/api/auth/callback/credentials",
  });
}