# Project Status — Crypto Payment Gateway + Site

*Production crypto gateway — mock mode removed.*

## Frontend (in git)

| Item | Status |
|------|--------|
| TypeScript / `npm run build` | Run `npm run build` after pull |
| Checkout manual payments | Unchanged |
| Checkout Crypto + pay modal (site-wide) | Live AWS only |
| Admin → Crypto Pay | Live AWS only |
| Guest pay token (`/api/payments/pay-session`) | Implemented |
| Public `/track` + white-label pay | Implemented |
| Reseller dashboard View payment | Implemented |
| `lib/payments/` module | Production-only |

## Backend (AWS Lambda — gitignored source on disk)

| Lambda | Deployed? | Notes |
|--------|-----------|--------|
| LOOKUP | **Yes** (us-east-1) | `list_crypto_methods`, intents, pay token |
| ADMIN | **Yes** | `get_payment_settings`, admin invoices |
| RESELLER | **Yes** | `get_reseller_payment_intent` |
| payment_watcher | **Yes** | EventBridge every 2 min |
| DynamoDB | **Yes** | `idPirate_settings`, `idPirate_payment_intents` |

**Docs:** [`integration/payments/CRYPTO_PAYMENTS.md`](payments/CRYPTO_PAYMENTS.md)

## Required env (Vercel)

```env
PAY_TOKEN_SECRET=...   # must match LOOKUP Lambda
LOOKUP_LAMBDA_URL=...
ADMIN_LAMBDA_URL=...
```

## Go-live

1. Admin → Crypto Pay: enable assets + deposit addresses
2. Test checkout → invoice → on-chain payment → Paid (~2 min)
3. See go-live checklist in `CRYPTO_PAYMENTS.md`
