# Վճարումներ / Payments — Xndzor.com (Խնձոր․քոմ)

Քայլ առ քայլ՝ **իրական վճարումներ** ստանալու համար Հայաստանից։  
Աջակցվող միջոցներ՝ **Visa, Mastercard, ArCa** (Stripe), **iDram**, **TelCell**։

---

## 1. Stripe (քարտեր — Visa / Mastercard / ArCa)

### 1.1 Stripe հաշիվ

1. Գրանցվեք [stripe.com](https://stripe.com) — ընտրեք **Armenia** որպես երկիր (եթե հասանելի է)։
2. Dashboard → **Settings → Business** — լրացրեք բանկային հաշիվ payout-ների համար։
3. **Test mode** — մշակում և թեստ։ **Live mode** — իրական գումար։

> **AMD vs USD:** Կայքում գները ցուցադրվում են **դրամով (AMD)** (`src/lib/pricing.ts`)։  
> Stripe-ը հաճախ գանձում է **USD**-ով։ Փոխարժեքը՝ `AMD_PER_USD = 400`։  
> **ArCa** քարտերը Հայաստանում սովորաբար աշխատում են Stripe Checkout-ով — թեստավորեք live mode-ում։

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
- **Բանկային քարտ (Visa / MC / ArCa)** — on-site card form → `/[locale]/checkout/card?paymentId=…`
- **iDram** — երբ `IDRAM_SECRET_KEY` + `IDRAM_EDP_REC_ACCOUNT` set
- **TelCell** — երբ `TELCELL_MERCHANT_ID` + `TELCELL_SECRET` set

### 4.1 Card checkout flow (Visa / MC / ArCa)

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

**Demo mode (no Stripe/bank keys):** Full card + simulated ARCA SMS OTP. OTP logged to server console:

```
[DEMO] ARCA OTP for payment clxxx → +374***22: 123456
```

Optional testing: `DEMO_OTP_IN_RESPONSE=true` returns OTP in API response (**never in production**).

**Production — Stripe:** Stripe **PaymentIntent + Payment Element** (PCI — PAN/CVV never touch our server). 3D Secure / bank SMS handled by Stripe; UI copy references ARCA/բանկի հաստատում. Monthly subscriptions still use Stripe Checkout Session (redirect).

**Future — Armenian ArCa/bank gateway:** Merchant registers with bank, enables 3DS SMS. Env for gateway redirect if needed. Step 2 OTP UI matches bank SMS flow. See section 10 below.

**Security:** Never log full card number/CVV. Rate limit OTP (5 attempts). OTP expires 5 minutes.

**Demo mode:** local dev, երբ **ոչ մի** provider կարգավորված չէ → card checkout with simulated OTP  
**Production:** գոնե **մեկ** provider պարտադիր, հ contrary 503։

---

## 4b. Future — ArCa / bank direct integration

When integrating a local Armenian bank gateway (ArCa 3DS SMS):

1. Merchant registers with the bank and enables 3DS SMS on the merchant account.
2. Add gateway env vars (redirect URL, merchant ID, secret) — TBD per bank API.
3. Step 2 OTP UI on `/checkout/card` already matches bank SMS UX; wire `initiate`/`verify-otp` to bank APIs instead of demo OTP.
4. Keep `fulfillPayment()` as the single entitlement hook after bank confirms payment.

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
- CSRF token checkout POST-ի վրա
- Rate limit checkout + callbacks
- Server-side amounts from `pricing.ts` only

---

## 6b. Անվճար փաթեթներ (launch) / Free packages

By default **`PACKAGES_FREE=true`** (also the default when unset):

- Farm Pro, Buyer Pro, Verified Farm, TOP/Boost activate at **0 AMD**
- Checkout skips Stripe / iDram / TelCell and fulfills immediately (`provider: FREE`)
- Pricing page shows **Անվճար / Free** and **Ակտիվացնել / Activate**
- Catalog AMD amounts in `src/lib/pricing.ts` stay as reference for later paid launch

**Re-enable paid packages:**

```env
PACKAGES_FREE=false
```

Then configure at least one payment provider and restart the app. Users must activate packages again after expiry (or keep existing entitlements until `proUntil` / boost `endsAt`).

---

## 7. Env ամբողջական ցանկ

```env
# Free launch (default true) — set false when ready to charge
PACKAGES_FREE=true

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
PAYMENT_PROVIDER=stripe
DEMO_OTP_IN_RESPONSE=true
STRIPE_PRICE_FARM_PRO_MONTHLY=
# …
```

---

## 8. Production callback URLs (փոխարինեք YOUR_DOMAIN)

| Provider | URL |
|----------|-----|
| Stripe webhook | `https://YOUR_DOMAIN/api/checkout/webhook` |
| iDram RESULT_URL | `https://YOUR_DOMAIN/api/payments/idram/callback` |
| TelCell callback | `https://YOUR_DOMAIN/api/payments/telcell/callback` |
| Success (user) | `https://YOUR_DOMAIN/hy/checkout/success?paymentId={id}` |
| Card checkout | `https://YOUR_DOMAIN/hy/checkout/card?paymentId={id}` |
| Cancel (user) | `https://YOUR_DOMAIN/hy/checkout/cancel?paymentId={id}` |

---

## 9. Ստուգացանկ

- [ ] Stripe live keys + webhook
- [ ] iDram merchant + RESULT_URL callback tested
- [ ] TelCell merchant + callback tested
- [ ] TOP boost → հայտարարությունը վերևում
- [ ] Farm Pro / Verified ակտիվացվում են
- [ ] `/hy/admin/earnings` ցույց է տալիս վճարում
- [ ] Production-ում demo checkout **չի** բացվում
