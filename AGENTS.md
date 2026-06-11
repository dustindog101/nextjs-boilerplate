# AGENTS.md — ID Pirate Agent Context

> **Purpose**: Machine-readable context for AI coding assistants. Paste this file into any new AI session to resume work. Read this before touching any file.

---

## CRITICAL RULES (never violate these)

1. **Dark mode only** — Background is always `#09090B`. Never introduce white/light backgrounds.
2. **Glass cards only** — All card surfaces use `.glass` class. Never use `bg-gray-*`, `bg-zinc-*` for backgrounds.
3. **API calls only through `lib/apiClient.ts`** — Never call `/api/*` routes or Lambda URLs directly from components/pages.
4. **localStorage only through `lib/storage.ts`** — Use `getStorageItem` / `setStorageItem` / `removeStorageItem`. Never use `localStorage.*` directly.
5. **Lambda URLs are server-only** — Never add `NEXT_PUBLIC_` prefix to env vars. Route Handlers proxy all requests.
6. **Prices display in amber** — Always use `.text-price` class for dollar amounts. Never use other colors for prices.
7. **Do not break the "Bold Minimal" design** — See design rules below.

---

## Project Identity

- **Name**: ID Pirate
- **Type**: Novelty ID ordering platform
- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4
- **Root path**: `/Users/king/coding/web/idpirate/nextjs-boilerplate`
- **Dev command**: `npm run dev` (port 3000) — run from owner's terminal (may hit EPERM from AI terminal due to macOS disk permissions)
- **Deployment**: Vercel

---

## File Map (with line counts)

### Config


| File                 | Lines | Notes                               |
| -------------------- | ----- | ----------------------------------- |
| `package.json`       | 28    | Dependencies and npm scripts        |
| `tsconfig.json`      | 28    | Strict TypeScript, `@/`* path alias |
| `next.config.ts`     | 33    | Security headers                    |
| `postcss.config.mjs` | 3     | Tailwind PostCSS plugin             |


### Lambda sources (`lambda functions/`)

Python Lambda code lives in `**lambda functions/`** at the repo root (folder name includes a space). Deploy these to AWS and point Vercel env vars at the Function URLs.


