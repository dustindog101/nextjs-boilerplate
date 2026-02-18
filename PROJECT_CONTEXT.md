# ID Pirate — Complete Project Context

> **Purpose**: This document is a comprehensive reference for any AI agent or developer picking up this project. It describes every part of the codebase, the design system, coding conventions, architecture decisions, and the owner's preferences. Copy-paste this into a new AI chat to resume work seamlessly.

---

## 1. Project Overview

**ID Pirate** is a novelty ID ordering platform built as a **Next.js 15** web application (App Router). Users can browse state IDs, fill out custom per-ID forms, checkout with multiple payment options, track orders, and manage their account. An admin panel provides metrics and user management.

- **Repo**: `nextjs-boilerplate` (local path: `/Users/king/coding/web/idpirate/nextjs-boilerplate`)
- **Framework**: Next.js 15.3.4 (App Router, `"use client"` pages — no RSC data fetching yet)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + custom CSS design system in `app/globals.css`
- **Runtime**: Node.js, runs via `npm run dev` (port 3000)

---

## 2. Tech Stack & Dependencies

| Package                | Version | Purpose                          |
| ---------------------- | ------- | -------------------------------- |
| `next`                 | 15.3.4  | Framework                        |
| `react` / `react-dom`  | ^19     | UI library                       |
| `tailwindcss`          | ^4      | Styling (via PostCSS)            |
| `@tailwindcss/postcss` | ^4      | Tailwind PostCSS plugin          |
| `lucide-react`         | ^0.412  | Icons (only used in admin panel) |
| `recharts`             | ^2.12   | Charts (admin metrics)           |
| `typescript`           | ^5      | Language                         |
| `dotenv`               | ^17.2   | Environment variables            |

**No other UI library, component library, or state manager is used.** The project uses vanilla React state, Context API, and custom hooks.

---

## 3. Design System — "Bold Minimal"

The owner's preferred aesthetic is called **"Bold Minimal"** — a dark, glassmorphic design language. Every page MUST follow these rules:

### 3.1 CSS Design Tokens (defined in `app/globals.css`)

```
--bg:             #09090B          (near-black background)
--surface:        rgba(255,255,255,0.04)  (glass card fill)
--surface-hover:  rgba(255,255,255,0.07)
--border:         rgba(255,255,255,0.08)  (subtle glass borders)
--border-hover:   rgba(255,255,255,0.16)
--accent:         #6366F1          (indigo — primary action color)
--accent-hover:   #818CF8
--accent-subtle:  rgba(99,102,241,0.15)
--price:          #F59E0B          (amber — always used for prices)
--success:        #10B981
--error:          #EF4444
--info:           #3B82F6
--text-primary:   #FAFAFA
--text-secondary: #A1A1AA  (zinc-400)
--text-tertiary:  #71717A  (zinc-500)
--font-pirate:    'Pirata One', cursive  (brand logo font)
--font-sans:      'Inter', system-ui     (body font)
--radius-lg:      1rem
--radius-xl:      1.25rem
```

### 3.2 Utility Classes (defined in globals.css)

| Class                         | What it does                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.glass`                      | Card surface: `var(--surface)` bg, `blur(24px)` backdrop, `var(--border)` 1px border, `var(--radius-xl)` corners |
| `.glass-hover`                | Adds hover animation: border lighten + shadow + scale                                                            |
| `.btn`                        | Base button: `inline-flex`, `font-600`, `0.875rem`, `var(--radius-lg)`, focus ring                               |
| `.btn-primary`                | Indigo fill button                                                                                               |
| `.btn-outline`                | Transparent with border                                                                                          |
| `.text-price`                 | Amber, bold, tabular-nums — **always** use for dollar amounts                                                    |
| `.text-label`                 | `0.75rem`, uppercase, letter-spaced, `var(--text-tertiary)` — for form labels                                    |
| `.animate-fade-up`            | `translateY(16px)→0` entrance animation                                                                          |
| `.animate-fade-in`            | `scale(0.97)→1` entrance animation                                                                               |
| `.delay-1` through `.delay-6` | Stagger delays (75ms increments)                                                                                 |

### 3.3 Design Rules the Owner Enforces

1. **Background**: Always `#09090B`. Never white or gray backgrounds.
2. **Cards**: Always use `.glass` class. Never use `bg-gray-800`, `bg-gray-900`, etc.
3. **Text colors**: Headers = `text-white`, body = `text-zinc-400`, subtle = `text-zinc-500`. Never use `text-gray-*`.
4. **Price display**: Always use `.text-price` (amber `#F59E0B`, bold).
5. **Buttons**: Use `.btn .btn-primary` or `.btn .btn-outline`. Indigo accent.
6. **Animations**: Every page section should use `animate-fade-up` with staggered `delay-*` classes.
7. **Borders**: Use `border-white/[0.06]` or `border-white/[0.08]` for dividers. Never solid borders.
8. **Legal / simple text pages**: Keep them clean — simple headings and paragraphs. Do NOT use fancy cards, colored tags, or complex layouts for text-heavy pages.
9. **Selected/active states**: Use `bg-indigo-500/10 border-indigo-500/20` pattern.
10. **Error states**: Use `bg-red-500/10 border-red-500/20 text-red-400`.
11. **Success states**: Use `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`.

