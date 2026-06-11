# Crypto Payment Gateway — Module Boundary

This feature is **optional**. The main site (orders, checkout with manual payments, track, admin) works without it.

## Independence rules

| Layer | Core site | Payment gateway only |
|-------|-----------|----------------------|
| **Create Order Lambda** | `shared/order_pricing.py` | — |
| **LOOKUP Lambda** | track, discount, orders | `payment_routes.py` → `payment_shared/` |
| **admin Lambda** | users, orders, discounts | `payment_admin.py` → `payment_shared/` |
| **New Lambda** | — | `payment_watcher/` (EventBridge) |
| **DynamoDB** | `idPirate_orders`, etc. | `idPirate_settings`, `idPirate_payment_intents` |
| **Frontend** | checkout manual methods | `lib/payments/`, `app/checkout/components/CryptoPaymentSection.tsx`, `app/checkout/pay/` |
| **Admin UI** | other sections | Admin → **Payments** (Activity ledger + Gateways) |

## Deploy without breaking the site

1. **Minimum deploy (core only):** LOOKUP + Create Order + admin — zip `shared/` with Create Order; LOOKUP does **not** require `payment_shared/`.
2. **Enable crypto later:** Add DynamoDB tables → zip `payment_shared/` with LOOKUP + admin → deploy `payment_watcher` + EventBridge.
3. **Disable crypto without removing code:** Set Lambda env `CRYPTO_PAYMENTS_ENABLED=false` on LOOKUP (and admin). Checkout hides Crypto when `list_crypto_methods` returns `[]`.

## Frontend module

```ts
import { listCryptoMethods, createPaymentIntent, CRYPTO_PAYMENT_PARENT_ID } from '@/lib/payments';
import { useCryptoPaymentMethods } from '@/app/hooks/useCryptoPaymentMethods';
```

`lib/apiClient.ts` re-exports payment functions for backward compatibility — prefer `@/lib/payments` for new work.

## Working on crypto separately

- Change watcher/adapters: only touch `lambda functions/payment_watcher/`
- Change invoice UX: `app/checkout/pay/`, `lib/payments/`, `CryptoPaymentSection.tsx`
- Change admin addresses: `PaymentGatewaysSection.tsx`, `payment_admin.py`
- Ops invoice ledger: `PaymentActivitySection.tsx`, `payment_shared/admin_activity.py` (`get_payment_activity_summary`, `list_payment_intents`)
- Do **not** change `shared/order_pricing.py` unless pricing rules change for all orders

## Zip layout for AWS

```
# Create Order (required)
ID-Pirate-CreateOrder-Function/lambda_function.py
shared/order_pricing.py
shared/__init__.py

# LOOKUP with crypto (optional add-on)
idPirateOrderLookup/lambda_function.py
idPirateOrderLookup/payment_routes.py
payment_shared/

# admin with crypto (optional add-on)
admin_handler/lambda_function.py
admin_handler/payment_admin.py
payment_shared/

# Watcher (crypto only)
payment_watcher/
payment_shared/

# Reseller (optional — payment intent read for dashboard)
reseller_handler/lambda_function.py
payment_shared/
```

Or run `./scripts/build-payment-lambda-zips.sh` to produce zips in `dist/lambda-zips/`.

## Guest pay tokens (production)

White-label and public `/track` use HMAC pay tokens (no login):

- Vercel: `PAY_TOKEN_SECRET` (server-only)
- LOOKUP Lambda: same `PAY_TOKEN_SECRET`
- Next.js: `POST /api/payments/pay-session` → `payToken` on intent API calls

See [`OPS_RUNBOOK.md`](OPS_RUNBOOK.md) for rollout and monitoring.

**Full guide:** [`CRYPTO_PAYMENTS.md`](CRYPTO_PAYMENTS.md) — architecture, security, UX flows, free tier.

See also: `integration/dynamodb/PAYMENT_GATEWAY.md`
