# FarmOS Armenia — Product Plan

**Agricultural operating system** for Armenia (repo folder: Gyuxatntes).

Promise: *Հողամաս → բերքի կանխատեսում → շուկայի պահանջարկ → նախնական վաճառք*

Marketplace (Demand / Supply / Jobs / Group-buy) is a **module**, not the product. GoShuka / Koriz / Aqlor already cover pure farm-to-buyer markets — we lead with farm operations.

---

## Killer loop (center the product)

| Step | What | Model |
|------|------|--------|
| 1 | Register land plot(s) | `Plot` |
| 2 | Rule-based yield estimate (crop × ha → ton range; editable) | `YieldEstimate` |
| 3 | Match open buyer demand | reuse `Demand` |
| 4 | Publish Future Harvest + buyer pre-offers | `FutureHarvest` + `PreOffer` |

Today UX «Ի՞նչ անել այսօր»: `PlotTask` + irrigation / seasonal pest heuristics + Open-Meteo weather caveat (`src/lib/farm-today.ts`, `src/lib/weather.ts`).

Farm context → market actions (from plot approaching harvest): workers → `/jobs/new` prefilled; equipment → jobs; fertilizer → group-buy; sell → future harvest.

---

## Modules (reachable from Farm OS, not List.am home)

| Module | Model |
|--------|--------|
| Գնել / Վաճառել | `Demand` ↔ `Supply` |
| Գյուղտեխնիկա (վաճառք) | `MachineryListing` |
| Պատվիրել / Կատարել աշխատանք | `JobRequest` + `ServiceProvider` |
| Ապագա բերք | `FutureHarvest` + `PreOffer` |
| Խմբային գնում | `GroupBuyCampaign` |

Job types unchanged: PLOW, SOW, SPRAY, HARVEST, TRANSPORT, PRUNE, GREENHOUSE, CONSULT, OTHER.

Machinery sales (`/machinery`) are **inventory listings** (tractor/combine/etc. for sale) — distinct from Job Marketplace «պատվիրել աշխատանք».

---

## AI plant photo (MVP careful)

Upload on plot → store URL + disclaimer stub (“possible issue — review checklist / consult specialist”). **No diagnosis certainty** (Berqo exists for clinical path).

---

## Deferred

- Full agronomy science / IoT sensors
- Paid AI plant diagnosis
- Online payments

---

## Yield assumptions (MVP)

Documented in `src/lib/yield.ts` (tons/ha tables). Farmer can override. Not agronomic advice.

---

## Stack

Next.js 15 · Prisma SQLite · Auth.js · next-intl (hy/ru/en) · AMD · Marz/Village · Open-Meteo (free)