| Folder                           | Role                                                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ID-Pirate-CreateOrder-Function` | `ORDER_LAMBDA_URL` — create order                                                                                                                              |
| `idPirateOrderLookup`            | `LOOKUP_LAMBDA_URL` — track, discounts, crypto payment intents, `list_user_orders`, `validate_reseller`, etc.                                                    |
| `admin_handler`                  | `ADMIN_LAMBDA_URL` — admin CRUD; Payments hub APIs (`get_payment_activity_summary`, `list_payment_intents`); keep `**admin_update_order`** for the admin UI   |
| `payment_watcher`                | EventBridge `rate(2 minutes)` — polls blockchains, marks orders paid (not a Function URL)                                                                      |
| `shared/order_pricing.py`          | Server-side order totals — zip with **Create Order only** (no crypto dependency)                                                                               |
| `payment_shared/`                  | Crypto gateway — `admin_activity.py` (Activity ledger APIs), handlers, settings; zip with LOOKUP, admin_handler, payment_watcher when enabling payments        |
| `reseller_handler`               | `RESELLER_LAMBDA_URL` — reseller-only: list/get/update orders; **PyJWT** via layer or zip (`scripts/build-pyjwt-lambda-layer.sh` for 3.13+3.14 — see SETUP.md) |
| `idPirate_auth`                  | `AUTH_LAMBDA_URL`                                                                                                                                              |


### Library (`lib/`)


| File                                                 | Lines | Purpose                                                                                        |
| ---------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| `apiClient.ts`                                       | ~500  | All API functions — `apiFetch`, `fetchResellerOrders`, `resellerUpdateOrder`, etc.             |
| `types.ts`                                           | 86    | `JwtPayload`, `IdFormData`, `OrderDetails`, `TrackingStage`, `PaymentMethod`                   |
| `constants.ts`                                       | 86    | `stateOptions`, `statePrices`, `defaultIdPrice`, `handlingFee`, `shippingFee`, dropdown arrays |
| `paymentConstants.ts` / `paymentTypes.ts`            | —     | Crypto asset metadata, payment intent types                                                    |
| `lib/payments/`                                      | —     | Crypto client API — `api.ts`, `rails.ts`, `originLabel.ts`, `intentStatus.ts`; import from `@/lib/payments` |
| `storage.ts`                                         | 46    | SSR-safe localStorage: `getStorageItem`, `setStorageItem`, `removeStorageItem`                 |
| `localStorage-polyfill.ts`                           | ~30   | Polyfill imported first in `layout.tsx` to fix Next.js dev mode bug                            |
| `validateReseller.ts`                                | —     | Reseller upload session: LOOKUP validation + dev slug allowlist (`RESELLER_UPLOAD_DEV_SLUGS`)  |
| `r2.ts` / `imagePrepare.ts` / `uploadUserMessage.ts` | —     | R2 presign helpers, image pipeline, upload error copy                                          |


### Pages (`app/`)


| Route             | File                      | Lines | Auth Guard         | Notes                                                                        |
| ----------------- | ------------------------- | ----- | ------------------ | ---------------------------------------------------------------------------- |
| `/`               | `page.tsx`                | 219   | None               | Hero, feature grid, state cards, FAQ accordion                               |
| `/account`        | `account/page.tsx`        | 199   | None               | Login/Register tabbed form                                                   |
| `/order`          | `order/page.tsx`          | 93    | None               | State ID gallery grid                                                        |
| `/order/new`      | `order/new/page.tsx`      | 407   | `withAuth`         | Multi-ID form, sidebar, mobile nav, completion dots                          |
| `/checkout`       | `checkout/page.tsx`       | 289   | `withAuth`         | Order review, shipping, payment (Crypto sub-picker or manual), submit          |
| `/checkout/pay/[orderId]` | `checkout/pay/[orderId]/page.tsx` | — | `withAuth` | Crypto invoice: exact amount, QR, poll status, cancel/switch                 |
| `/dashboard`      | `dashboard/page.tsx`      | 180   | `withAuth`         | Stat cards, order list                                                       |
| `/orders`         | `orders/page.tsx`         | —     | `withAuth`         | All orders list                                                              |
| `/track`          | `track/page.tsx`          | ~143  | None               | Order search, auto-fill from URL params                                      |
| `/news`           | `news/page.tsx`           | 82    | None               | News feed                                                                    |
| `/terms`          | `terms/page.tsx`          | ~85   | None               | Simple text page                                                             |
| `/privacy`        | `privacy/page.tsx`        | ~85   | None               | Simple text page                                                             |
| `/admin`          | `admin/page.tsx`          | 49    | `withAdminAuth`    | Metrics, orders, **Payments** hub (Activity + Gateways)                      |
| `/reseller`       | `reseller/page.tsx`       | —     | `withResellerAuth` | Reseller dashboard (orders, link, analytics)                                 |
| `/invoices`       | `invoices/page.tsx`       | —     | —                  | Stub — purpose TBD                                                           |
| `/za`             | `za/page.tsx`             | —     | —                  | Stub — purpose TBD                                                           |
| `/r/[resellerId]` | `r/[resellerId]/page.tsx` | —     | None (public)      | White-label checkout (subdomain → middleware rewrite); light/dark appearance |


### API Route Handlers (`app/api/`)


| Route                                | File                                 | Proxies To                                                       |
| ------------------------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| `POST /api/auth`                     | `auth/route.ts`                      | `AUTH_LAMBDA_URL`                                                |
| `GET /api/orders`                    | `orders/route.ts`                    | `LOOKUP_LAMBDA_URL` (`list_user_orders`)                         |
| `POST /api/orders`                   | `orders/route.ts`                    | `ORDER_LAMBDA_URL` (create order)                                |
| `GET /api/reseller/orders`           | `reseller/orders/route.ts`           | `RESELLER_LAMBDA_URL` (`list_reseller_orders`)                   |
| `GET /api/reseller/orders/[id]`      | `reseller/orders/[orderId]/route.ts` | `RESELLER_LAMBDA_URL` (`get_reseller_order`)                     |
| `POST /api/reseller/update-order`    | `reseller/update-order/route.ts`     | `RESELLER_LAMBDA_URL` (`update_reseller_order`)                  |
| `POST /api/orders/track`             | `orders/track/route.ts`              | `LOOKUP_LAMBDA_URL` (also `list_crypto_methods`, `create_payment_intent`, `get_payment_intent`, `cancel_payment_intent`; `payToken` for guests) |
| `POST /api/payments/pay-session`     | `payments/pay-session/route.ts`      | Mints HMAC pay token for guest/white-label crypto (`PAY_TOKEN_SECRET`) |
| `POST /api/reseller/payment-intent`  | `reseller/payment-intent/route.ts`   | `RESELLER_LAMBDA_URL` (`get_reseller_payment_intent`) |
| `POST /api/admin`                    | `admin/route.ts`                     | `ADMIN_LAMBDA_URL` (incl. `get_payment_activity_summary`, `list_payment_intents`) |
| `POST /api/uploads/presign`          | `uploads/presign/route.ts`           | Presigned PUT to R2 (user JWT or reseller session token)         |
| `POST /api/uploads/reseller-session` | `uploads/reseller-session/route.ts`  | Mints reseller upload token (`LOOKUP_LAMBDA` validates reseller) |
| `POST /api/uploads/presign-get`      | `uploads/presign-get/route.ts`       | Admin-only presigned GET for R2 keys                             |
| `POST /api/uploads/presign-get-own`  | `uploads/presign-get-own/route.ts`   | User: presigned GET for own order assets                         |
| `POST /api/uploads/delete`           | `uploads/delete/route.ts`            | Delete R2 object (auth + key ownership rules)                    |


### Admin (`app/admin/components/`)

| File | Purpose |
| ---- | ------- |
| `PaymentsHubSection.tsx` | Payments sidebar section — Activity \| Gateways tabs |
| `PaymentActivitySection.tsx` | Invoice ledger, summary cards, filters, detail drawer |
| `PaymentGatewaysSection.tsx` | Crypto deposit addresses + future rail placeholders |
| `PaymentSettingsSection.tsx` | Legacy — superseded by Payments hub (Gateways tab) |

Admin sidebar label: **Payments** (not crypto-settings-only).

### Components (`app/components/`)


| File                   | Lines | Purpose                                                     |
| ---------------------- | ----- | ----------------------------------------------------------- |
| `UniversalHeader.tsx`  | 249   | Sticky header, desktop nav, user dropdown, mobile slide-out |
| `withAuth.tsx`         | 29    | HOC: redirects unauthenticated users to `/account`          |
| `withAdminAuth.tsx`    | 33    | HOC: redirects non-admins to `/dashboard`                   |
| `withResellerAuth.tsx` | —     | HOC: `/reseller` — requires `isReseller` or admin           |
| `icons/index.tsx`      | 199   | 20+ custom SVG icon components                              |
| `ui/Footer.tsx`        | 36    | Site footer with nav links                                  |
| `ui/Spinner.tsx`       | ~40   | Loading spinner (sm/md/lg) + `FullPageSpinner`              |
| `ui/FormInput.tsx`     | ~40   | Labeled text input (requires `label` prop)                  |
| `ui/FormSelect.tsx`    | ~50   | Labeled select dropdown                                     |
| `ui/FileInput.tsx`     | ~45   | File upload input                                           |
| `ui/UploadSlot.tsx`    | —     | R2 upload UI: progress, retry, Bold Minimal                 |
| `ui/Notification.tsx`  | ~80   | Toast notification with auto-dismiss                        |
| `ui/index.tsx`         | ~10   | Barrel exports for `ui/`                                    |


### Contexts & Hooks


| File                           | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `app/contexts/AuthContext.tsx` | JWT decode, `login()`, `logout()`, token in localStorage             |
| `app/hooks/useAuth.ts`         | Convenience hook wrapping `AuthContext`                              |
| `app/hooks/useOrder.ts`        | Order detail state — currently uses **mock data** (not wired to API) |


---

## Design System — "Bold Minimal"

### CSS Variables (defined in `app/globals.css`)

```css
--bg:             #09090B
--surface:        rgba(255,255,255,0.04)
--surface-hover:  rgba(255,255,255,0.07)
--border:         rgba(255,255,255,0.08)
--border-hover:   rgba(255,255,255,0.16)
--accent:         #6366F1   /* indigo */
--accent-hover:   #818CF8
--accent-subtle:  rgba(99,102,241,0.15)
--price:          #F59E0B   /* amber — always for prices */
--success:        #10B981
--error:          #EF4444
--info:           #3B82F6
--text-primary:   #FAFAFA
--text-secondary: #A1A1AA   /* zinc-400 */
--text-tertiary:  #71717A   /* zinc-500 */
--font-pirate:    'Pirata One', cursive
--font-sans:      'Inter', system-ui
--radius-lg:      1rem
--radius-xl:      1.25rem
```

### Utility Classes


| Class                   | What it does                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `.glass`                | Card surface: `var(--surface)` bg + `blur(24px)` + `var(--border)` 1px border + `var(--radius-xl)` |
| `.glass-hover`          | Hover lift: border lighten + shadow + scale                                                        |
| `.btn`                  | Base button: inline-flex, font-600, 0.875rem, focus ring                                           |
| `.btn-primary`          | Indigo fill                                                                                        |
| `.btn-outline`          | Transparent + border                                                                               |
| `.text-price`           | Amber, bold, tabular-nums                                                                          |
| `.text-label`           | 0.75rem, uppercase, letter-spaced, `var(--text-tertiary)`                                          |
| `.animate-fade-up`      | `translateY(16px)→0` entrance                                                                      |
| `.animate-fade-in`      | `scale(0.97)→1` entrance                                                                           |
| `.delay-1` – `.delay-6` | 75ms stagger increments                                                                            |


### State Patterns

```tsx
// Selected/active
className="bg-indigo-500/10 border-indigo-500/20"

