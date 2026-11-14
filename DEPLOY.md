# Deploy — Xndzor.com (Խնձոր․քոմ)

## Recommended: Vercel + Neon Postgres

SQLite (`file:./dev.db`) **does not work** on Vercel serverless — no durable writable disk.
Use **PostgreSQL** (Neon free tier or Vercel Postgres).

### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) → create project **xndzor**
2. Copy the **connection string** (prefer pooled / `-pooler` host for serverless)
3. It looks like:
   `postgresql://USER:PASSWORD@ep-….aws.neon.tech/neondb?sslmode=require`

### 2. Vercel environment variables

In [Vercel → Project → Settings → Environment Variables](https://vercel.com) set for **Production**:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon connection string from step 1 |
| `NEXTAUTH_URL` | `https://www.xndzor.com` (apex redirects to www) |
| `AUTH_URL` | same as `NEXTAUTH_URL` |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | long random secret |
| `ADMIN_EMAIL` | your admin email |
| `VERCEL_ACCESS_TOKEN` | Recommended. Live Production visitors and page views on `/hy/admin` from the Web Analytics API (24h / 7d / 30d). Without it (or if the API fails), the admin traffic cards stay empty with a connect prompt — not the on-site beacon. Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens) for team `aboakim` (read scope). Optional: `VERCEL_TEAM_ID`. |
| `UPSTASH_REDIS_REST_URL` | **Recommended (production).** Shared rate limits + login lockouts across Vercel instances. [Upstash Redis](https://console.upstash.com) → REST API. |
| `UPSTASH_REDIS_REST_TOKEN` | Pair with the URL above. If unset, limits fall back to in-memory (unsafe for multi-instance). |

Redeploy after saving env vars. Build runs `prisma db push` when `DATABASE_URL` is Postgres.

### Database roles (least privilege)

- **Neon owner** connection: migrations, `prisma db push`, one-off admin scripts — keep off Vercel.
- **App role** (Neon project → Roles): use a non-owner user in production `DATABASE_URL` on Vercel (`CREATE`, `SELECT`, `UPDATE`, `DELETE` on app tables only). Do not commit connection strings.
- After schema changes (e.g. `SecurityEvent`), run `npx prisma db push` against production Neon from your machine or CI before relying on audit rows.

### Backups

See **SECURITY.md → Backups (Neon)** for PITR / branch restore and a quarterly checklist.

### 3. Optional seed

From your machine (with the same `DATABASE_URL`):

```bash
npx prisma db push
npm run db:seed:minimal
# or full demo: npm run db:seed
```

Without seed the site shows an **empty marketplace** (no 500).

### 4. Auth URL note

Use **`https://www.xndzor.com`** if DNS redirects apex → www. A mismatch can break login redirects; it does **not** cause the homepage 500 (that was the missing Postgres DB).

---

## Alternative: VPS + Docker + Postgres

```bash
cp .env.example .env
# NEXTAUTH_URL=https://www.xndzor.com + secrets
docker compose up -d --build
```

Compose starts Postgres + the app; entrypoint runs `prisma db push`.

TLS: Caddy / nginx / Cloudflare in front of port 3000.

---

## Stripe webhook

See `PAYMENTS.md`. Endpoint: `https://YOUR_DOMAIN/api/checkout/webhook`.
