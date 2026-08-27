# FarmOS Armenia — Product Plan

**Agricultural operating system** for Armenia (repo folder: Gyuxatntes).

## Strategic moat

**Farm Passport + Farm Score (reputation) + Product Passport (batch history) + Live Demand network («Ի՞նչ աճեցնել»).**

| Layer | Role |
|-------|------|
| Live demand /grow | *What to grow* — overproduction signal, matching |
| Farm Passport | Public trust identity (`#AR-NNNNNN`) |
| Farm Score 0–100 | Agricultural reliability from platform activity |
| Product Passport | Traceable harvest batch (`TOMATO-AR-2026-NNNNN`) |

Marketplace (Demand / Supply / Jobs / Machinery / Shop) remains a **secondary module**. GoShuka / Koriz / Aqlor cover pure farm-to-buyer markets — we lead with demand signal **plus** verifiable farm/batch trust.

See `FARM_SCORE.md` for the score formula.

---

## Killer loop

| Step | What | Model / route |
|------|------|----------------|
| 1 | Register plot + crop + harvest window + expected tons | `Plot` + `YieldEstimate` → `/plots/new` |
| 2 | Instant demand snapshot | `Demand` aggregate → plot create/detail |
| 3 | National board: expected supply vs open demand + marz map | `/grow` (alias `/exchange`) |
| 4 | **Overproduction signal** ⚠️ / undersupply 🟢 | `src/lib/exchange.ts` |
| 5 | Pre-agree before harvest | `FutureHarvest` + `PreOffer` |
| 6 | Publish Farm Passport + Farm Score | `/farms/[farmId]` |
| 7 | Create Product Passport batch | `/batches/[batchId]` from plot / future harvest |

### Overproduction signal (methodology)

- **Supply tons** = ACTIVE `FutureHarvest` qty (→ tons) **+** ACTIVE plot `YieldEstimate` for plots **without** an ACTIVE future harvest (no double count).
- **Demand tons** = ACTIVE `Demand` (`qtyMax` or `qtyMin`) converted to tons.
- **OVER** if supply ≫ demand (±12% band); **UNDER** if demand ≫ supply; else **BALANCED**.
- Badge: *platform registrations only — not national statistics*.

---

## Modules (reachable)

| Module | Model / route |
|--------|----------------|
| Ի՞նչ աճեցնել / Բորսա | Exchange + map → `/grow` |
| Ֆերմայի անձնագիր | `User.farmId` + Farm Score → `/farms/[farmId]` |
| Խմբաքանակի անձնագիր | `ProductBatch` → `/batches/[batchId]` |
| Ապագա բերք | `FutureHarvest` + `PreOffer` |
| Գնել / Վաճառել | `Demand` ↔ `Supply` (+ Trusted filter) |
| Գյուղտեխնիկա / Կենդանիներ / Խանութ | listings (+ Trusted badge) |
| Աշխատանք | `JobRequest` + `ServiceProvider` |
| Խմբային գնում | `GroupBuyCampaign` |
| Խորհրդատու | Stub `/advisor` (rule tips from exchange) |

---

## Deferred

- Full agronomy science / IoT sensors
- Full AI plant diagnosis / advisor (stub only)
- Paid map APIs

## Monetization (MVP)

| Product | Price (config) | Route |
|---------|----------------|-------|
| **TOP / Թոփ listing** (7 / 30 days) | **1,500 / 3,900 AMD** | listing «Խթանել / Թոփում տեղադրել» |
| Farm Pro monthly / yearly | 4,900 / 49,000 AMD | `/pricing` |
| Verified Farm yearly | 9,900 AMD | `/pricing` |
| Buyer Pro monthly | 9,900 AMD | `/pricing` |

Edit amounts in `src/lib/pricing.ts`. Models: `Plan`, `Subscription`, `Boost`, `Payment`, User flags `isPro` / `isVerifiedPaid` / `buyerProUntil`.

- **TOP boost** sorts first on boards + home; badge «Թոփ»
- **Demo checkout** when Stripe keys missing (labeled դեմո վճարում)
- **Stripe Checkout** (USD charge from AMD via `AMD_PER_USD`) when keys set — money to **your** Stripe account
- Owner: `/admin/earnings` (role `ADMIN` or `ADMIN_EMAIL`)
- User: `/account/billing`

## Yield assumptions (MVP)

`src/lib/yield.ts` — not agronomic advice.

## Stack

Next.js 15 · Prisma SQLite · Auth.js · next-intl (hy/ru/en) · AMD · Marz/Village · Open-Meteo (free) · `qrcode`