---

## 4. Project Architecture

### 4.1 Directory Structure

```
app/
├── layout.tsx              # Root layout: Inter font, AuthProvider, UniversalHeader
├── page.tsx                # Homepage: hero, feature grid, state cards, FAQ accordion
├── globals.css             # Full design system (tokens, utilities, animations)
├── error.tsx               # Global error boundary (glass styled)
├── favicon.ico
│
├── account/page.tsx        # Login / Register (tabbed form, glass card)
├── admin/                  # Admin panel (withAdminAuth protected)
│   ├── page.tsx            # Admin router: metrics | users sections
│   ├── AdminLayout.tsx     # Sidebar + content layout for admin
│   └── components/         # MetricsSection, UsersSection, StatCard, ChartCard
├── checkout/page.tsx       # Checkout: order review, shipping, payment, order submit
├── dashboard/
│   ├── page.tsx            # User dashboard: stat cards + order list (withAuth)
│   └── loading.tsx         # Skeleton loading state
├── invoices/page.tsx       # (exists but minimal)
├── news/page.tsx           # News & updates feed
├── order/
│   ├── page.tsx            # State gallery (Browse IDs)
│   ├── new/page.tsx        # Multi-ID order form (sidebar + form cards)
│   └── view/page.tsx       # Single order detail view
├── orders/
│   ├── page.tsx            # All orders list (user)
│   └── loading.tsx         # Skeleton loading state
├── privacy/page.tsx        # Privacy Policy (simple text)
├── terms/page.tsx          # Terms of Service (simple text)
├── track/page.tsx          # Public order tracking (search by ID)
├── za/page.tsx             # (exists but purpose unclear)
│
├── api/                    # Next.js Route Handlers (server-side proxies)
│   ├── auth/route.ts       # POST → AUTH_LAMBDA_URL
│   ├── orders/route.ts     # GET (list user orders), POST (submit order)
│   ├── orders/track/route.ts  # POST (public order tracking)
│   └── admin/route.ts      # POST → ADMIN_LAMBDA_URL (with auth)
│
├── components/
│   ├── UniversalHeader.tsx # Sticky header with logo, nav, user dropdown, mobile menu
│   ├── withAuth.tsx        # HOC: redirects unauthed users to /account
│   ├── withAdminAuth.tsx   # HOC: redirects non-admin to /dashboard
│   ├── icons/index.tsx     # 20+ custom SVG icon components
│   ├── order/              # Order-specific components (if any)
│   └── ui/
│       ├── index.tsx       # Barrel export
│       ├── Footer.tsx      # Site footer with nav links
│       ├── Spinner.tsx     # Loading spinner (sm/md/lg) + FullPageSpinner
│       ├── FormInput.tsx   # Reusable text input with label
│       ├── FormSelect.tsx  # Reusable select dropdown with label
│       ├── FileInput.tsx   # File upload input
│       └── Notification.tsx # Toast notification component
│
├── contexts/
│   └── AuthContext.tsx     # React Context: JWT decode, login/logout, token storage
│
└── hooks/
    ├── useAuth.ts          # Convenience hook for AuthContext
    └── useOrder.ts         # Order detail state management (mock data currently)

lib/
├── apiClient.ts            # All API calls → local /api/* Route Handlers
├── constants.ts            # State options, colors, prices, date arrays
├── types.ts                # Shared TypeScript interfaces (JwtPayload, IdFormData, OrderDetails, etc.)
├── storage.ts              # Safe localStorage wrappers (SSR-safe)
└── localStorage-polyfill.ts # Polyfill for broken localStorage in Next.js dev mode
```

