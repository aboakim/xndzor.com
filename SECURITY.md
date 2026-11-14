# Security

Xndzor.com — practical hardening for Next.js + Prisma + Auth.js (Credentials).

## Production checklist

1. **HTTPS only** — set `NEXTAUTH_URL` to your `https://` origin. HSTS is enabled when `NODE_ENV=production`.
2. **Secrets** — generate a long random `NEXTAUTH_SECRET` (and matching `AUTH_SECRET`):

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Never commit `.env`. Rotate secrets by regenerating and restarting the app (all sessions invalidate).
3. **Skip or scrub seed** — `npm run db:seed` creates `*@demo.am` accounts with a known password. Prefer empty DB + real registration for public circulation, or change those passwords immediately.
4. **Database** — SQLite `file:./dev.db` is fine for early launch; back up `prisma/*.db`. For scale, switch `DATABASE_URL` to Postgres and re-`db push`.

## Auth & sessions

- Passwords hashed with **bcrypt** (12 rounds). **Argon2id** may be adopted later with dual-verify; passwords are not mass-migrated today.
- JWT sessions; cookies **httpOnly**, **SameSite=Lax**, **Secure** in production (`__Secure-` cookie name).
- Failed logins: lockout after **8** failures / 15 minutes (per email). Uses **Upstash Redis** when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; otherwise in-memory (local dev only).
- Rate limits on register, upload, checkout, comments, listing create, `/api/xndzor/solve`, offers, job apply, and payment callbacks — same Upstash / memory backend (`rateLimitAsync` in `src/lib/rate-limit.ts`).
- **CSRF**: double-submit cookie (`farmos-csrf`) + `x-csrf-token` header on state-changing `/api/*` requests (middleware). Exempt: Auth.js routes, webhooks, payment provider callbacks, admin bootstrap (Bearer), anonymous beacons (`/api/pageview`, `/api/presence`). Client helpers: `src/lib/fetch-with-csrf.ts` (`apiMutation`).
- Mutations require a signed-in session; ownership checks on edit/delete via `listingAuthError` (e.g. supply, machinery, catalog).

## Audit logging

- Prisma model **`SecurityEvent`** (type, userId?, ip?, path?, meta JSON, `createdAt`) plus structured `console.info` JSON (`scope: security`) for Vercel logs.
- Logged: login failure / lockout, throttled login success, register, register rate limit, upload rate limit, admin actions, admin bootstrap use, rate-limit blocks where wired.
- After deploy, run `npx prisma db push` (or migrate) so `SecurityEvent` exists in Neon.

## Uploads

- Auth required.
- Allowlist: JPEG / PNG / WebP only (magic-byte check, not client MIME).
- Max **5 MB** / file, max **15** files per request (75 MB total).
- Random hex filenames under `public/uploads/listings/` only; path traversal blocked.
- Listing APIs accept only `/uploads/…` image URLs (no arbitrary remote URLs).

## Headers

Set in `next.config.ts`: CSP (Next-friendly), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production. `X-Powered-By` disabled.

## Data

- Prisma parameterized queries only (no raw SQL with user input).
- User text stripped of HTML tags before storage; React escapes on render (no `dangerouslySetInnerHTML`).
- Zod validation on create/update payloads.
- **Farm Passport / Product Passport** — public read by `farmId` / `batchCode`. Phone on passport only if `showPhoneOnPassport`. Batch create requires session + ownership of plot/future harvest (`POST /api/batches`).

## Residual risks (honest)

- Without **Upstash** env vars, rate limits / lockouts are **in-memory** (not suitable for multi-instance production).
- CSRF does not replace XSS or authz bugs; penetration testing was **not** performed for this release.
- CSP keeps `'unsafe-inline'` / `'unsafe-eval'` for Next.js 15 (removing `unsafe-eval` broke dev builds in smoke tests); tighten with nonces when feasible.
- Uploaded files are served as static public assets — do not treat `public/uploads` or Blob URLs as private.
- No WAF / bot protection yet — put Cloudflare (or similar) in front for public traffic.
- Dependency CVEs: run `npm audit` regularly and upgrade.

## Backups (Neon)

Neon retains **point-in-time recovery (PITR)** on paid plans; free tier has branch/history limits — confirm in your Neon project → **Backup & restore**.

**Quarterly restore check (recommended):**

1. Create a **branch** from a timestamp in Neon console (or restore to a new branch).
2. Point a local or staging `DATABASE_URL` at that branch.
3. Run `npx prisma db push` (if schema drift) and smoke-test login + one listing read.
4. Delete the test branch when done.

This verifies you can recover data; it does not prove RTO/RPO without your own runbook timing.

## Report issues

If you find a vulnerability, contact the operators privately before public disclosure.

## Payments (Stripe)

Xndzor.com uses **Stripe Hosted Checkout** — card data never touches our servers.

### Trust model

- **Never** grant entitlements from client-only “success” callbacks.
- Fulfillment runs only from:
  1. **Webhook** (`POST /api/checkout/webhook`) with verified `stripe-signature` and `STRIPE_WEBHOOK_SECRET`
  2. **Server-side** session verify on `/checkout/success` and `GET /api/checkout/verify` (idempotent backup)
- Demo checkout (`/api/checkout/demo`) is allowed **only** when `NODE_ENV !== production` and Stripe keys are absent.

### Production requirements

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` must be set.
- Without keys, checkout returns **503** in production (no silent demo mode).

### Hardening in place

| Control | Implementation |
|---------|----------------|
| Amounts | Server `src/lib/pricing.ts` only |
| Boost ownership | `assertListingOwnedBy` before checkout |
| CSRF | Double-submit cookie + `x-csrf-token` on checkout POST |
| Rate limit | Per-user and per-IP on `POST /api/checkout` |
| Idempotency | `Payment.status`, unique `stripeSessionId`, one boost per `paymentId` |
| Logging | Structured JSON logs (`scope: payments`) — no card data |
| Admin | `/hy/admin/earnings` — masked emails |

### Refunds / chargebacks (MVP)

Stripe Dashboard handles money movement. Entitlement revoke is **manual** for MVP — update user flags / subscription status in DB after refund.

See **PAYMENTS.md** (Armenian) for Stripe setup in Armenia and webhook event list.
