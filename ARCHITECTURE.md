# ID Pirate Architecture

## Scope and Method

This document is based on direct code inspection of:

- `app/` (App Router pages, route handlers, components, contexts)
- `lib/` (API client, storage wrappers, constants, shared types)
- `lambda functions/` (Python Lambda sources — **authoritative** backend copy in this repo)
- root runtime config (`next.config.ts`, `middleware.ts`, `package.json`)

Excluded intentionally: `node_modules`, `.git`, `.next`, lockfiles, minified assets.

> **Canonical agent context:** [AGENTS.md](./AGENTS.md) is updated more often for AI coding assistants. If this file disagrees, prefer AGENTS for routing and env rules.

## High-Level System Design

ID Pirate is a Next.js 16 application that uses:

- Client-rendered React pages for UX
- Next.js Route Handlers (`app/api/*`) as a server-side proxy boundary
- AWS Lambda Function URLs for backend business logic
- DynamoDB as persistence for users, orders, discounts, and batches
- Cloudflare R2 for presigned uploads (photos/signatures)

```text
Browser (React client components)
  -> lib/apiClient.ts (single frontend API gateway)
  -> Next.js Route Handlers (/api/auth, /api/orders, /api/orders/track, /api/admin, /api/reseller/*, /api/uploads/*)
  -> AWS Lambda handlers + R2 presign routes
  -> DynamoDB tables + R2 bucket
```

## Cost, free tier, and scale

The owner aims to **stay within free tiers** (Vercel, AWS Lambda/DynamoDB, Cloudflare R2, etc.) **when possible** and to avoid architectures that **break the bank as usage grows**. Implementation choices should favor **efficient access patterns** (queries over scans, pagination for large lists), **bounded uploads**, and **minimal redundant Lambda invocations**. See [AGENTS.md](./AGENTS.md) (*Cost, free tier, and scale*) for coding-agent guidance.

## Runtime Boundaries

### 1) Frontend/UI Layer

- Primary code: `app/**/*.tsx`
- Global shell in `app/layout.tsx` wraps pages with `AuthProvider` and `UniversalHeader` (header can be hidden on reseller hosts via `middleware` + `x-idpirate-reseller-host`).
- Route protection:
  - `withAuth` — authenticated user routes
  - `withAdminAuth` — admin-only routes
  - `withResellerAuth` — `/reseller` (reseller or admin)

### 2) Frontend Service Layer

- `lib/apiClient.ts` is the central API facade.
- Examples: `loginUser`, `registerUser`, `fetchUserOrders`, `fetchResellerOrders`, `submitOrder`, `trackOrder`, admin helpers, `resellerUpdateOrder`, upload helpers.

### 3) Server Proxy Layer (BFF Pattern)

- Route handlers in `app/api/*` keep Lambda URLs server-only.
- Env vars: `AUTH_LAMBDA_URL`, `ORDER_LAMBDA_URL`, `LOOKUP_LAMBDA_URL`, `ADMIN_LAMBDA_URL`, `RESELLER_LAMBDA_URL`, plus R2-related vars for upload routes.

**Reseller traffic** uses `app/api/reseller/*` → `RESELLER_LAMBDA_URL` (`reseller_handler`: list/get/update whitelabel orders). **End-user** order listing (`GET /api/orders`, `list_user_orders`) uses `LOOKUP_LAMBDA_URL`. **Admin** uses `POST /api/admin` → `ADMIN_LAMBDA_URL` (including `admin_update_order` for the admin UI).

### 4) Backend Layer (AWS Lambda)

Source in repo: `lambda functions/` (use these filenames when deploying).

