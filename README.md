# FarmOS Armenia (Gyuxatntes)

Agricultural operating system for Armenia — plots, yield forecast, marketplace, machinery, jobs.

## Production run

```powershell
cd c:\Users\HP\Desktop\Gyuxatntes
copy .env.example .env
# Edit .env: set a strong NEXTAUTH_SECRET / AUTH_SECRET and your public NEXTAUTH_URL (https://…)
npm install
npx prisma db push
# Optional sample data (demo accounts + machinery photos). Skip for a clean production start:
# npm run db:seed
npm run build
npm start
```

Open the site (default **http://localhost:3000/hy**).

### First real account (recommended for circulation)

1. Open **/hy/auth/register**
2. Register with your email and a password (≥ 10 characters)
3. Add a plot, post supply/demand, or list machinery under **/hy/machinery/new**

HTTPS is required in production (`NEXTAUTH_URL=https://…`). See [SECURITY.md](./SECURITY.md).

## Optional sample seed

`npm run db:seed` loads marzes/villages, sample market rows, and freely licensed machinery photos.

| Email | Password | Note |
|-------|----------|------|
| `farmer@demo.am` | `password123` | **Dev/sample only** — change or delete before public launch |

## Killer loop

**Plot → yield forecast → matching demand → pre-sale (Future Harvest).**

Market modules: `/demand`, `/supply`, `/machinery`, `/jobs`, `/group-buy`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Optional sample data |
| `npm run db:reset` | Wipe DB + reseed (dev only) |
