# FarmOS Armenia (Gyuxatntes)

**Primary product:** «Ի՞նչ աճեցնել» — future harvest exchange and **overproduction signal**.  
Marketplace (machinery, animals, shop, jobs) is secondary.

Killer loop: **Plot → demand snapshot → grow board signal → pre-sale (Future Harvest / PreOffer).**

## Production run (local)

```powershell
cd c:\Users\HP\Desktop\Gyuxatntes
copy .env.example .env
# Edit .env: strong NEXTAUTH_SECRET / AUTH_SECRET and public NEXTAUTH_URL (https://… in prod)
npm install
npx prisma db push
# Optional sample data only — skip for empty public launch:
# npm run db:seed
npm run build
npm start
```

Open **http://localhost:3000/hy**.

---

## Հրապարակում / Deploy

**Պաշտոնական ուղի՝ VPS + Docker + SQLite** (սեփական դոմեյն, պարզ պահուստ)։

Մանրամասն քայլեր՝ **[DEPLOY.md](./DEPLOY.md)**։

### Արագ մեկնարկ սերվերում

```bash
cp .env.example .env
# լրացրեք NEXTAUTH_URL=https://your.domain և գաղտնիքները
docker compose up -d --build
```

Այնուհետև՝

1. **Դոմեյն** — գնեք `.am` (կամ այլ)  
2. **DNS** — A գրառում դեպի VPS IP  
3. **HTTPS** — Caddy / nginx / Cloudflare  
4. **Stripe** (ըստ ցանկության) — webhook `https://DOMAIN/api/checkout/webhook`  
5. **Ադմին** — գրանցվեք, դրեք `ADMIN_EMAIL` կամ `role=ADMIN`

`NEXTAUTH_URL` / `AUTH_URL` պետք է լինեն `https://your-domain` (առանց վերջի `/`)։  
Արտադրությունում cookie-ները Secure են (`__Secure-next-auth.session-token`)։

### Seed / դեմո հաշիվներ

`npm run db:seed` ստեղծում է `*@demo.am` / `password123` — **մի գործարկեք հանրային թողարկումից առաջ**, կամ անմիջապես փոխեք գաղտնաբառերը։ Դատարկ DB + իրական գրանցումն է նախընտրելի։

---

### Demo the signals (after seed — local only)

| Signal | Where | What |
|--------|--------|------|
| ⚠️ Overproduction | `/hy` or `/hy/grow` → tomato | Armavir-heavy tomato future harvests ≫ open tomato demand |
| 🟢 Undersupply | `/hy/grow` → peach | Strong peach demand, ~3 t registered supply |

Login (seed only): `farmer@demo.am` / `password123`.  
Admin earnings: `admin@demo.am` / `password123` → `/hy/admin/earnings` (or your `ADMIN_EMAIL`).

### Monetization

| Package | AMD (`src/lib/pricing.ts`) |
|---------|----------------------------|
| **Թոփ հայտարարություն** | **1,500 / 7 օր · 3,900 / 30 օր** |
| Farm Pro | 4,900 / mo · 49,000 / year |
| Verified Farm | 9,900 / year |
| Buyer Pro | 9,900 / mo |

- Pricing: `/hy/pricing`
- **Stripe** when keys set; otherwise labeled test checkout (no real charge)
- Owner: `/hy/admin/earnings`

HTTPS required in production. See [SECURITY.md](./SECURITY.md), [DEPLOY.md](./DEPLOY.md), [PLAN.md](./PLAN.md).

## Key routes

| Route | Purpose |
|-------|---------|
| `/[locale]` | «Ի՞նչ աճեցնել» home |
| `/[locale]/grow` | National supply↔demand board |
| `/[locale]/pricing` | TOP boost + Pro packages |
| `/[locale]/account/billing` | User payments |
| `/[locale]/admin/earnings` | Owner totals |
| `/[locale]/forward` | Future harvest |
| `/[locale]/farms/[farmId]` | Farm Passport |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production (Node) |
| `docker compose up -d --build` | Production (VPS) |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Optional sample data (dev) |
| `npm run db:reset` | Wipe DB + reseed (dev only) |
