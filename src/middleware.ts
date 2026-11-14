import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { validateCsrfRequest } from "@/lib/csrf";

const intlMiddleware = createMiddleware(routing);

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Routes that skip CSRF (webhooks, Auth.js, bearer bootstrap). Checkout already validates too. */
const CSRF_SKIP_PREFIXES = [
  "/api/auth/",
  "/api/checkout/webhook",
  "/api/payments/idram/callback",
  "/api/payments/telcell/callback",
  "/api/admin/bootstrap",
  "/api/pageview",
  "/api/presence",
  "/api/indexnow",
];

function csrfExempt(pathname: string): boolean {
  if (pathname === "/api/auth/register") return false;
  if (pathname.startsWith("/api/auth/")) return true;
  return CSRF_SKIP_PREFIXES.some(
    (p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p),
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (MUTATING.has(req.method) && !csrfExempt(pathname)) {
      if (!validateCsrfRequest(req)) {
        return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/",
    "/(hy|ru|en)",
    "/(hy|ru|en)/:path*",
    "/api/:path*",
  ],
};