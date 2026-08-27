# Հրապարակում / Deploy — FarmOS Armenia (Gyuxatntes)

Քայլ առ քայլ՝ սեփական դոմեյնով կայքը օդ բացելու համար։

**Ընտրված ուղի:** VPS + Docker (`Dockerfile` + `docker-compose.yml`) + **SQLite** ծավալի վրա։  
Պատճառը՝ մեկ հիմնադիրի համար ամենապարզն է՝ ցանկացած հոսթում (Hetzner, DigitalOcean, տեղական VPS), սեփական `.am` դոմեյն, առանց Neon/Postgres-ի պարտադիր տեղափոխման։

---

## 1. Գնեք դոմեյն

Օրինակ՝ [amnic.am](https://www.amnic.am) կամ այլ ռեգիստրատոր — `yourfarm.am` / `farmos.am`։  
Պահեք մուտքի տվյալները DNS կառավարման համար։

---

## 2. Հոսթինգ (VPS)

1. Վարձեք VPS (Ubuntu 22.04+, ~1–2 GB RAM բավարար է սկզբի համար)։
2. Տեղադրեք Docker + Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Կլոնավորեք/պատճենեք նախագիծը սերվերում։
4. Պատրաստեք `.env` (տես բաժին 3)։
5. Գործարկեք՝
   ```bash
   docker compose up -d --build
   ```
6. Ստուգեք՝ `http://SERVER_IP:3000/hy`

**TLS (HTTPS):** առաջարկվում է Caddy կամ nginx + Let’s Encrypt, կամ Cloudflare Proxy։  
Օրինակ Caddyfile՝

```
yourfarm.am {
  reverse_proxy localhost:3000
}
```

> Այլընտրանք (Vercel + Postgres)՝ հնարավոր է ավելի ուշ։ Այս թողարկման համար Docker+SQLite-ն է պաշտոնական ուղին։ Մանրամասն՝ README «Հրապարակում»։

---

## 3. Environment փոփոխականներ

Պատճենեք `.env.example` → `.env` և լրացրեք՝

| Փոփոխական | Արժեք |
|-----------|--------|
| `NEXTAUTH_URL` / `AUTH_URL` | `https://yourfarm.am` |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | երկար պատահական գաղտնաբառ (տես `.env.example`) |
| `DATABASE_URL` | Compose-ում ավտոմատ՝ `file:/data/prod.db` |
| `ADMIN_EMAIL` | ձեր էլ․ հասցեն (ադմին վահանակ) |
| `STRIPE_*` | դատարկ թողեք մինչև իրական վճարումներ |

Գեներացնել գաղտնիք՝

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## 4. DNS գրառումներ

Եթե VPS IP-ն է `A.B.C.D`՝

| Տեսակ | Անուն | Արժեք |
|-------|--------|--------|
| **A** | `@` | `A.B.C.D` |
| **A** կամ **CNAME** | `www` | նույն IP կամ `@` |

Cloudflare օգտագործելիս Proxy-ն կարող է տալ ավտոմատ HTTPS։  
Սպասեք DNS տարածմանը (րոպեներ–ժամեր)։

---

## 5. Stripe webhook

Երբ պատրաստ եք իրական վճարումների՝

1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint  
2. URL՝ **`https://YOUR_DOMAIN/api/checkout/webhook`**  
3. Իրադարձություն՝ `checkout.session.completed` (և ըստ անհրաժեշտության այլ checkout իրադարձություններ)  
4. Պատճենեք Signing secret → `STRIPE_WEBHOOK_SECRET`  
5. Լրացրեք `STRIPE_SECRET_KEY` և `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
6. Վերագործարկեք կոնտեյները՝ `docker compose up -d`

Առանց բանալիների կայքը աշխատում է **փորձարկման վճարման** ռեժիմում (իրական գումար չի գանձվում)։

---

## 6. Առաջին ադմին հաշիվ

**Առաջարկվող (դատարկ prod):**

1. Բացեք `https://YOUR_DOMAIN/hy/auth/register` և գրանցվեք։  
2. `.env`-ում դրեք `ADMIN_EMAIL=your@email.com` և վերագործարկեք։  
3. Կամ SQLite-ում նշանակեք `role = 'ADMIN'` ձեր օգտատիրոջը։  
4. Բացեք `/hy/admin/earnings`։

**Սերմ (seed)՝ միայն թեստի համար:**

```bash
# մի գործարկեք հանրային թողարկումից առաջ առանց գաղտնաբառերը փոխելու
npm run db:seed
```

Seed-ը ստեղծում է `*@demo.am` հաշիվներ հայտնի գաղտնաբառով — **մի թողեք այդպես հանրայինում**։

---

## 7. Գործարկումից առաջ՝ ստուգացանկ

- [ ] `NEXTAUTH_URL` = `https://…` (ոչ `http://localhost`)
- [ ] Ուժեղ `NEXTAUTH_SECRET` / `AUTH_SECRET`
- [ ] HTTPS աշխատում է (կանաչ կողպեք)
- [ ] Գրանցում + մուտք աշխատում են
- [ ] Seed չի գործարկվել **կամ** դեմո գաղտնաբառերը փոխված են
- [ ] Stripe բանալիներ (եթե վճարում եք վերցնում) + webhook
- [ ] Backup՝ Docker volume `farmos_db` (SQLite ֆայլ)

---

## Արագ հրամաններ

```bash
docker compose up -d --build   # կառուցել և գործարկել
docker compose logs -f app     # լոգեր
docker compose restart app     # վերագործարկում .env-ից հետո
docker compose down            # կանգնեցնել (volume-ները մնում են)
```

Տեղական առանց Docker-ի՝

```bash
npm install && npx prisma db push && npm run build && npm start
```