// Error
className="bg-red-500/10 border-red-500/20 text-red-400"

// Success
className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
```

---

## Code Patterns

### Page Layout

```tsx
<div className="min-h-screen flex flex-col">
  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
    {/* content */}
  </div>
  <Footer />
</div>
```

Max-widths: `max-w-3xl` text pages · `max-w-6xl` dashboards · `max-w-7xl` galleries

### Page Header

```tsx
<header className="mb-10 sm:mb-12">
  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight animate-fade-up">
    Title
  </h1>
  <p className="mt-3 text-sm text-zinc-400 animate-fade-up delay-1">
    Subtitle
  </p>
</header>
```

### Form Input

```
w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/40
focus:border-indigo-500/60 focus:outline-none transition text-sm
```

### Auth Guard HOC Usage

```tsx
// User-only pages
export default withAuth(MyPage);

// Admin-only pages
export default withAdminAuth(AdminPage);

// Reseller dashboard (`isReseller` or admin)
export default withResellerAuth(ResellerPage);
```

### API Call Pattern

```tsx
import { someApiFunction } from '@/lib/apiClient';
import { getStorageItem } from '@/lib/storage';

const token = getStorageItem('idPirateAuthToken');
const result = await someApiFunction(token, payload);
```

---

## Authentication

- JWT stored at localStorage key: `idPirateAuthToken`
- Decoded client-side with `atob()` (no jwt library)
- JWT payload shape: `{ userId, username, role: 'user'|'admin', isReseller: boolean, exp, iat }`
- **TTL:** customers/resellers **1h** (`JWT_TTL_HOURS` on auth Lambda); **admins 8h** (`ADMIN_JWT_TTL_HOURS`). No refresh — re-login after `exp`.
- `AuthContext` exposes: `user`, `token`, `login(token)`, `logout()`

---

## Pricing (from `lib/constants.ts`)

```ts
statePrices = {
  'New Jersey': 100, 'Florida': 100, 'Texas': 100,
  'Pennsylvania': 90, 'Illinois': 90, 'Connecticut': 90, 'Arizona': 90,
  'Old Maine': 85, 'Washington': 85, 'Oregon': 85,
  'South Carolina': 85, 'Missouri': 85,
}
defaultIdPrice = 95
handlingFee    = 5
shippingFee    = 15
```

> Always import from `lib/constants.ts`. Do not hardcode prices in components.

---

## Environment Variables

```env
# Server-only (.env.local / Vercel env vars — NO NEXT_PUBLIC_ prefix)
AUTH_LAMBDA_URL=
LOOKUP_LAMBDA_URL=
ORDER_LAMBDA_URL=
ADMIN_LAMBDA_URL=
RESELLER_LAMBDA_URL=
# Cloudflare R2 (presigned uploads)
R2_ACCOUNT_ID=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_UPLOAD_TOKEN_SECRET=
# Guest crypto pay tokens (same value on LOOKUP Lambda)
PAY_TOKEN_SECRET=
# Local dev: comma-separated slugs allowed for reseller upload when LOOKUP does not know them (development only)
# RESELLER_UPLOAD_DEV_SLUGS=manny

