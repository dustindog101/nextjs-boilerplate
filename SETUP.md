# ID Pirate Setup Guide

## Purpose
This guide gets a new developer from zero to a running local instance of ID Pirate with correct environment configuration and known caveats.

## Prerequisites
1. Node.js `18+` (Node `20+` recommended for current Next.js ecosystem stability).
2. npm (bundled with Node).
3. Access to AWS Lambda Function URLs used by this app:
   - Auth Lambda
   - Order submit Lambda
   - Order lookup Lambda
   - Admin Lambda

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
Create `.env.local` in project root with:

```env
AUTH_LAMBDA_URL=https://<auth-lambda-function-url>
ORDER_LAMBDA_URL=https://<order-submit-lambda-function-url>
LOOKUP_LAMBDA_URL=https://<order-lookup-lambda-function-url>
ADMIN_LAMBDA_URL=https://<admin-lambda-function-url>
```

Important:
- Keep these server-only. Do not use `NEXT_PUBLIC_` prefix.
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

Use these before merge/deploy:
- `lint` catches style/type issues surfaced by Next tooling.
- `build` validates production compile path.
- `start` validates built runtime.

## 6) Smoke-Test Critical User Flows
1. `/account`:
   - register a test user
   - log in and confirm redirect to `/dashboard`
2. `/order/new`:
   - create at least one ID entry
   - proceed to `/checkout`
3. `/checkout`:
   - submit an order
4. `/track`:
   - lookup created order by ID
5. `/admin` (with admin JWT):
   - open metrics/users sections and verify data loads

## 7) Deployment Notes (Vercel + Lambda)
- Next.js app is deployed on Vercel.
- Route Handlers in `app/api/*` proxy all backend calls.
- Lambda URLs stay private to server runtime via environment variables.

## Troubleshooting
## App says service not configured (503)
Cause: missing env variable for corresponding route handler.
Fix: check `.env.local` names exactly match:
- `AUTH_LAMBDA_URL`, `ORDER_LAMBDA_URL`, `LOOKUP_LAMBDA_URL`, `ADMIN_LAMBDA_URL`

## Dashboard/admin requests return auth errors
Cause: missing/expired token or malformed Authorization header path.
Fix:
- re-login via `/account`
- verify token exists in storage key `idPirateAuthToken`

## Order details or discount validation behaves unexpectedly
Known risk:
- `app/api/orders/track/route.ts` currently forces `requestType: summary` for all requests; this may conflict with API client methods expecting `get_order` and `validate_discount`.

## Reasoning and Justification
- This setup sequence mirrors actual runtime boundaries: frontend -> Next route handlers -> Lambda URLs.
- Environment setup is emphasized early because all major flows hard-fail without Lambda endpoints.
- Smoke tests are route-based and user-centric to verify wiring, not just compile success.

## Assumptions
1. AWS Lambdas are already deployed and reachable.
2. Provided Lambda URLs correspond to handlers that implement current request contracts.
3. Developer has permission to invoke those Function URLs from local environment.

## Blind Spots / Limitations
- No `.env.example` file was found, so env documentation is inferred from route handler code.
- There is no automated integration test suite in this repository.
- AWS infra provisioning steps (table/index creation, IAM policy setup) are not fully described in this codebase.
