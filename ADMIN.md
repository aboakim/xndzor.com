# Xndzor.com Admin Panel

## Access

1. Set your email in `.env`:
   ```
   ADMIN_EMAIL=albertakimyan1@gmail.com
   ```
2. Register or log in with that account at `/hy/auth/login`.
3. Promote to admin (if not already):
   ```bash
   npm run admin:promote
   ```
4. Open the admin panel:
   - **Armenian:** http://localhost:3000/hy/admin
   - **Russian:** http://localhost:3000/ru/admin
   - **English:** http://localhost:3000/en/admin

After promotion, log out and log back in so the session includes admin privileges. An **Ադմին** link appears in the header utility bar.

## What you can manage

| Section | URL | Actions |
|---------|-----|---------|
| Dashboard | `/hy/admin` | Counts: users, listings, payments, revenue |
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
```

## Security notes

- Admin routes require `role=ADMIN` or email matching `ADMIN_EMAIL`.
- Suspended users cannot log in.
- Admin pages are excluded from search indexing (`robots.ts`).