# Crypto payment gateway — AWS Lambda env only (see integration/dynamodb/PAYMENT_GATEWAY.md)
# LOOKUP: COINGECKO_API_KEY= (optional)
# payment_watcher: ETHERSCAN_API_KEY=, SOLANA_RPC_URL= (optional), HELIUS_API_KEY= (optional)
```

---

## Cost, free tier, and scale (owner intent)

The project aims to **stay within free tiers** of the services in use (e.g. **Vercel** hosting, **AWS** Lambda/DynamoDB where applicable, **Cloudflare R2** storage) **when possible**, and to **avoid patterns that explode cost** as usage grows.

**When writing or reviewing code, keep in mind:**

- **Today and tomorrow:** Prefer designs that stay efficient at **low volume** *and* remain reasonable if **customers, orders, uploads, or API traffic grow** (avoid unnecessary full-table scans, unbounded polling, chatty N+1 Lambdas, huge payloads, or features that require expensive tiers by default).
- **Backend:** Favor **keys and queries** that match DynamoDB access patterns; add **pagination** before large lists become hot paths; be cautious with **scan**-heavy admin metrics at scale.
- **Uploads / R2:** Lifecycle and prefix rules (see `integration/r2/R2-LIFECYCLE.md`) support controlling storage growth; CORS and presign patterns should stay lean.
- **New dependencies or services:** Consider **free-tier limits and billing surprises** before adding third-party APIs, heavy image processing on serverless, or always-on workers.

This is a **product constraint**, not a ban on ever paying for scale—when growth demands it, the owner may upgrade plans deliberately. Agents should **default to frugal, scalable patterns** unless the owner specifies otherwise.

---

## Middleware and multi-host behavior

- `**/api` and `/api/*`** are **never** rewritten by `middleware.ts` — API routes always hit `app/api/`** on the same host (fixes JSON/HTML mix-ups on reseller subdomains).
- **Reseller subdomains** (hosts not in the main-domain list) rewrite to `**/r/[subdomain]/...`** and set header `**x-idpirate-reseller-host`** for layout/header hiding.
- **White-label orders** store `**userId` = subdomain slug** and optional `**resellerId`**; the reseller dashboard uses `**fetchResellerOrders`** → `**RESELLER_LAMBDA_URL**`, not `GET /api/orders`.
- **R2 browser uploads** require bucket **CORS** to include the **exact** page origin (e.g. `http://manny.localhost:3000`). See `integration/r2/R2-LIFECYCLE.md`.

