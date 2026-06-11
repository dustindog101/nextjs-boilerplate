# Crypto payment gateway — operations runbook

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `CRYPTO_PAYMENTS_ENABLED` | LOOKUP, admin, payment_watcher | `false` kills gateway without code removal |
| `PAY_TOKEN_SECRET` | LOOKUP + Vercel (server-only) | HMAC for guest pay tokens (`openssl rand -hex 32`) |
| `JWT_SECRET` | All auth Lambdas | Must match across handlers |
| `COINGECKO_API_KEY` | LOOKUP | Optional; reduces rate limits |
| `ETHERSCAN_API_KEY` | payment_watcher | Required for USDC on EVM chains |
| `SOLANA_RPC_URL` | payment_watcher | Default public RPC |
| `HELIUS_API_KEY` | payment_watcher | Preferred Solana RPC when set |

## Deploy order

Redeploy **`admin_handler`** after changes to `payment_admin.py` or `payment_shared/admin_activity.py`.

1. Fix + zip Lambdas: `./scripts/build-payment-lambda-zips.sh`
2. Create DynamoDB tables — [`integration/dynamodb/PAYMENT_GATEWAY.md`](../dynamodb/PAYMENT_GATEWAY.md)
3. Upload LOOKUP, admin, Create Order, reseller (with `payment_shared/`)
4. Admin → Payments → Gateways: enable assets, set deposit addresses, TTL
5. Deploy payment_watcher + EventBridge `rate(2 minutes)`
6. Set Vercel `PAY_TOKEN_SECRET` (same value as LOOKUP)
7. Run smoke test: `LOOKUP_LAMBDA_URL=... ./integration/payments/smoke-test.sh`

## Monitoring

- **CloudWatch** — `payment_watcher` logs every 2 min: `processed`, `groups`, adapter errors
- **Stuck unpaid** — **Admin → Payments → Activity** first; filter `pending` / `detected`, verify tx hash. Watcher lag ~2 min after on-chain payment
- **Expired invoices** — watcher sets `expired` and clears `paymentIntentId` / `cryptoAsset` on order

## Common ops tasks

### Disable crypto quickly

Set `CRYPTO_PAYMENTS_ENABLED=false` on LOOKUP and admin. Checkout hides crypto; manual payments unchanged.

### Rotate deposit address

1. Admin → Payments → Gateways: update address for asset
2. Cancel any active invoices for that asset (admin order panel or customer cancel)
3. New checkouts get new address

### Customer invoice expired

Customer opens track → **View payment** → **Generate new invoice**. Old intent is expired; new unique amount issued.

### Manual mark Paid (ops exception)

Admin order panel → set payment status **Paid**. Prefer **cancel invoice** first if an open intent exists to avoid desync.

### Wrong amount on chain

Exact atomic match only — no partial credit. Underpayment stays `pending` until expiry.

### White-label / guest pay

No login required. `/api/payments/pay-session` mints 48h HMAC token; LOOKUP accepts `payToken` on intent routes.

### Reseller dashboard

**View payment** uses `get_reseller_payment_intent` (read-only). Customer pays via track link.

## Testing matrix (staging)

See full plan in project docs. Key paths:

- Main checkout crypto → order + intent → watcher confirms
- Public `/track` → pay session → modal without login
- White-label crypto checkout → track `?pay=1`
- Reseller dashboard View payment
- `CRYPTO_PAYMENTS_ENABLED=false` hides crypto
- Guest pay via `/track` without login
