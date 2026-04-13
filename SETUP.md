# ID Pirate Setup Guide

## Purpose

Get a new developer from zero to a running local instance with correct environment configuration and known caveats.

## Prerequisites

1. Node.js **18+** (Node **20+** recommended).
2. npm (bundled with Node).
3. AWS Lambda Function URLs for this app (see below).
4. Optional: Cloudflare R2 credentials for photo/signature uploads (see `.env.example`).

## 1) Clone and Enter Project

```bash
cd /path/to/workspace
git clone <repo-url> idpirate
cd idpirate
```

## 2) Install Dependencies

```bash
npm install
```

If you hit macOS `EPERM` permission errors, grant your terminal Full Disk Access and rerun install.

## 3) Configure Environment Variables

Copy **`.env.example`** to **`.env.local`** in the project root and fill in values.

**Required for core flows:**

```env
AUTH_LAMBDA_URL=https://<auth-lambda-function-url>
ORDER_LAMBDA_URL=https://<order-submit-lambda-function-url>
LOOKUP_LAMBDA_URL=https://<order-lookup-lambda-function-url>
ADMIN_LAMBDA_URL=https://<admin-lambda-function-url>
```

**Required for reseller dashboard (`/reseller`) and `/api/reseller/*`:**

```env
RESELLER_LAMBDA_URL=https://<reseller-lambda-function-url>
```

Deploy the handler from **`lambda functions/reseller_handler/`** (same `JWT_SECRET` and DynamoDB access as other Lambdas).

**R2 uploads (order photos/signatures):** set `R2_*` and `R2_UPLOAD_TOKEN_SECRET` as in `.env.example`. Bucket **CORS** must allow your dev origins (e.g. `http://manny.localhost:3000`). See `integration/r2/R2-LIFECYCLE.md`.

**Local reseller subdomain dev:** if LOOKUP does not know a slug, use `RESELLER_UPLOAD_DEV_SLUGS=manny` (development only) — see `lib/validateReseller.ts`.

Important:

- Keep Lambda and R2 secrets server-only. Do not use `NEXT_PUBLIC_` prefix.
- Do not commit `.env.local`.

## 4) Run Development Server

```bash
npm run dev
```

Open: `http://localhost:3000`

## 5) Optional Quality Commands

```bash
npm run lint
npm run build
npm run start
```

Use before merge/deploy.

## 6) Smoke-Test Critical Flows

1. **`/account`** — register, log in, confirm redirect to `/dashboard`.
2. **`/order/new`** → **`/checkout`** — submit order; verify **`/track`** with order ID.
3. **`/admin`** (admin JWT) — metrics/users load.
4. **`/reseller`** (reseller JWT) — orders list loads (**503** if `RESELLER_LAMBDA_URL` unset).
5. **White-label** — `http://<username>.localhost:3000` (or production subdomain) places order; reseller must have **`username`** matching the slug for orders to appear (see AGENTS.md).

## 7) Deployment Notes (Vercel + Lambda)

- Next.js app is deployed on Vercel.
- Route Handlers in `app/api/*` proxy all backend calls.
- Lambda URLs stay private to server runtime via environment variables.
- Python source of truth for handlers: **`lambda functions/`** (deploy to AWS after edits).
- **Cost:** The project aims to stay within **free tiers** where possible (Vercel, AWS, R2, etc.) and to avoid patterns that **scale cost poorly** as usage grows. See **[AGENTS.md](./AGENTS.md)** (*Cost, free tier, and scale*).

### Python Lambda dependencies (e.g. `reseller_handler`)

The AWS Python runtime includes `boto3` but **not** third-party packages. If CloudWatch shows `Runtime.ImportModuleError: No module named 'jwt'`, install **PyJWT** into the deployment artifact.

From the handler folder (example: `reseller_handler`):

```bash
cd "lambda functions/reseller_handler"
pip install -r requirements.txt -t .
zip -r ../reseller_handler-deploy.zip . -x "*.pyc" -x "**/__pycache__/*" -x "*.zip"
```

Upload **`reseller_handler-deploy.zip`** in Lambda → **Code** → **Upload from** `.zip`. Ensure **Handler** is `lambda_function.lambda_handler`.

Other handlers that use `import jwt` need the same pattern, or use a **Lambda layer** that provides PyJWT.

**Layer zip for Python 3.13 and 3.14:** AWS expects packages under `python/lib/python3.13/site-packages/` and `python/lib/python3.14/site-packages/` (a flat `python/jwt/` folder from a manual zip is often wrong). From repo root:

```bash
./scripts/build-pyjwt-lambda-layer.sh
```

This writes **`pyjwt-layer.zip`** at the repo root. Upload it as a new **layer version**, then attach it to each function that does `import jwt`. The same zip works on **either** runtime because both paths are included.

## Troubleshooting

### App says service not configured (503)

Cause: missing env variable for the route you hit.

Fix: ensure `.env.local` includes the URL for that route (e.g. **`RESELLER_LAMBDA_URL`** for `/reseller`).

### Dashboard/admin requests return auth errors

Cause: missing/expired token or wrong storage key.

Fix: re-login via `/account`; token key is **`idPirateAuthToken`** (use `lib/storage.ts` only).

### `POST /api/orders/track` / discount / order fetch

The route handler **forwards the request body unchanged** to `LOOKUP_LAMBDA_URL`. The client must send the correct **`requestType`** (`summary`, `validate_discount`, `get_order`, etc.).

### Uploads fail with network error

Usually **R2 CORS** or wrong origin. Add the exact browser origin to the bucket CORS policy.

## Reasoning

- Setup order mirrors runtime boundaries: frontend → Next route handlers → Lambda URLs.
- Environment setup is critical because flows fail fast without endpoints.
- `.env.example` is the template; this file explains what each group is for.

## Assumptions

1. AWS Lambdas are deployed and reachable.
2. Function URLs match the contracts in **`lambda functions/`** in this repo.
3. Developer can invoke Function URLs from local (network).

## Limitations

- No integration test suite in this repository.
- IAM and DynamoDB table setup are not fully described in code (see AWS console).