---

## Known Technical Debt


| #   | Issue                                                                                                | Location                                             |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | `useOrder` hook uses hardcoded mock data                                                             | `app/hooks/useOrder.ts`                              |
| 2   | `/order/view` uses mock data, not real API                                                           | `app/order/view/page.tsx`                            |
| 3   | `submitOrder` sends client `id` field to backend                                                     | `lib/apiClient.ts` + `app/order/new/page.tsx`        |
| 4   | Direct `localStorage.setItem` in order form                                                          | `app/order/new/page.tsx` → `handleProceedToCheckout` |
| 5   | `/za` and `/invoices` pages are undocumented stubs                                                   | `app/za/`, `app/invoices/`                           |
| 6   | No test coverage                                                                                     | entire project                                       |
| 7   | `ARCHITECTURE.md` / `PROJECT_CONTEXT.md` may lag AGENTS; treat **AGENTS.md** as canonical for agents | docs                                                 |
| 8   | Reseller metrics/analytics UI may not match live order fields until aligned                          | `app/reseller/components/AnalyticsSection.tsx`       |


---

## Owner Preferences


| Preference   | Detail                                                                       |
| ------------ | ---------------------------------------------------------------------------- |
| Design       | "Bold Minimal" dark glassmorphic — no light themes, ever                     |
| Legal pages  | Plain headings + paragraphs. No cards, tags, or grid layouts                 |
| Complexity   | Clean functional code over over-engineered solutions                         |
| Animations   | `animate-fade-up` with stagger — subtle, not flashy                          |
| Icons        | Use `app/components/icons/index.tsx` first; `lucide-react` only in admin     |
| Errors       | Toast via `Notification` component — no `alert()` calls                      |
| Navigation   | Use Next.js `useRouter` — no direct `window.location` assignments            |
| Cost / scale | Prefer free-tier–friendly patterns; see **Cost, free tier, and scale** above |


