# ID Pirate Architecture

## Scope and Method
This document is based on direct code inspection of:
- `app/` (App Router pages, route handlers, components, contexts)
- `lib/` (API client, storage wrappers, constants, shared types)
- `aws/handlers/` (Lambda handlers for auth, admin, order lookup)
- root runtime config (`next.config.ts`, `middleware.ts`, `package.json`)

Excluded intentionally: `node_modules`, `.git`, `.next`, lockfiles, minified assets.

## High-Level System Design
ID Pirate is a Next.js 16 application that uses:
- Client-rendered React pages for UX
- Next.js Route Handlers (`app/api/*`) as a server-side proxy boundary
- AWS Lambda Function URLs for backend business logic
- DynamoDB as persistence for users, orders, discounts, and batches

```text
Browser (React client components)
  -> lib/apiClient.ts (single frontend API gateway)
  -> Next.js Route Handlers (/api/auth, /api/orders, /api/orders/track, /api/admin)
  -> AWS Lambda handlers (auth_handler, order_lookup, admin_handler, order-create handler URL)
  -> DynamoDB tables
```

## Runtime Boundaries
### 1) Frontend/UI Layer
- Primary code: `app/**/*.tsx`
- Global shell in `app/layout.tsx` wraps all pages with:
  - `AuthProvider` (`app/contexts/AuthContext.tsx`)
  - `UniversalHeader`
- Route protection:
  - `withAuth` for authenticated routes
  - `withAdminAuth` for admin-only routes

### 2) Frontend Service Layer
- `lib/apiClient.ts` is the central API facade.
- Components/pages should not call `/api/*` directly; they call typed functions like:
  - `loginUser`, `registerUser`
  - `fetchUserOrders`, `submitOrder`, `trackOrder`
  - admin functions (`adminGetMetrics`, `adminUpdateOrder`, etc.)

### 3) Server Proxy Layer (BFF Pattern)
- Route handlers in `app/api/*` keep Lambda URLs server-only and forward requests.
- Env vars used:
  - `AUTH_LAMBDA_URL`
  - `ORDER_LAMBDA_URL`
  - `LOOKUP_LAMBDA_URL`
  - `ADMIN_LAMBDA_URL`

### 4) Backend Layer (AWS Lambda)
- `aws/handlers/auth_handler.py`:
  - Handles `requestType: login | register`
  - Reads/writes users in `idPirate_users`
  - Issues JWT with `userId`, `username`, `role`, `isReseller`, `exp`
- `aws/handlers/order_lookup.py`:
  - Public: `track/summary`, `validate_discount`
  - Protected: `list_user_orders`, `get_order` (JWT required)
  - Reads orders from `idPirate_orders`, discounts from `idPirate_discounts`
- `aws/handlers/admin_handler.py`:
  - Admin JWT required for all operations
  - User/order/discount/referral/metrics operations
  - Touches `idPirate_users`, `idPirate_orders`, `idPirate_discounts`, `idPirate_batches`

### 5) Data Layer (DynamoDB)
Inferred from handler code:
- `idPirate_users` (uses `UsernameIndex` GSI)
- `idPirate_orders` (uses `UserIdIndex` GSI)
- `idPirate_discounts`
- `idPirate_batches`

## Core Data Flows
## Authentication Flow
1. User submits login/register on `/account`.
2. Page calls `loginUser`/`registerUser` in `lib/apiClient.ts`.
3. API client calls `/api/auth` (route handler).
4. Route handler forwards payload to `AUTH_LAMBDA_URL`.
5. Lambda validates credentials and returns JWT (login).
6. `AuthContext.login()` stores token using `setStorageItem('idPirateAuthToken', token)`.
7. Auth state drives redirects and role checks in guards.

## Order Creation Flow
1. `/order/new` collects one or more ID forms.
2. Forms are saved to local storage key `idPirateOrderForms`.
3. `/checkout` loads forms from storage, computes totals, allows discount validation.
4. Submit action calls `submitOrder()` -> `POST /api/orders`.
5. `/api/orders` forwards to `ORDER_LAMBDA_URL`.
6. On success, local storage order forms are cleared.

## Order Listing / Dashboard Flow
1. `/dashboard` calls `fetchUserOrders()`.
2. API client sends `GET /api/orders` with Bearer token.
3. Route handler forwards token + `requestType: list_user_orders` to `LOOKUP_LAMBDA_URL`.
4. Lambda verifies JWT and returns user-scoped orders.

## Public Tracking Flow
1. `/track` submits an order ID.
2. API client calls `/api/orders/track`.
3. Route handler forwards as `requestType: summary`.
4. Lookup Lambda returns non-auth order summary.

## Admin Flow
1. `/admin` UI and components call admin APIs from `lib/apiClient.ts`.
2. API client sends `POST /api/admin` with Bearer token.
3. Route handler proxies to `ADMIN_LAMBDA_URL`.
4. Admin Lambda validates `role === 'admin'`, dispatches by `requestType`.

## Cross-Cutting Design and Architecture Rules
- Token storage/read is centralized via `lib/storage.ts`.
- Pricing constants come from `lib/constants.ts`.
- Shared data contracts live in `lib/types.ts`.
- Security headers are applied globally in `next.config.ts`.
- Middleware rewrites reseller subdomains to `/r/[subdomain]...` (when host is not main domain).

## Notable Inconsistencies / Risks Found
1. `lib/apiClient.ts` sends multiple `requestType`s (`get_order`, `validate_discount`) to `/api/orders/track`, but `app/api/orders/track/route.ts` currently rewrites every request to `requestType: summary`. This can break protected order fetch and discount validation behavior.
2. Styling conventions in AGENTS guidance and current `app/globals.css` differ (color tokens and visual system naming drift). Team should treat AGENTS rules as canonical intent unless explicitly superseded.
3. There are duplicate/legacy Lambda files in `aws/lambda_function*.py`; `aws/handlers/*` appears to be the more complete source set.

## Reasoning and Justification
- I modelled this as a BFF-proxy architecture because all frontend network calls terminate at Next Route Handlers first, not directly at Lambda URLs.
- I separated frontend service layer (`lib/apiClient.ts`) from UI layer because code already enforces this abstraction and it is the key seam for maintainability and future feature work.
- I documented DynamoDB entities from backend handler code instead of frontend guesses, because backend handlers are the authoritative source for table names and requestType dispatch behavior.

## Assumptions
1. The active backend code is `aws/handlers/*.py` (not the duplicate root lambda files).
2. Lambda URLs in `.env.local` point to deployed handlers that match current request payload shapes.
3. The order creation Lambda behind `ORDER_LAMBDA_URL` exists and is operational, even though its source is not clearly represented in `aws/handlers/`.

## Current Blind Spots / Limitations
- No tests were available to verify end-to-end behavior.
- No infrastructure-as-code files were validated for DynamoDB schema/index guarantees.
- Could not confirm which Lambda source files are actually deployed in AWS today.
- I did not inspect every page/component line-by-line; this architecture prioritizes runtime-critical paths.