### 4.2 API Architecture

All API communication follows a **server-side proxy pattern**:

```
Browser → /api/auth (Route Handler) → AUTH_LAMBDA_URL (AWS Lambda)
Browser → /api/orders (Route Handler) → ORDER_LAMBDA_URL / LOOKUP_LAMBDA_URL
Browser → /api/orders/track (Route Handler) → LOOKUP_LAMBDA_URL
Browser → /api/admin (Route Handler) → ADMIN_LAMBDA_URL
```

**Key principle**: Lambda URLs are NEVER exposed to the client. All `NEXT_PUBLIC_` prefixes were removed. The `.env.local` file contains server-only variables:

```
AUTH_LAMBDA_URL=...
LOOKUP_LAMBDA_URL=...
ORDER_LAMBDA_URL=...
ADMIN_LAMBDA_URL=...
```

The `lib/apiClient.ts` file calls `/api/*` endpoints (not Lambda URLs directly). It provides these functions:

| Function            | Route                    | Auth Required      |
| ------------------- | ------------------------ | ------------------ |
| `registerUser()`    | `POST /api/auth`         | No                 |
| `loginUser()`       | `POST /api/auth`         | No                 |
| `fetchUserOrders()` | `GET /api/orders`        | Yes (Bearer token) |
| `submitOrder()`     | `POST /api/orders`       | No                 |
| `trackOrder()`      | `POST /api/orders/track` | No                 |
| `listAllUsers()`    | `POST /api/admin`        | Yes (admin only)   |
| `adminUpdateUser()` | `POST /api/admin`        | Yes (admin only)   |

### 4.3 Authentication Flow

1. User registers/logs in via `/account` page → calls `loginUser()` → receives JWT token
2. Token is stored in `localStorage` as `idPirateAuthToken` (via `lib/storage.ts`)
3. `AuthContext` decodes the JWT client-side using `atob()` (no library)
4. JWT payload shape: `{ userId, username, role: 'user'|'admin', isReseller, exp, iat }`
5. Protected pages use `withAuth` HOC (redirects to `/account` if no token)
6. Admin pages use `withAdminAuth` HOC (redirects non-admins to `/dashboard`)
7. API calls attach token via `Authorization: Bearer <token>` header

### 4.4 Order Flow

1. **Browse** → `/order` (state gallery with prices)
2. **Create** → `/order/new` (multi-ID form with sidebar navigation, completion dots)
3. **Checkout** → `/checkout` (review, shipping address, payment method selection, submit)
4. **Track** → `/track` (public, search by order ID, auto-fills from URL params)
5. **Dashboard** → `/dashboard` (stat cards + order list with status indicators)

Order data is passed between `/order/new` and `/checkout` via `localStorage` key `idPirateOrderForms`.

---

## 5. Component Patterns

### 5.1 Page Layout Pattern
Every page follows this structure:
```tsx
<div className="min-h-screen flex flex-col">
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
        {/* page content */}
    </div>
    <Footer />
</div>
```

Max widths vary: `max-w-3xl` for text pages, `max-w-6xl` for dashboards, `max-w-7xl` for galleries.

### 5.2 Header Pattern
```tsx
<header className="mb-10 sm:mb-12">
    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight animate-fade-up">
        Page Title
    </h1>
    <p className="mt-3 text-sm text-zinc-400 animate-fade-up delay-1">
        Subtitle text
    </p>
</header>
```

### 5.3 Form Input Pattern
Reusable `FormInput` and `FormSelect` components in `app/components/ui/`. Common input class:
```
w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none transition text-sm
```

### 5.4 Icon Pattern
Custom SVG icons live in `app/components/icons/index.tsx`. All accept standard SVG props:
```tsx
export const SearchIcon = (props: IconProps) => (
    <svg {...props} xmlns="..." width="24" height="24" ...>
        ...
    </svg>
);
```

