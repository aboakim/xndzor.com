# Վճարումներ / Payments — Xndzor.com (Խնձոր․քոմ)

Քայլ առ քայլ՝ **իրական վճարումներ** ստանալու համար Հայաստանից։  
Աջակցվող միջոցներ՝ **բանկային փոխանցում (խորհուրդ է տրվում սկսել այստեղից)**, **Visa / Mastercard / ArCa** (Stripe), **iDram**, **TelCell**։

---

## 0. Ամենաարագ ուղի Հայաստանի համար (խորհուրդ)

**Բանկային փոխանցում** → գումարը գալիս է **ձեր** հաշվին։ Merchant պայմանագիր պետք չէ։

1. Բացեք ձեր բանկի հավելվածը / հաշիվը և պատճենեք՝
   - բանկի անուն
   - հաշվեհամար
   - ստացողի անուն (անձ կամ ընկերություն)
2. Vercel → Project → **Settings → Environment Variables** ավելացրեք.

```env
PACKAGES_FREE=false
EARLY_BIRD_FREE_LIMIT=50

OWNER_BANK_NAME=Ameriabank
OWNER_BANK_ACCOUNT=0123456789012345
OWNER_BANK_HOLDER=Անուն Ազգանուն / Company LLC
OWNER_BANK_INN=
OWNER_BANK_BIC=
OWNER_BANK_NOTE=Նշեք վճարման կոդը նպատակում
```

3. **Redeploy** (Deployments → Redeploy).
4. Թեստ՝ https://www.xndzor.com/hy/pricing → գնել փաթեթ → **Բանկային փոխանցում**.
5. Օգտատերը փոխանցում է և սեղմում է **«Ես վճարել եմ»**.
6. Դուք մտնում եք **Ադմին → Վճարումներ** → ստուգում եք հաշվին մուտքը → **Հաստատել վճարումը** → փաթեթը ակտիվանում է։

> Early-bird անվճար տեղերը **չեն** սպառվում վճարովի բանկային ճանապարհով։

**Ադմին էջ.** https://www.xndzor.com/hy/admin/payments  
**Օգտատիրոջ էջ.** `/hy/checkout/bank?paymentId=…`

---

## 1. Stripe (քարտեր — Visa / Mastercard / ArCa)

### 1.1 Stripe հաշիվ

