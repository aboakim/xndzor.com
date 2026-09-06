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

Redeploy after saving env vars. Build runs `prisma db push` when `DATABASE_URL` is Postgres.

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
