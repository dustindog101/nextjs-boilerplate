# Lambda workflow (local source, not on GitHub)

Python handlers live in **`lambda functions/`** at the repo root. This folder is listed in **`.gitignore`** so it is **not pushed to GitHub**. The Next.js app on Vercel only needs Lambda Function URL env vars.

## For agents and developers

1. **Edit** handlers under `lambda functions/` (source of truth on disk).
2. **Build zips:** `./scripts/build-payment-lambda-zips.sh`
3. **Deploy to AWS:** `bash scripts/deploy-aws-crypto.sh --lambdas-only`  
   Requires AWS credentials and `.env.local` with `LOOKUP_LAMBDA_URL`, `ORDER_LAMBDA_URL`, etc.
4. **Keep pricing in sync:** `lib/pricing.ts` (frontend) and `lambda functions/shared/order_pricing.py` (Create Order).

## Optional local Git history

To version Lambda changes locally without pushing to GitHub:

```bash
cd "lambda functions"
git init
git add -A
git commit -m "describe change"
```

Do **not** add a `remote` unless you use a private repo. The parent repo ignores this entire directory.

## Exclude build artifacts

Never commit `**/.lambda_build/` or `*.zip` inside `lambda functions/`.

## Deploy mapping

| Zip | Lambda env var |
|-----|----------------|
| `dist/lambda-zips/create-order.zip` | `ORDER_LAMBDA_URL` |
| `dist/lambda-zips/lookup.zip` | `LOOKUP_LAMBDA_URL` |
| `dist/lambda-zips/admin.zip` | `ADMIN_LAMBDA_URL` |
| `dist/lambda-zips/reseller.zip` | `RESELLER_LAMBDA_URL` |
| `dist/lambda-zips/payment-watcher.zip` | EventBridge (no URL) |

See [AWS_DEPLOY.md](./AWS_DEPLOY.md) for full checklist.
