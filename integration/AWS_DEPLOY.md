# AWS Deploy Checklist — Crypto Payment Gateway

Do these steps **in order** when you are ready for real crypto payments.  
Crypto payments require AWS deploy (see [`payments/CRYPTO_PAYMENTS.md`](payments/CRYPTO_PAYMENTS.md)). Manual checkout works without crypto tables.

---

## Phase 0 — What you already have

Your `.env.local` already points Vercel/Next.js at these Lambdas:

- `AUTH_LAMBDA_URL`
- `LOOKUP_LAMBDA_URL`
- `ORDER_LAMBDA_URL`
- `ADMIN_LAMBDA_URL`

Those keep handling login, orders, track, and manual checkout. **You do not change Vercel env vars for crypto** (same URLs).

---

## Phase 1 — DynamoDB (5 min)

AWS Console → **DynamoDB** → **Create table**

### Table 1: `idPirate_settings`

| Setting | Value |
|---------|--------|
| Partition key | `pk` (String) |
| Capacity | On-demand |

No GSI.

### Table 2: `idPirate_payment_intents`

| Setting | Value |
|---------|--------|
| Partition key | `intentId` (String) |
| Capacity | On-demand |

**Add GSI `OrderIdIndex`:** partition key `orderId` (String)  
**Add GSI `StatusExpiresIndex`:** partition key `status` (String), sort key `expiresAt` (String)

Or run CLI from [`integration/dynamodb/PAYMENT_GATEWAY.md`](dynamodb/PAYMENT_GATEWAY.md).

---

## Phase 2 — Update existing Lambdas (zip upload)

Code lives in **`lambda functions/`** on your machine (folder is gitignored — copy from your dev machine).

### Zip layout rule

Always include the **`payment_shared/`** folder at the **root of the zip** next to `lambda_function.py` when updating LOOKUP or admin.

### 2a. LOOKUP Lambda (`LOOKUP_LAMBDA_URL`)

**Files to zip:**

```
idPirateOrderLookup/lambda_function.py
idPirateOrderLookup/payment_routes.py
payment_shared/          (entire folder)
```

**AWS Console:** Lambda → your lookup function → **Code** → Upload from `.zip`  
**Handler:** `lambda_function.lambda_handler` (unchanged)

**Env vars (optional):**

| Key | Value |
|-----|--------|
| `COINGECKO_API_KEY` | optional — rate limits |
| `CRYPTO_PAYMENTS_ENABLED` | `true` (set `false` to disable without removing code) |
| `JWT_SECRET` | same as other Lambdas |

**Test after deploy:**

```bash
curl -s -X POST "$LOOKUP_LAMBDA_URL" -H 'Content-Type: application/json' \
  -d '{"requestType":"list_crypto_methods"}'
# Expect: {"methods":[...],"enabled":true}  (empty methods until admin configures addresses)
```

### 2b. ADMIN Lambda (`ADMIN_LAMBDA_URL`)

**Files to zip:**

```
admin_handler/lambda_function.py
admin_handler/payment_admin.py
payment_shared/
```

**Test:**

```bash
curl -s -X POST "$ADMIN_LAMBDA_URL" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"requestType":"get_payment_settings"}'
```

### 2c. CREATE ORDER Lambda (`ORDER_LAMBDA_URL`) — recommended

**Files to zip:**

```
ID-Pirate-CreateOrder-Function/lambda_function.py
shared/product_catalog.py   # keep in sync with lib/productCatalog.ts
shared/order_pricing.py
shared/__init__.py
```

Server-side order totals + discount validation. **No crypto dependency.**

---

## Phase 3 — New payment_watcher Lambda

### Create function

1. AWS Console → **Lambda** → **Create function**
2. Name: `idPirate-payment-watcher`
3. Runtime: **Python 3.12**
4. Architecture: arm64 or x86_64

**Zip contents:**

```
payment_watcher/lambda_function.py
payment_watcher/adapters/    (entire folder)
payment_shared/
```

**Handler:** `lambda_function.lambda_handler`  
**Timeout:** 30 seconds  
**Memory:** 256 MB

### IAM permissions

Attach policy allowing:

- `dynamodb:GetItem`, `Query`, `UpdateItem`, `PutItem`, `Scan` on:
  - `idPirate_orders`
  - `idPirate_settings`
  - `idPirate_payment_intents`

### Environment variables

| Key | Required | Notes |
|-----|----------|--------|
| `ETHERSCAN_API_KEY` | For USDC on Ethereum/Polygon/Base | [etherscan.io](https://etherscan.io/apis) — one key, V2 API |
| `SOLANA_RPC_URL` | Optional | Default `https://api.mainnet-beta.solana.com` |
| `HELIUS_API_KEY` | Optional | If Solana RPC rate-limits |
| `CRYPTO_PAYMENTS_ENABLED` | Optional | `true` — set `false` to skip watcher runs |

BTC + LTC use public APIs (no key). When `HELIUS_API_KEY` is set, Solana RPC uses Helius instead of `SOLANA_RPC_URL`.

### EventBridge schedule

1. **Amazon EventBridge** → **Rules** → **Create rule**
2. Name: `idPirate-payment-watcher-every-2-min`
3. Schedule: **Rate expression** → `rate(2 minutes)`
4. Target: your `idPirate-payment-watcher` Lambda
5. Create (allow Lambda invoke permission when prompted)

---

## Phase 4 — Configure in the app

1. Promote test admin — [`integration/TEST_ACCOUNTS.md`](TEST_ACCOUNTS.md)
2. Set Vercel / `.env.local`:

   ```env
   PAY_TOKEN_SECRET=<same value as LOOKUP Lambda — openssl rand -hex 32>
   ```

3. Redeploy **Vercel** (or restart `npm run dev`) so env updates
4. Log in as admin → **Crypto Pay**
5. Enable assets (e.g. BTC, USDC Base), paste **your** deposit addresses, Save
6. Log in as test user → checkout → **Crypto** → pick asset → complete flow

---

## Phase 5 — Verify end-to-end

| Step | Expected |
|------|----------|
| Checkout shows Crypto + sub-options | After admin enables assets |
| Pay page shows exact amount + QR | After order + invoice created |
| Watcher runs every 2 min | CloudWatch Logs on watcher Lambda |
| Send exact crypto amount | Order `paymentStatus` → Paid |

---

## Quick reference — what runs where

| Component | Host | You upload? |
|-----------|------|-------------|
| Next.js UI | Vercel | `git push` (normal) |
| Auth / Order / Lookup / Admin | AWS Lambda | Zip upload (Phases 2–3) |
| payment_watcher | AWS Lambda + EventBridge | New (Phase 3) |
| DynamoDB settings + intents | AWS | Create tables (Phase 1) |
| Block explorer APIs | External | API keys on watcher only |

---

## Turn off crypto without removing code

Lambda env on LOOKUP + watcher:

```
CRYPTO_PAYMENTS_ENABLED=false
```

Checkout falls back to manual payments only.
