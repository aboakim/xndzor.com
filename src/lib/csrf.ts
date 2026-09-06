import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";

const CSRF_COOKIE = "farmos-csrf";
const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Issue a CSRF token (sets cookie + returns value for client header). */
export async function issueCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const jar = await cookies();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return token;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/** Validate double-submit CSRF token from cookie + header. */
export async function validateCsrf(req: Request): Promise<boolean> {
  const header = req.headers.get(CSRF_HEADER)?.trim();
  if (!header) return false;
  const jar = await cookies();
  const cookie = jar.get(CSRF_COOKIE)?.value?.trim();
  if (!cookie) return false;
  return safeEqual(header, cookie);
}

export { CSRF_HEADER };
