# Farm OS (Xndzor / Խնձոր)

Daily farm operating system — not a classifieds board.

## Routes

| Route | What |
|-------|------|
| `/[locale]/today` | Daily cockpit (weather, tomorrow’s risk, tasks, costs snap, Xndzor Score, quick links) |
| `/[locale]/costs` | Expense logging + season total + est. cost/kg |
| `/[locale]/sell-decision` | Sell now / store 30d / store 60d AMD scenarios |
| `/[locale]/diary` | Voice + text farm diary (Armenian keyword parse) |
| `/[locale]/spaces` | Empty warehouse / cold / silo / greenhouse listings |
| `/[locale]/villages/[slug]/radar` | Anonymous village radar + local weather |
| `GET /api/weather` | Live forecast (`?lat=&lng=` or `?villageId=` or `?marzId=`) |
| `POST/GET /api/expenses` | Farm expenses |
| `POST/GET /api/diary` | Diary entries |
| `POST/GET /api/spaces` | Space listings |
| `POST /api/return-capacity` | Empty-return capacity offers |

Login required for personal `/today`, `/costs`, `/diary`.

## Weather

**Default (working free path):** [Open-Meteo](https://open-meteo.com) — no API key. Uses village coordinates from `data/armenia-locations.json` (via Prisma `Village.lat/lng`), else marz centroid from `src/lib/marz-coords.ts`.

Optional providers in `.env`:

```env
# Default free path (no key)
WEATHER_PROVIDER=open-meteo
# Optional paid/free-tier keys
OPENWEATHER_API_KEY=
YANDEX_WEATHER_API_KEY=
```

Google Weather is not wired (Maps-dependent). Open-Meteo covers Armenia reliably; OpenWeather/Yandex are optional upgrades.

## Schema additions

- `FarmExpense` — amountAmd, category (`diesel|labor|seed|water|other`), note, date, plotId?, userId
- `FarmDiaryEntry` — rawText, parsedJson, entryDate, plotId?
- `SpaceListing` — warehouse/cold/silo/greenhouse + availability
- `ReturnCapacityOffer` — empty-return teaser offers

Seed demo (`farmer@demo.am`): expenses, one cold-space listing, one diary entry.

## Real vs stub

| Feature | Status |
|---------|--------|
| Live weather (Open-Meteo default) | **Real** (optional OpenWeather / Yandex keys) |
| Tomorrow’s risk (plot + crop + weather) | **Real** heuristics |
| Today tasks | **Real** (PlotTask / farm-today) |
| Costs + cost/kg | **Real** (needs yield estimate) |
| Sell now / wait AMD scenarios | **Demo rules** (clear numbers, not market feed) |
| Xndzor Score axes + tips | **Real** activity-based extension of Farm Score |
| Voice diary | **Real** Web Speech + keyword parse; not full NLP |
| Village radar | **Aggregate DB** + demo floor when sparse |
| Space listings | **Real** CRUD UI/API |
| Empty return | **Teaser** + saved offers; route page is existing feature |
| Seed→sale timeline | **Real** UI on plot detail |
| Village together | **Framing** on group-buy |
| Why low yield YoY | **Stub** UI (needs 2 seasons) |

## Brand / nav

Pine-green Farm OS UI under `src/components/farm-os/`. Header utility + mega-menu passport group link **Այսօր / Today** → `/today`.