Some pages also use `lucide-react` icons (admin panel). Prefer custom icons where available.

---

## 6. Security Configuration

### 6.1 Security Headers (in `next.config.ts`)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; ...`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 6.2 localStorage Safety
All localStorage access goes through `lib/storage.ts` which:
- Checks `typeof window !== 'undefined'` (SSR guard)
- Checks `typeof window.localStorage.getItem === 'function'` (polyfill guard)
- Wraps in try/catch (private browsing guard)

A polyfill in `lib/localStorage-polyfill.ts` is imported FIRST in `layout.tsx` to fix a Next.js dev mode bug.

---

## 7. Fonts

- **Brand logo**: `'Pirata One'` (loaded via Google Fonts `<link>` in `layout.tsx`) → `.font-pirate`
- **Body**: `'Inter'` (loaded via `next/font/google` for optimal performance) → `--font-sans`
- **Fallback decorative**: `'Uncial Antiqua'` (also loaded via Google Fonts link)

---

## 8. Pricing Model

Defined in `lib/constants.ts`:
- State-specific prices: $85–$100 per ID
- Default price: $95
- Shipping: $20 (constant)
- Payment methods: Bitcoin, Zelle, Apple Pay, Cash App, Venmo

The `/order/new` page has its own `statePrices` object (slightly different from constants — $90/$100/$85 breakdown). The checkout page uses a flat `$95/ID + $5 handling + $15 shipping`.

> **Known inconsistency**: Prices differ between the homepage featured cards, the order gallery, the order form, and checkout. This should be unified.

---

## 9. Owner Preferences & Working Style

1. **Clean and minimal over fancy** — The owner rejected card-based layouts with colorful tags for legal pages. Prefers simple headings + paragraphs for text-heavy content.
2. **Dark theme only** — Never add light mode support.
3. **Glass everywhere** — Use `.glass` for all card surfaces. No opaque gray backgrounds.
4. **Indigo accent** — Primary actions, selected states, and active indicators use indigo (`#6366F1`).
5. **Placeholder text is fine** — For legal pages and content that needs later review, placeholder text is acceptable.
6. **No unnecessary complexity** — Don't over-engineer legal/info pages with cards, tags, or grid layouts when simple prose works.
7. **Responsive design** — Mobile-first with `sm:` / `lg:` breakpoints. The order form has a dedicated mobile nav strip and bottom bar.
8. **Animations** — Use `animate-fade-up` with stagger delays on page content. Keep it subtle.

---

## 10. Known Issues & Technical Debt

1. **EPERM on `node_modules`** — The AI terminal sometimes cannot access `node_modules` due to macOS permissions. The owner must run `npm run dev` from their own terminal (which has Full Disk Access).
2. **Price inconsistency** — Prices in `lib/constants.ts`, homepage, order gallery, order form, and checkout don't all match.
3. **`useOrder` hook uses mock data** — The order detail view hook (`app/hooks/useOrder.ts`) has hardcoded mock data instead of calling the real API.
4. **Order detail page (`/order/view`)** — Uses mock data via `useOrder` hook.
5. **`/za` and `/invoices` pages** — Purpose unclear, may be stubs.
6. **submitOrder doesn't strip client `id`** — The `id` field (generated by `Date.now()`) on each ID form gets sent to the backend.
7. **No tests** — No unit or integration tests exist.
8. **Direct localStorage in order form** — `handleProceedToCheckout` in `/order/new` uses `localStorage.setItem` directly instead of the safe `setStorageItem` wrapper.

---

## 11. Environment Variables

For local development (`.env.local`):
```
AUTH_LAMBDA_URL=<lambda URL>
LOOKUP_LAMBDA_URL=<lambda URL>
ORDER_LAMBDA_URL=<lambda URL>
ADMIN_LAMBDA_URL=<lambda URL>
```

For deployment (Vercel or similar), these same variables need to be set **without** the `NEXT_PUBLIC_` prefix.

---

## 12. Commands

```bash
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
```

---

## 13. File-by-File Reference

### Root Config
| File                 | Lines | Purpose                                                          |
| -------------------- | ----- | ---------------------------------------------------------------- |
| `package.json`       | 28    | Dependencies and scripts                                         |
| `tsconfig.json`      | 28    | TypeScript config (strict, bundler resolution, `@/*` path alias) |
| `next.config.ts`     | 33    | Security headers, commented rewrite block                        |
| `postcss.config.mjs` | 3     | PostCSS with Tailwind plugin                                     |

