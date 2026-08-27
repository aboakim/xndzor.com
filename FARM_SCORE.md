# Farm Score (Agricultural Reliability Score)

**0–100** score shown on Farm Passport and trusted listing badges.

**Honest scope:** based on **platform activity only** (plots, future harvests, pre-offers, supplies/offers, FarmReview / listing ratings, product batches, account age). Not a credit score, not national statistics.

## Formula (MVP)

| Component | Max | Signal |
|-----------|-----|--------|
| Deals | **30** | `+6` per successful deal, capped. Counts: `PreOffer` **RESERVED**, `FutureHarvest` **SOLD**, `Supply` **SOLD**, `Offer` **ACCEPTED/COMPLETED** on farmer’s supplies |
| Ratings | **25** | Avg of `FarmReview` (1–5), else listing `Comment.rating`. Neutral **8** if none |
| Consistency | **20** | Share of active plots linked to a future harvest + presence of yield signal + published batches |
| Activity / age | **15** | Account age (~8 pts at 8 months) + listing activity |
| Penalties | **−10** | Declined pre-offers, hidden harvests, declined/cancelled offers |
| Verified bump | **+3** | `User.farmVerified` (manual or simple criteria) |

`score = clamp(round(sum), 0, 100)`

## Bands

| Score | Band | Color |
|-------|------|-------|
| 90–100 | Highly Reliable | deep green |
| 75–89 | Reliable (Trusted badge) | green |
| 55–74 | Building | amber |
| 35–54 | New | slate |
| 0–34 | At risk | clay |

**Trusted** filter / badge: score ≥ **75**.

## Passport stats (separate from score)

- **Tons sold** — from reserved pre-offer qty + sold harvests/supplies (unit→tons)
- **Successful deals** — count as above
- **Buyer rating avg** — FarmReview / comments
- **On-time %** — reserved offers whose harvest date is not >14 days overdue; if deals exist but no timing sample, UI shows an **estimate** label

## IDs

- Farm: `AR-NNNNNN` (display `#AR-NNNNNN`)
- Batch: `{CROP}-AR-{YEAR}-{NNNNN}` e.g. `TOMATO-AR-2026-00182`

Implementation: `src/lib/farm-score.ts`, `src/lib/farm-id.ts`.
