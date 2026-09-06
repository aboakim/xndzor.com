# Xndzor.com Admin Panel (private)

The admin panel is **not linked** anywhere in the public UI (header, footer, mega-menu). Access only via the direct URL below.

## Access

1. Set your email in `.env`:
   ```
   ADMIN_EMAIL=albertakimyan1@gmail.com
   ```
2. Log in first at `/hy/auth/login` with that account (session required).
3. Promote to admin (if not already):
   ```bash
   npm run admin:promote
   ```
4. Open the panel **directly** (bookmark this):
   - **Armenian:** `/hy/admin` — e.g. `https://xndzor.com/hy/admin` or `http://localhost:3000/hy/admin`
   - **Russian:** `/ru/admin`
   - **English:** `/en/admin`

After promotion, log out and log back in so the session includes admin privileges.

**Stealth:** Unauthenticated or non-admin visitors hitting `/hy/admin` get a normal **404** (no login redirect that would advertise the URL).

**Password:** Default admin password is **`Akim1234`** (override with `ADMIN_PASSWORD` in `.env`).

```bash
# Set/reset password + ensure ADMIN role (uses ADMIN_EMAIL from .env)
npm run admin:set-password

# Production Neon DB (password never committed — pass URL only for the run):
# DATABASE_URL="postgresql://..." npm run admin:set-password
```

## What you can manage

| Section | URL | Actions |
|---------|-----|---------|
| Dashboard | `/hy/admin` | Users, early-bird remaining, listings by type, revenue, recent users & listings |
| Users | `/hy/admin/users` | Search, change role, verify farm, suspend |
| Listings | `/hy/admin/listings` | Moderate supply, demand, animals, machinery, catalog, jobs, future harvest |
| Payments | `/hy/admin/payments` | Revenue overview, payment history, subscriptions |
| Plans | `/hy/admin/plans` | View/toggle active pricing plans |

## Demo vs real mode

| Variable | Effect |
|----------|--------|
| `DEMO_MODE=true` | Demo banners + demo checkout (local dev only) |
| `DEMO_MODE=false` | Production-like UX — no demo banners |
| `DEMO_OTP_IN_RESPONSE=true` | Show OTP in card checkout API (testing only) |

Production always disables demo mode regardless of env vars.

## Database commands

```bash
# Apply schema (includes `suspended` on User)
npm run db:push

# Full demo data (wipes DB)
npm run db:seed

# Reference data + admin only (safe, no wipe)
npm run db:seed:minimal

# Promote ADMIN_EMAIL user to ADMIN role
npm run admin:promote

# Set admin password (default Akim1234) + ADMIN role
npm run admin:set-password
```

## Security notes

- Admin routes require `role=ADMIN` or email matching `ADMIN_EMAIL`.
- Suspended users cannot log in.
- Admin pages are excluded from search indexing (`robots.ts`).
- No public navigation entry points to `/admin`.
