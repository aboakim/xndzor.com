# Farm tools MVP (`/[locale]/farm`)

Operating tools for Armenian farms — additive routes under `/farm`, not homepage redesigns.

## Routes

| Path | Feature |
|------|---------|
| `/[locale]/farm` | Hub + live weather + Xndzor Score summary |
| `/farm/risks` | Tomorrow’s dangers (plot-aware) |
| `/farm/diary` | Voice / text day report |
| `/farm/costs` | Expense log + cost/kg |
| `/farm/sell-or-wait` | Sell now vs store 30/60d |
| `/farm/spaces` · `/farm/spaces/new` | Empty space marketplace |
| `/farm/returns` · `/farm/returns/new` | Empty return truck loads |
| `/farm/journey` | Seed-to-sale stages |
| `/farm/radar` | Anonymous village radar + weather/risks + activity pulse |
| `/farm/together` | Village shared goals |
| `/farm/why-yield` | Year compare stub |
| `/farm/score` | Xndzor health score detail |

Also linked from header **My farm** and mega-menu **Farm OS**. Related cockpit: `/today` (parallel Farm OS today view).

## Weather

Provider order:

1. **OpenWeatherMap** if `OPENWEATHER_API_KEY` is set in `.env`
2. **Open-Meteo** (free, no key)
3. **Demo** forecast (clearly labeled)

Coords: village `lat`/`lng` from Armenia locations when available, else marz centroid (`src/lib/marz-coords.ts`).

```env
OPENWEATHER_API_KEY=your_key_here
```

API: `GET /api/weather?lat=&lng=` or `?villageId=` or `?marzId=`

## Prisma models

- `FarmExpense`, `FarmDiaryEntry`
- `SpaceListing`, `ReturnCapacityOffer`
- `CropJourney`, `VillageGoal`, `VillageGoalJoin`

After schema changes: `npx prisma db push`

## Seed (optional)

Demo spaces / returns / journey / village goal can be added via full seed or created in UI after login (`farmer@demo.am`).

## How to use

1. Log in as a farmer
2. Open **My farm** → pick a tool
3. Add plots for personalized risks and cost/kg
4. Diary: use **Speak** (Chrome) or type Armenian/Russian/English; expenses auto-logged when amounts are detected