### Library (`lib/`)
| File                       | Lines | Purpose                                                                      |
| -------------------------- | ----- | ---------------------------------------------------------------------------- |
| `apiClient.ts`             | 192   | All API functions, `apiFetch` wrapper, `authHeaders` helper                  |
| `types.ts`                 | 86    | `JwtPayload`, `IdFormData`, `OrderDetails`, `TrackingStage`, `PaymentMethod` |
| `constants.ts`             | 84    | State lists, dropdown options, pricing                                       |
| `storage.ts`               | 46    | SSR-safe `getStorageItem`, `setStorageItem`, `removeStorageItem`             |
| `localStorage-polyfill.ts` | ~30   | Fixes broken polyfill in Next.js dev mode                                    |

### Pages (`app/`)
| Route        | File                 | Lines | Auth            | Key Features                                        |
| ------------ | -------------------- | ----- | --------------- | --------------------------------------------------- |
| `/`          | `page.tsx`           | 219   | None            | Hero, feature grid, state cards, FAQ accordion      |
| `/account`   | `account/page.tsx`   | 199   | None            | Login/Register tabbed form                          |
| `/order`     | `order/page.tsx`     | 93    | None            | State ID gallery grid                               |
| `/order/new` | `order/new/page.tsx` | 407   | `withAuth`      | Multi-ID form, sidebar, mobile nav, completion dots |
| `/checkout`  | `checkout/page.tsx`  | 289   | `withAuth`      | Order review, shipping, payment, submit modal       |
| `/dashboard` | `dashboard/page.tsx` | 180   | `withAuth`      | Stat cards, order list                              |
| `/track`     | `track/page.tsx`     | ~143  | None            | Order search, auto-fill from URL params             |
| `/news`      | `news/page.tsx`      | 82    | None            | News feed with tagged cards                         |
| `/terms`     | `terms/page.tsx`     | ~85   | None            | Terms of Service (simple text)                      |
| `/privacy`   | `privacy/page.tsx`   | ~85   | None            | Privacy Policy (simple text)                        |
| `/admin`     | `admin/page.tsx`     | 49    | `withAdminAuth` | Admin panel with metrics + users                    |

### Components
| File                  | Lines | Purpose                                                          |
| --------------------- | ----- | ---------------------------------------------------------------- |
| `UniversalHeader.tsx` | 249   | Sticky header, desktop nav, user dropdown, mobile slide-out menu |
| `withAuth.tsx`        | 29    | Auth guard HOC                                                   |
| `withAdminAuth.tsx`   | 33    | Admin auth guard HOC                                             |
| `icons/index.tsx`     | 199   | 20+ custom SVG icon components                                   |
| `ui/Footer.tsx`       | 36    | Site footer with Order, Track, Account, Terms, Privacy links     |
| `ui/Spinner.tsx`      | ~40   | Loading spinner with size variants                               |
| `ui/FormInput.tsx`    | ~40   | Reusable labeled text input                                      |
| `ui/FormSelect.tsx`   | ~50   | Reusable labeled select dropdown                                 |
| `ui/FileInput.tsx`    | ~45   | File upload input                                                |
| `ui/Notification.tsx` | ~80   | Toast notification with auto-dismiss                             |
| `ui/index.tsx`        | ~10   | Barrel exports                                                   |

---

## 14. Quick Start for New Agent Sessions

1. The project is at `/Users/king/coding/web/idpirate/nextjs-boilerplate`
2. Run `npm run dev` to start the dev server on port 3000
3. All styling uses the design tokens in `app/globals.css` — read that file first
4. All API calls go through `lib/apiClient.ts` → `app/api/*` Route Handlers → Lambda
5. Auth state is managed by `app/contexts/AuthContext.tsx` via JWT in localStorage
6. Use `.glass` for cards, `.btn .btn-primary` for buttons, `.text-price` for dollar amounts
7. Follow the **"Bold Minimal"** dark glassmorphic aesthetic on every page
8. Keep legal/text pages simple — no fancy card layouts
9. The owner prefers clean, functional code over over-engineered solutions