1. Գրանցվեք [stripe.com](https://stripe.com) — ընտրեք **Armenia** որպես երկիր (եթե հասանելի է)։
2. Dashboard → **Settings → Business** — լրացրեք բանկային հաշիվ payout-ների համար։
3. **Test mode** — մշակում և թեստ։ **Live mode** — իրական գումար։

> **AMD vs USD:** Կայքում գները ցուցադրվում են **դրամով (AMD)** (`src/lib/pricing.ts`)։  
> Stripe-ը հաճախ գանձում է **USD**-ով։ Փոխարժեքը՝ `AMD_PER_USD = 400`։  
> **ArCa** քարտերը Հայաստանում սովորաբար աշխատում են Stripe-ով — թեստավորեք live mode-ում։  
> Եթե Stripe-ը չի աջակցում ձեր երկիրը որպես merchant — օգտագործեք **բանկային փոխանցում** կամ iDram/TelCell։

### 1.2 API բանալիներ

| Փոփոխական | Որտեղից |
|-----------|---------|
| `STRIPE_SECRET_KEY` | Secret key (`sk_test_…` / `sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (`pk_test_…` / `pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |

### 1.3 Webhook

**Production URL:** `https://YOUR_DOMAIN/api/checkout/webhook`

**Events:**
- `checkout.session.completed`
- `payment_intent.succeeded` / `payment_intent.payment_failed`
- `customer.subscription.created` / `updated` / `deleted`
- `invoice.paid`

**Local (Stripe CLI):**
```bash
stripe login
stripe listen --forward-to localhost:3000/api/checkout/webhook
```

Թեստային քարտ՝ `4242 4242 4242 4242`։

---

## 2. iDram (AMD դրամապանակ)

### 2.1 Merchant գրանցում

1. Կնքեք պայմանագիր [iDram](https://idram.am) business բաժնի հետ։
2. Idram-ի տեխնիկական թիմը կտա՝
   - `IDRAM_EDP_REC_ACCOUNT` — merchant Idram ID
   - `IDRAM_SECRET_KEY` — գաղտնի բանալի
   - `IDRAM_EDP_EMAIL` — հաստատման email (ընտրովի)
   - **RESULT_URL** — server callback (տես ստորև)
   - **SUCCESS_URL** / **FAIL_URL** — օգտատիրոջ redirect (կարգավորեք `/hy/checkout/success` և `/hy/checkout/cancel`)

### 2.2 Env փոփոխականներ

```env
IDRAM_SECRET_KEY=your_secret
IDRAM_EDP_REC_ACCOUNT=your_merchant_id
IDRAM_EDP_EMAIL=payments@yourdomain.am
IDRAM_CHECKOUT_BASE_URL=https://bank.idram.am/payment.aspx
```

### 2.3 Callback URL (տալ Idram-ին)

```
https://YOUR_DOMAIN/api/payments/idram/callback
```

**Flow:**
1. Օգտատերը ընտրում է iDram → POST form `bank.idram.am/payment.aspx`
2. Idram ուղարկում է **precheck** (EDP_PRECHECK=YES) → server պատասխանում է `OK`
3. Idram ուղարկում է **payment confirmation** + EDP_CHECKSUM → server ստուգում է MD5 signature → `fulfillPayment()`
4. Օգտատերը redirect SUCCESS_URL → `/checkout/success?paymentId=…`

**Checksum:** `MD5(EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET_KEY:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE)`

> **Կարևոր:** Մի վստահեք return URL-ին առանց server callback-ի։ Callback-ը պարտադիր է։

---

## 3. TelCell Wallet (AMD)

### 3.1 Merchant գրանցում

1. Դիմեք [developer.telcell.am](https://developer.telcell.am) — merchant հաշիվ։
2. Ստանաք՝
   - `TELCELL_MERCHANT_ID` — shop email/issuer
   - `TELCELL_SECRET` — shop secret key
3. Callback URL-ը կարգավորեք merchant dashboard-ում։

### 3.2 Env փոփոխականներ

```env
TELCELL_MERCHANT_ID=shop@yourdomain.test
TELCELL_SECRET=your_shop_key
TELCELL_CHECKOUT_URL=https://telcellmoney.am/invoices
```

Test contour: `https://telcellmoney.am/proto_test2/invoices`

### 3.3 Callback URL

```
https://YOUR_DOMAIN/api/payments/telcell/callback
```

**Flow:**
1. POST form → `telcellmoney.am/invoices` (PostInvoice)
2. TelCell redirect → `telcellmoney.am/payments/invoice/?invoice=…`
3. POST callback `status=PAID` + checksum → server verify → `fulfillPayment()`

**Invoice security_code:** `MD5(secret + issuer + currency + price + product + issuer_id + valid_days)`  
**Callback checksum:** `MD5(secret + invoice + issuer_id + payment_id + buyer + currency + sum + time + status)`

---

## 4. Unified checkout UI

`/pricing`, boost modal, checkout — **վճարման եղանակի ընտրություն:**
- **Բանկային փոխանցում** — երբ `OWNER_BANK_ACCOUNT` + `OWNER_BANK_HOLDER` set → `/[locale]/checkout/bank`
- **Բանկային քարտ (Visa / MC / ArCa)** — on-site card form → `/[locale]/checkout/card?paymentId=…`
- **iDram** — երբ `IDRAM_SECRET_KEY` + `IDRAM_EDP_REC_ACCOUNT` set
- **TelCell** — երբ `TELCELL_MERCHANT_ID` + `TELCELL_SECRET` set

### 4.1 Bank transfer flow

1. Checkout ստեղծում է `Payment` (`provider: BANK_TRANSFER`, `status: PENDING`)
2. Օգտատերը տեսնում է ձեր հաշվի տվյալները + `XND-……` կոդը
3. Փոխանցում է գումարը → սեղմում է **Ես վճարել եմ** (դեռ PENDING)
4. Ադմինը հաստատում է → `fulfillPayment()` → SUCCEEDED + փաթեթի ակտիվացում

### 4.2 Card checkout flow (Visa / MC / ArCa)

**Route:** `/hy/checkout/card?paymentId=…` (also `ru`, `en`)

**Step 1 — Card details:** number (16 digits), expiry MM/YY, CVV, cardholder name. Visa / MC / ArCa logos.

**Step 2 — ARCA SMS OTP (demo):** 6-digit code sent to user's phone (`User.phone`). Max 5 attempts, 5 min expiry. Resend rate-limited.

**Step 3 — Success:** `/hy/checkout/success?paymentId=…` → `fulfillPayment()`.

**API routes (CSRF required):**

| Route | Role |
|-------|------|
| `POST /api/payments/card/initiate` | Store card last4 only; generate OTP (demo) or Stripe PaymentIntent |
| `POST /api/payments/card/verify-otp` | Verify OTP → `SUCCEEDED` → `fulfillPayment()` |
| `POST /api/payments/card/resend-otp` | Resend OTP (demo, rate limited) |
| `GET /api/payments/card/info` | Payment summary for checkout page |

**Demo mode (no Stripe/bank keys):** Full card + simulated ARCA SMS OTP. OTP logged to server console.

**Production — Stripe:** Stripe **PaymentIntent + Payment Element** (PCI — PAN/CVV never touch our server).

**Security:** Never log full card number/CVV. Rate limit OTP (5 attempts). OTP expires 5 minutes.

**Production:** գոնե **մեկ** provider պարտադիր (Stripe / iDram / TelCell / bank), հակառակ դեպքում 503։

---

## 5. Ապրանքներ և ակտիվացում

| Կոդ | Նշանակություն |
|-----|----------------|
| `BOOST_7` / `BOOST_30` | TOP խթանում |
| `FARM_PRO_MONTHLY` / `FARM_PRO_YEARLY` | Farm Pro |
| `BUYER_PRO_MONTHLY` | Buyer Pro |
| `VERIFIED_FARM_YEARLY` | Հաստատված ֆերմա |

Բոլոր provider-ներից հետո կանչվում է **`fulfillPayment(paymentId)`** (idempotent)։

Success URL՝ `/hy/checkout/success?paymentId=…`

---

## 6. Անվտանգություն

- Callback signature verification (iDram MD5, TelCell MD5, Stripe webhook HMAC)
- Return URL alone **never trusted**
- Bank transfer: user «I've paid» **does not** activate — only admin confirm
- CSRF token checkout POST-ի վրա
- Rate limit checkout + callbacks
- Server-side amounts from `pricing.ts` only

---

## 6b. Անվճար փաթեթներ և early-bird

By default **`PACKAGES_FREE=true`** forces everything free.

Live launch pattern:

```env
PACKAGES_FREE=false
EARLY_BIRD_FREE_LIMIT=50
```

- First 50 **package activations** are free forever (`provider: FREE`)
- When slots are full → paid path (bank / Stripe / iDram / TelCell)
- Paid activations **do not** consume early-bird slots

**Re-enable paid-only (no free slots):**

```env
EARLY_BIRD_FREE_LIMIT=0
```

---

## 7. Env ամբողջական ցանկ

```env
# Free launch / early-bird
PACKAGES_FREE=false
EARLY_BIRD_FREE_LIMIT=50

# Bank transfer → your AMD account (recommended start)
OWNER_BANK_NAME=
OWNER_BANK_ACCOUNT=
OWNER_BANK_HOLDER=
OWNER_BANK_INN=
OWNER_BANK_BIC=
OWNER_BANK_NOTE=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# iDram
IDRAM_SECRET_KEY=
IDRAM_EDP_REC_ACCOUNT=
IDRAM_EDP_EMAIL=
IDRAM_CHECKOUT_BASE_URL=https://bank.idram.am/payment.aspx

# TelCell
TELCELL_MERCHANT_ID=
TELCELL_SECRET=
TELCELL_CHECKOUT_URL=https://telcellmoney.am/invoices

# Optional
PAYMENT_PROVIDER=bank
DEMO_OTP_IN_RESPONSE=true
```

---

## 8. Production callback / page URLs

| Provider | URL |
|----------|-----|
| Bank transfer (user) | `https://YOUR_DOMAIN/hy/checkout/bank?paymentId={id}` |
| Admin confirm | `https://YOUR_DOMAIN/hy/admin/payments` |
| Stripe webhook | `https://YOUR_DOMAIN/api/checkout/webhook` |
| iDram RESULT_URL | `https://YOUR_DOMAIN/api/payments/idram/callback` |
| TelCell callback | `https://YOUR_DOMAIN/api/payments/telcell/callback` |
| Success (user) | `https://YOUR_DOMAIN/hy/checkout/success?paymentId={id}` |
| Card checkout | `https://YOUR_DOMAIN/hy/checkout/card?paymentId={id}` |
| Cancel (user) | `https://YOUR_DOMAIN/hy/checkout/cancel?paymentId={id}` |

---

## 9. Ստուգացանկ

- [ ] `OWNER_BANK_*` set on Vercel + redeploy
- [ ] Pricing → Bank transfer → instructions page works
- [ ] Admin confirms PENDING bank payment → package unlocks
- [ ] Early-bird free claim still works while slots remain
- [ ] Paid path does **not** reduce early-bird remaining
- [ ] (Optional) Stripe live keys + webhook
- [ ] (Optional) iDram / TelCell merchant + callback tested
- [ ] `/hy/admin/payments` shows revenue
- [ ] Production-ում demo checkout **չի** բացվում երբ provider կա