| Folder | Env var | Notes |
| ------ | ------- | ----- |
| `idPirate_auth` | `AUTH_LAMBDA_URL` | Login/register, JWT |
| `ID-Pirate-CreateOrder-Function` | `ORDER_LAMBDA_URL` | Create order; stores `userId`, `source`, `resellerId`, `ids` with `photoKey`/`signatureKey` |
| `idPirateOrderLookup` | `LOOKUP_LAMBDA_URL` | Public track/summary, `validate_discount`, `validate_reseller`, `list_user_orders`, `get_order` |
| `admin_handler` | `ADMIN_LAMBDA_URL` | Admin-only ops; `admin_update_order`, `list_all_orders`, users, discounts, metrics |
| `reseller_handler` | `RESELLER_LAMBDA_URL` | `list_reseller_orders`, `get_reseller_order`, `update_reseller_order` — ownership by JWT `username` vs order slug (see AGENTS) |

Legacy references to `aws/handlers/` in older docs should be treated as superseded by `lambda functions/` in this repository.

### 5) Data Layer (DynamoDB + R2)

Inferred from handler code:

- `idPirate_users`
- `idPirate_orders` (`UserIdIndex` GSI on `userId`)
- `idPirate_discounts`
- `idPirate_batches`
- R2 bucket for upload keys under `u/` and `r/` prefixes

## Core Data Flows

### Authentication Flow

1. User submits login/register on `/account`.
2. `loginUser`/`registerUser` → `POST /api/auth` → `AUTH_LAMBDA_URL`.
3. JWT stored via `setStorageItem('idPirateAuthToken', token)`.

### Order Creation Flow

1. `/order/new` → storage → `/checkout` (authenticated) **or** whitelabel `/r/[resellerId]` (anonymous).
2. `submitOrder()` → `POST /api/orders` → `ORDER_LAMBDA_URL`.
3. Whitelabel payload includes `userId` = slug, `resellerId` = slug, `source: 'reseller_portal'`.

### Order Listing / Dashboard Flow

1. `/dashboard` / `/orders`: `fetchUserOrders()` → `GET /api/orders` → LOOKUP `list_user_orders` (JWT `userId`).
2. `/reseller`: `fetchResellerOrders()` → `GET /api/reseller/orders` → `RESELLER_LAMBDA_URL` `list_reseller_orders` (slug + optional UUID merge).

### Reseller Update Flow

- `resellerUpdateOrder()` → `POST /api/reseller/update-order` → `reseller_handler` `update_reseller_order`.
- Admin panel order edits → `POST /api/admin` with `admin_update_order` (unchanged).

### Public Tracking Flow

1. `/track` → `POST /api/orders/track` → LOOKUP.
2. Route handler **forwards the JSON body as-is** (including `requestType` from the client). *Older docs that claimed `requestType` was forced to `summary` are outdated.*

### Admin Flow

1. `/admin` → `POST /api/admin` → `ADMIN_LAMBDA_URL`, `verify_admin_jwt`.

## Middleware

- `/api` and `/api/*` are excluded from reseller subdomain rewrites so API calls always hit Next Route Handlers.
- Non-main hosts rewrite to `/r/[subdomain]...` for white-label pages.

## Cross-Cutting Rules

- Token storage: `lib/storage.ts`.
- Pricing: `lib/constants.ts`.
- Types: `lib/types.ts`.
- Security headers: `next.config.ts`.

## Risks / Follow-Ups

1. `validate_reseller` in LOOKUP uses `users_table.get_item(Key={'userId': reseller_id})` — if users use a composite key in production, this may need alignment with `admin_handler` patterns.
2. **Reseller** `list_reseller_orders` has no pagination yet — add `LastEvaluatedKey` if order volume grows.
3. **Styling:** `ResellerOrdersSection` uses light-theme pills; main site uses Bold Minimal dark tokens — cosmetic drift.
4. **Tests:** No automated integration tests in repo.

## Assumptions

1. Lambda code deployed to AWS matches `lambda functions/` in this repo (or document drift).
2. `JWT_SECRET` matches across auth, lookup, admin, and reseller Lambdas.
3. `RESELLER_LAMBDA_URL` is set wherever `/reseller` is used in production.
