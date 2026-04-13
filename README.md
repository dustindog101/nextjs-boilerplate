# ID Pirate 🏴‍☠️

> **Next.js 16 · React 19 · Tailwind CSS v4 · Serverless AWS**

A premium **novelty ID ordering platform** featuring a dark glassmorphic design system, serverless AWS backend, and a full order management flow.

---

## ✨ Features

- 🆔 **Browse & Order** — State ID gallery with per-state custom forms
- 💳 **Multi-payment Checkout** — Bitcoin, Zelle, Apple Pay, Cash App, Venmo
- 📦 **Order Tracking** — Public lookup by order ID
- 👤 **User Dashboard** — Order history, account management
- 🛡️ **Admin Panel** — User management, metrics, charts
- 🤝 **Reseller Program** — White-label checkout (`/r/[slug]` or subdomain), `/reseller` dashboard, dedicated reseller Lambda
- 📷 **R2 Uploads** — Presigned photo/signature uploads (Cloudflare R2)
- 🔐 **JWT Auth** — Stateless auth via AWS Lambda + localStorage

---

## 🚀 Quick Start

### Prerequisites

- Node.js **18+**
- AWS Lambda endpoints (see [Environment Variables](#-environment-variables))

### Install & Run

```bash
npm install
npm run dev        # Dev server → http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
```

> **macOS Note**: If you see `EPERM` errors on `node_modules`, your terminal may lack Full Disk Access. Grant it in *System Settings → Privacy & Security → Full Disk Access*.

---

## 🏗️ Architecture

### Request Flow

```
Browser
  ↓
Next.js Route Handlers (/api/*)       ← server-side proxy
  ↓
AWS Lambda Functions                  ← backend logic
  ↓
DynamoDB                              ← persistence
```

Lambda URLs are **never exposed to the client**. All sensitive keys live in server-only environment variables (no `NEXT_PUBLIC_` prefix).

### Key Directories


| Path                           | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `app/globals.css`              | Design tokens, utilities, animations — **read this first**    |
| `lib/apiClient.ts`             | **Only** place API calls should originate from                |
| `lib/constants.ts`             | Pricing, state list, dropdown options                         |
| `lib/types.ts`                 | Shared TypeScript interfaces                                  |
| `lib/storage.ts`               | SSR-safe localStorage wrappers                                |
| `app/components/ui/`           | Reusable "Bold Minimal" UI components                         |
| `app/api/`                     | Next.js Route Handlers (proxy to Lambda)                      |
| `lambda functions/`            | Python Lambda source (deploy to AWS; folder name has a space) |
| `app/contexts/AuthContext.tsx` | JWT auth state (React Context)                                |


### API Functions (`lib/apiClient.ts`)


| Function                | Route                             | Auth              |
| ----------------------- | --------------------------------- | ----------------- |
| `registerUser()`        | `POST /api/auth`                  | No                |
| `loginUser()`           | `POST /api/auth`                  | No                |
| `fetchUserOrders()`     | `GET /api/orders`                 | Bearer            |
| `fetchResellerOrders()` | `GET /api/reseller/orders`        | Bearer (reseller) |
| `resellerUpdateOrder()` | `POST /api/reseller/update-order` | Bearer (reseller) |
| `submitOrder()`         | `POST /api/orders`                | No                |
| `trackOrder()`          | `POST /api/orders/track`          | No                |
| `listAllUsers()`        | `POST /api/admin`                 | Admin             |
| `adminUpdateUser()`     | `POST /api/admin`                 | Admin             |


### Authentication

1. Login → receive JWT from Lambda
2. Token stored in `localStorage` as `idPirateAuthToken`
3. `AuthContext` decodes with `atob()` (no library dependency)
4. `withAuth` HOC guards user pages; `withAdminAuth` guards `/admin`; `**withResellerAuth`** guards `/reseller`

### Order Flow

```
/order      →   Browse state ID gallery
/order/new  →   Fill per-ID custom form (multi-step, sidebar nav)
/checkout   →   Review, shipping address, payment method, submit
/track      →   Public order lookup by ID
/dashboard  →   View order history & status
/reseller   →   Reseller dashboard (orders, link, analytics) — requires `RESELLER_LAMBDA_URL`
```

Order data is handed off via `localStorage` key `idPirateOrderForms`. **White-label** orders use `app/r/[resellerId]/page.tsx` (subdomain rewrite via `middleware.ts`).

---

## 🎨 Design System — "Bold Minimal"

A strict dark glassmorphic language. **Every page must follow these rules.**

### Core Tokens


| Token           | Value                    | Use                           |
| --------------- | ------------------------ | ----------------------------- |
| `--bg`          | `#09090B`                | Page background (always)      |
| `--surface`     | `rgba(255,255,255,0.04)` | Card fill                     |
| `--accent`      | `#6366F1`                | Primary action / indigo       |
| `--price`       | `#F59E0B`                | Dollar amounts (always amber) |
| `--success`     | `#10B981`                | Success states                |
| `--error`       | `#EF4444`                | Error states                  |
| `--font-sans`   | `Inter`                  | Body text                     |
| `--font-pirate` | `Pirata One`             | Logo / brand headings         |


### Utility Classes


| Class                     | Effect                      |
| ------------------------- | --------------------------- |
| `.glass`                  | Glassmorphic card surface   |
| `.glass-hover`            | Hover lift + border lighten |
| `.btn .btn-primary`       | Indigo filled button        |
| `.btn .btn-outline`       | Transparent bordered button |
| `.text-price`             | Amber bold price text       |
| `.animate-fade-up`        | Entrance slide-up animation |
| `.delay-1` ... `.delay-6` | Staggered animation delays  |


### Design Rules

1. Background is always `#09090B` — never white or gray
2. Cards always use `.glass` — never opaque `bg-gray-`*
3. Text: `text-white` headers, `text-zinc-400` body, `text-zinc-500` subtle
4. Prices always use `.text-price` (amber, bold)
5. Buttons: `.btn .btn-primary` (indigo) or `.btn .btn-outline`
6. Every page section uses `animate-fade-up` with stagger `delay-*`
7. Selected state: `bg-indigo-500/10 border-indigo-500/20`
8. Error state: `bg-red-500/10 border-red-500/20 text-red-400`
9. Legal / text pages: plain headings + paragraphs, no fancy card layouts

---

## 💰 Pricing

Defined in `lib/constants.ts` (single source of truth):


| State                                                   | Price |
| ------------------------------------------------------- | ----- |
| New Jersey, Florida, Texas                              | $100  |
| Pennsylvania, Illinois, Connecticut, Arizona            | $90   |
| Old Maine, Washington, Oregon, South Carolina, Missouri | $85   |
| Default (unlisted)                                      | $95   |


Plus: **$5 handling** + **$15 shipping** per order.

Payment methods: Bitcoin, Zelle, Apple Pay, Cash App, Venmo.

---

## 💸 Cost and free tier

The stack is chosen and evolved with **free tiers** in mind (Vercel, AWS Lambda/DynamoDB, Cloudflare R2, etc.). When contributing, **prefer patterns that stay efficient at low scale and remain reasonable as traffic and data grow**—pagination over full scans, tight Lambda work, bounded uploads. See **[AGENTS.md](./AGENTS.md)** (*Cost, free tier, and scale*) for agent-facing detail.

---

## 🔒 Security

- Security headers in `next.config.ts`: `X-Frame-Options`, `HSTS`, `CSP`, `Permissions-Policy`
- Lambda URLs are server-only (no `NEXT_PUBLIC_` env vars)
- All localStorage access goes through `lib/storage.ts` (SSR-safe + try/catch)
- `localStorage-polyfill.ts` imported first in `layout.tsx` to fix a Next.js dev mode bug

---

## ⚙️ Environment Variables

Create `.env.local` for local development. Set the same variables in Vercel (or your host) for production.

```env
AUTH_LAMBDA_URL=https://...
LOOKUP_LAMBDA_URL=https://...
ORDER_LAMBDA_URL=https://...
ADMIN_LAMBDA_URL=https://...
RESELLER_LAMBDA_URL=https://...
# R2 (presigned uploads) — see .env.example
```

> ⚠️ Do **not** prefix these with `NEXT_PUBLIC_`. They must remain server-side only.

Copy `**.env.example`** to `.env.local` and fill in values. Reseller dashboard and `/api/reseller/*` return **503** if `RESELLER_LAMBDA_URL` is missing.

---

## 🐛 Known Issues


| #   | Issue                                                                                    |
| --- | ---------------------------------------------------------------------------------------- |
| 1   | `useOrder` hook uses mock data — order detail view (`/order/view`) not wired to real API |
| 2   | `/za` and `/invoices` pages are stubs with unclear purpose                               |
| 3   | `submitOrder` sends client-side `id` field to backend (should be stripped)               |
| 4   | Direct `localStorage.setItem` in `/order/new` — should use `lib/storage.ts` wrapper      |
| 5   | No unit or integration tests exist                                                       |
| 6   | Large docs (`PROJECT_CONTEXT.md`) may lag; prefer **AGENTS.md** + **ARCHITECTURE.md**    |


---

## 📖 For AI Agents

See **[AGENTS.md](./AGENTS.md)** — a machine-optimized context document covering every file, convention, and constraint for seamless AI pair programming.

---

*Built for speed, security, and conversion.*