---

## Quick Checklist for New Features

- Uses `.glass` for card surfaces
- Uses design tokens from `app/globals.css` (no hardcoded hex except via tokens)
- API calls go through `lib/apiClient.ts`
- localStorage access goes through `lib/storage.ts`
- Prices displayed with `.text-price`
- Page sections have `animate-fade-up` + stagger `delay-*`
- Responsive: `sm:` and `lg:` breakpoints
- No `alert()` — uses `Notification` component
- No `NEXT_PUBLIC_` on Lambda URL env vars
- New features: consider **Cost, free tier, and scale** (pagination, avoid scans, bounded payloads)

---

## Deploy and backend checklist (human or agent)

- **Vercel:** Set all Lambda Function URLs + `**RESELLER_LAMBDA_URL`** after deploying `lambda functions/reseller_handler` (same `**JWT_SECRET`** and DynamoDB access as other handlers).
- **Repo vs AWS:** Source of truth for Python handlers is `**lambda functions/`** (not `aws/handlers/` — that path may be absent or legacy in this repo).
- **Admin vs reseller:** Admin order tools use `**POST /api/admin`**; reseller dashboard uses `**/api/reseller/*`** only.
- **Crypto payments:** Create DynamoDB tables `idPirate_settings`, `idPirate_payment_intents` (see `integration/dynamodb/PAYMENT_GATEWAY.md`). Deploy `payment_watcher` with EventBridge `rate(2 minutes)`. Zip `payment_shared/` with LOOKUP, Create Order, admin_handler, and payment_watcher.

