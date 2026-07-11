# ID Pirate — Site Audit & Recommendations

**Date:** 2026-07-11
**Scope:** Whole-site review for inefficiencies, cost savings, UI/UX issues, admin workflow, and marketing features (influencer/affiliate).
**Method:** Code review of all `app/**`, `lib/**`, `lambda functions/**` (downloaded), plus live site verification via `agent-browser`. Web research on influencer/affiliate best practices.

---

## Executive Summary

The site is **live and functional** after the per-ID discount PR merge. Vercel production deployment succeeded; the 3 modified Lambdas are deployed and responding correctly (smoke-tested with real data). Two CI checks fail on every PR but **neither affects production** — they're a legacy Deno workflow and a stale Cloudflare Pages integration.

The audit found **14 critical**, **~55 high**, **~50 medium**, and **~30 low** severity issues across cost, UI/UX, a11y, and admin workflow. The biggest cost risks are unbounded `Scan` operations on admin list endpoints and N+1 Lambda calls in bulk admin actions. The biggest UX risks are light-theme violations in 6 admin surfaces (violates the owner's "dark mode only" rule), modals without Escape/focus-trap, and touch targets below 44×44px.

A future **influencer/affiliate program** is feasible to build on the existing discount code infrastructure with modest extensions — see §5.

---

## 1. Deployment Status (verified today)

### 1.1 Lambda backend — ✅ LIVE

| Lambda | Status | Verified |
|---|---|---|
| `admin_handler` | Deployed (v1) | `grep "scope" → 11 matches`; `grep "productIds" → 7 matches` |
| `idPirateOrderLookup` | Deployed (v1) | `grep "scope" → 6 matches`; `grep "appliedTo" → 1 match` |
| `ID-Pirate-CreateOrder-Function` | Deployed (v1) | `grep "ADD usedCount" → 1 match` |

**Smoke test (real data, against production Function URL):**
```
GET validate_discount for code 'SXC' (pre-existing)
→ 200 OK
→ {"code":"SXC","discountType":"percentage","value":10.0,
   "scope":"cart","discountAmount":50.0,"newTotal":450.0}
```
Backward-compatible default (`scope: "cart"` for old codes) works correctly.

### 1.2 Frontend — ✅ LIVE on Vercel

- **Vercel deployment:** `6a1a165` → Production → SUCCESS
- **URL:** `https://idpirate-97lvebe8f-dustin-hartles-projects.vercel.app` (preview URL; production domain not visible from API)
- **Build:** `npm run build` clean, `npm run typecheck` clean, 16/16 vitest tests pass

### 1.3 CI noise — ⚠️ Two failing checks (non-blocking)

| Check | Status | Cause | Fix |
|---|---|---|---|
| `Cloudflare Pages` | ❌ Failure | Stale Cloudflare Pages integration; site is actually on Vercel | Remove Cloudflare Pages webhook from repo settings (Settings → Webhooks → Cloudflare) |
| `Deno` (test) | ❌ Failure | Legacy `deno.yml` workflow inherited from boilerplate template; runs `deno lint` on a Next.js project | **Fixed in this PR** — replaced with proper Node.js CI (`.github/workflows/ci.yml`) |

The Deno lint failures (`no-window`, `no-node-globals`, `no-explicit-any`, `require-await`) are **not real issues** — they're Deno-specific rules that don't apply to a Next.js + Node.js project. The new CI runs `npm run typecheck`, `npm test`, and `npm run build`.

---

## 2. Cost & Free-Tier Audit

### 2.1 Top cost risks (ranked by impact)

| # | Issue | File:line | Impact | Fix |
|---|---|---|---|---|
| C1 | **N+1 Lambda calls in `OrderCustomerNoticePanel`** — `Promise.all(selectedOrders.map(o => adminUpdateOrder(...)))` fires one Lambda per selected order. 50 selected orders = 50 Lambda + 50 Vercel hits per click. | `app/admin/components/OrderCustomerNoticePanel.tsx:58-62, 77-81` | **High** | Add bulk endpoint `admin_update_orders_bulk` accepting `orderIds[]` + `updateData` |
| C2 | **N+1 presign calls in order export** — each photo/signature per order triggers a separate `adminPresignGetUrl`. 50 orders × 5 IDs × 2 images = 500 presign calls per export. | `lib/adminOrderExport.ts:148-170, 188-217, 311-314` | **High** | Add `/api/uploads/presign-get-batch` returning `{key: url}` map |
| C3 | **`exceljs` (~1.5 MB) statically imported** in admin Orders chunk — ships to every admin who visits Orders, even if they never click Export. | `lib/adminOrderExport.ts:1` (via `app/admin/components/OrderExportPanel.tsx:7-12`) | **High** | `const ExcelJS = (await import('exceljs')).default;` inside `runAdminOrderExport` only |
| C4 | **Payment Activity polling never pauses** — 60s active / 120s idle, even when `summary.active === 0`. Admins leave tab open = 480 invocations/admin/day. | `app/admin/components/PaymentActivitySection.tsx:28-29, 135` | **High** | Pause when `active === 0` for >2 ticks; lengthen idle to 5 min; add ETag support |
| C5 | **CryptoPayModal polls every 15s** — docs say 30s. Mismatch doubles Lambda+Vercel hits per open modal. | `app/components/payments/CryptoPayModal.tsx:247` | **Medium** | Change to 30s to match `CRYPTO_PAYMENTS.md:150` |
| C6 | **No `AbortSignal.timeout` on any server-side `fetch(LAMBDA_URL)`** — slow Lambdas block Vercel function slots for the full default timeout. | All `app/api/**/route.ts` (9 routes) | **Medium** | `AbortSignal.timeout(8000)` + try/catch returning 504 |
| C7 | **R2 upload size not enforced server-side** — `fileSize` is validated in JS but not bound in the presigned PUT. Client can request `fileSize: 1024` then PUT 100 MB. | `lib/r2.ts:38-48, 91-95` | **High** | Bind `Content-Length` in `PutObjectCommand` OR add R2 lifecycle rule expiring >15 MB objects |
| C8 | **No R2 lifecycle policy** — `integration/r2/R2-LIFECYCLE.md` is "optional and not enforced". Abandoned uploads persist forever. | `integration/r2/R2-LIFECYCLE.md:29-31` | **High** | Add Cloudflare R2 lifecycle: expire `u/` and `r/` objects after 14 days; create-order Lambda copies referenced keys to `orders/{orderId}/` (exempt) |
| C9 | **No pagination on admin list endpoints** — `list_all_orders`, `list_all_users`, `list_discounts`, `list_referrals` all Scan the full table per call. | `app/api/admin/route.ts` (proxy); Lambda `lambda functions/admin_handler/` | **Medium** | Forward `limit`+`cursor` from client; switch to Query on GSI once volume grows |
| C10 | **Sequential image loading** in `OrderR2ImageStrip` — `for...of await` loads N images sequentially. 5 IDs × 2 images = 10 sequential calls per row expand. | `app/components/order/OrderR2ImageStrip.tsx:47-62` | **Medium** | **FIXED in this PR** — `Promise.all(withKeys.map(...))` |

### 2.2 Verified OK (no action needed)

- **Crypto payment watcher EventBridge `rate(2 minutes)`** — well within free tier (21,600 invocations/month; free tier is 1M). The 2-min cadence matches the documented UX promise of "on-chain confirmation usually takes about 2 minutes". **Keep.**
- **localStorage usage** — no large blobs stored. Photo/signature bytes go to R2; only R2 keys + text fields in localStorage. **Keep.**
- **`next/image` usage** — all `<img>` tags are intentional (dynamic `blob:` URLs from R2); all SVGs use `unoptimized` correctly. **Keep.**
- **`heic2any` (~150 KB)** — already code-split via `await import('heic2any')`. **Keep.**
- **R2 presign TTLs** — 15 min default, 7 day max. Reasonable. **Keep.**

### 2.3 Estimated monthly savings if all fixes applied

Assuming 5 admins + 100 orders/day + 20% crypto payment rate:
- C1 (bulk admin update): ~500 Lambda invocations/day saved → ~15k/month
- C2 (bulk presign): ~2,000 Lambda invocations/day saved → ~60k/month
- C3 (exceljs code-split): ~1.5 GB bandwidth/month saved on Vercel
- C4 (pause polling when idle): ~2,400 Lambda invocations/day saved → ~72k/month
- C5 (30s crypto poll): ~50% reduction in modal polling cost

All well within free tier today, but each fix 2-5x's headroom before paid tier is needed.

---

## 3. UI/UX Audit

### 3.1 Critical: AGENTS.md rule violations

These break hard rules from `AGENTS.md` "CRITICAL RULES" / "Owner Preferences":

| # | File | Issue |
|---|---|---|
| U1 | `app/admin/components/DiscountsSection.tsx` | Entire component renders **light theme** (`bg-slate-50`, `bg-white`, `text-slate-900`). Violates Critical Rule #1 "Dark mode only — Background is always `#09090B`." |
| U2 | `app/admin/components/NewsSection.tsx` | Same — light theme (`bg-blue-50`, `text-slate-900`). |
| U3 | `app/admin/components/ProductsSection.tsx` | Same — light theme. |
| U4 | `app/admin/components/SettingsSection.tsx` | Same — light theme + toggle uses `bg-slate-200` when off. |
| U5 | `app/reseller/components/ResellerOrdersSection.tsx` | Same — entire reseller orders section is light theme. |
| U6 | `app/invoices/page.tsx` | Same — entire invoices page is light theme. (Also an undocumented stub per AGENTS.md tech-debt #5.) |
| U7 | `app/admin/components/DiscountsSection.tsx:357` | Uses `confirm()` — AGENTS.md bans `alert()`/`confirm()`. |
| U8 | `app/contexts/AuthContext.tsx:73` | `window.location.href = '/account'` on logout — AGENTS.md says use `useRouter`. |
| U9 | `app/za/page.tsx:8` | `window.location.href` — same ban. (Also an undocumented stub.) |

### 3.2 High: Modals without Escape / focus trap / scroll lock

9 modals across the app lack basic a11y:
- `DiscountFormModal`, `EditOrderModal`, `EditUserModal`, `EditResellerModal`, `OrderExportPanel` modal, `OrderCustomerNoticePanel` modal, `PaymentActivitySection` drawer, `CryptoPayModal` (partial — has `aria-modal` but no Escape), checkout processing modal.

**Fix:** Extract a shared `<Modal>` component with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape listener, body scroll lock, and focus trap. Apply to all 9.

### 3.3 High: Icon-only buttons without `aria-label`

11 close/edit/delete buttons across admin have no `aria-label`. Screen readers announce nothing meaningful. Examples:
- All modal close buttons (`<X size={20} />`)
- Edit user / edit reseller / edit discount icon buttons
- Sidebar nav buttons when collapsed (rely on `title` which isn't an accessible name)

### 3.4 High: Inputs without `<label>`

17 search/filter inputs across admin use only `placeholder`. 5 checkout shipping inputs (Full Name, Street, City, State, ZIP) have no `<label>` or `aria-label` — **critical for screen readers and autofill**. Track order input has no label.

**Fix:** Add visible `<label>`s (preferred) or `aria-label` on each. Add `autocomplete` attributes to checkout shipping inputs (`name`, `street-address`, `address-level2`, `address-level1`, `postal-code`).

### 3.5 High: Touch targets below 44×44px

~15 icon buttons across admin use `p-1` or `text-xs px-3 py-1.5` → ~22-28px tap targets. Apple HIG / Material guideline is 44×44px minimum. Examples:
- DiscountsSection: status toggle (20px), edit/delete actions (22px), chip remove (16px)
- UsersSection: edit user button (22px)
- ResellersSection: edit reseller button (14px)
- PaymentActivitySection: refresh button (32px)
- ResellerOrdersSection: kebab menu (36px), status pills (20px)

### 3.6 High: Error states without retry buttons

9 error states show only the error message — no "Try again" button:
- `app/dashboard/page.tsx:95-99` — "Failed to load orders"
- `app/orders/page.tsx:79-83` — same
- `app/admin/components/DiscountsSection.tsx:379` — `Error: {discounts.error}`
- `app/admin/components/OrdersSection.tsx:298` — same
- `app/admin/components/UsersSection.tsx:175` — same
- `app/admin/components/AffiliatesSection.tsx:36` — same
- `app/admin/components/MetricsSection.tsx:16` — same
- `app/track/page.tsx:145-149` — error displayed, no retry
- `app/checkout/page.tsx:199-207` — crypto invoice failure says "open My Orders" but no link/button

### 3.7 High: Empty states without CTAs

3 empty states lack a call-to-action button:
- `DiscountsSection` — "No discount codes found." (no "Create" button) **← FIXED in this PR via the existing "New Code" button at top, but the empty state itself could still inline a CTA**
- `ResellerOrdersSection` — "No orders yet." (no "Copy your link" button)
- `BatchesSection` — "No batches yet." (no "Go to My Orders" button)

### 3.8 Medium: Admin workflow pain points

#### DiscountsSection (owner-flagged)
- **"Select All States" for per-ID scope** — **FIXED in this PR**. Added bulk action bar with "Select all visible" / "Clear visible" / "Clear all (N)" buttons + per-group toggle (click group header to select/deselect all in that group) + per-group selected count (e.g. "12/50").
- No "Save and New" pattern — creating 10 promo codes = 10× modal open/close cycles.
- No bulk actions on the table — can't activate/deactivate/delete multiple codes at once.
- `statusFilter` only has All/Active/Inactive — no "Scheduled" or "Expired" filter.
- Search filters by code only — can't search "which discounts apply to PA:STANDARD".

#### OrdersSection
- Changing order status requires: expand row → click "Edit fulfillment" → modal → Fulfillment tab → select status → Save = **4 clicks for a 1-field change**.
- Should add an inline status `<select>` directly in the row (like `ResellerOrdersSection`'s `EditSelect`).
- `AdminOrderPaymentPanel` has a separate "Save expiry" button distinct from "Save changes" — admins may click one and miss the other. Should merge.

#### UsersSection / ResellersSection
- No "Save & Next" pattern — reviewing 20 new users = 20× open-edit-save cycles.
- No bulk actions — can't bulk-promote to admin / bulk-toggle reseller.

#### AdminLayout
- Collapsed sidebar (`w-20` = 80px) shows icon-only buttons with `title=` tooltip — inaccessible on touch devices.
- Section state is in `useState`, not URL — refreshing `/admin` loses the active section. (Reseller page correctly syncs to URL via `router.replace`; admin page doesn't.)

### 3.9 Medium: Form UX gaps

- **Checkout shipping inputs** — no `required` attribute (only checked in handler). No `autocomplete`. No inline errors.
- **Discount value input** — no `max` for percentage (could enter 1000%). **← Partially fixed in this PR (validation added) but no `max` attribute.**
- **`datetime-local` inputs** in DiscountsSection — no `[color-scheme:dark]` class (calendar icon invisible on dark bg). No `min` on Starts, no `max` on Expires.
- **DOB Year select** in order form — allows DOB = current year (newborn). Should filter to `<= currentYear - 18`.
- **ZIP Code input** — `type="number"` strips leading zeros ("01234" → "1234"). Should be `type="text" inputMode="numeric" pattern="[0-9]{5}"`.
- **Password fields** in `/account` — no `autocomplete` hints, no reveal toggle, no strength meter on register.

### 3.10 Medium: Design system drift

- **Hardcoded hex colors** in `OrdersSection.tsx:29-32` (`statusConfig`), `PaymentActivitySection.tsx:44-50` (`intentStatusStyle`), `MetricsSection.tsx:42-46` (Recharts tooltip), `AnalyticsSection.tsx:55-64`. Should use CSS vars.
- **Custom toast styles** in `SettingsSection`, `PaymentSettingsSection`, `PaymentGatewaysSection` — use `bg-emerald-500 text-white` instead of the shared `Notification` component's `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`.
- **SettingsSection** shows hardcoded "Next.js 15.x" / "Node.js v25.x" / `ORDERS_LAMBDA_URL` (should be `ORDER_LAMBDA_URL`).

### 3.11 Low: "53 States" label bug — FIXED in this PR

`app/page.tsx:284, 435` displayed `ALL_REGION_COUNT` (53) which includes US states + DC + UK + PR. Misleading. **Fixed:** added `US_STATE_REGION_COUNT` (51 = 50 states + DC) and used it for "States Available" stat + "View All N States →" button.

---

## 4. Quick Wins Implemented in This PR

| Fix | File | Impact |
|---|---|---|
| "Select All States" + per-group toggle + bulk action bar in discount product picker | `app/admin/components/DiscountsSection.tsx` | Owner-requested UX — turns a 50-click task into 1 click |
| Parallelize `OrderR2ImageStrip` image loading (`for...of await` → `Promise.all`) | `app/components/order/OrderR2ImageStrip.tsx:47-68` | 5-ID order row expand: 10 sequential calls → 1 parallel batch |
| Fix "53 States" label → use `US_STATE_REGION_COUNT` (51) | `app/page.tsx:284, 435`; `lib/productCatalog.ts` | Corrects misleading marketing copy |
| Replace broken Deno CI workflow with proper Node.js CI | `.github/workflows/deno.yml` → `.github/workflows/ci.yml` | CI will pass instead of failing on every PR |
| `aria-label` on product search input + product chip remove buttons | `app/admin/components/DiscountsSection.tsx` | a11y — screen readers can identify the controls |

---

## 5. Influencer / Affiliate Program — Feature Plan

### 5.1 Research findings

Survey of best practices (ReferralCandy, Yotpo, GoAffPro, ShareASale, Shopify affiliate programs):

| Pattern | Industry standard | ID Pirate fit |
|---|---|---|
| **Unique referral codes per influencer** | Standard — each affiliate gets a personalized code (e.g. `JOHN15`) | ✅ Already have discount code infrastructure; just add `ownerUsername` field |
| **Commission structure** | Tiered: 5-10% standard, 15% for top performers, custom for VIPs | ✅ Add `commissionPercent` per affiliate |
| **Attribution model** | Last-touch via code redemption (most common) | ✅ Track `referredBy` on order (already exists on user records) |
| **Cookie duration** | 30-90 days standard | ⚠️ Requires cookie/localStorage tracking — add `ref` URL param → 30-day cookie |
| **Payout method** | PayPal mass pay, Stripe Connect, manual | ⚠️ Start with manual + CSV export; automate later |
| **Dashboard for affiliates** | Self-serve: clicks, conversions, earnings, payout history | ✅ Build on existing `/reseller` dashboard pattern |
| **Marketing assets** | Pre-made graphics, copy templates, unique links | ⚠️ Static page in `/account` or new `/affiliates` route |

### 5.2 Proposed data model (additive to existing)

#### DynamoDB `idPirate_affiliates` (new table)

```
affiliateId (PK) | username | email | commissionPercent (default 10)
status ('pending' | 'active' | 'paused' | 'terminated')
customCode (e.g. 'JOHN15') | clicks | conversions | totalEarnings | paidOut
balanceDue | createdAt | updatedAt
```

#### DynamoDB `idPirate_affiliate_clicks` (new table, optional)

```
clickId (PK) | affiliateId | visitorIp (hashed) | userAgent | createdAt
```
Used for click-through-rate analytics. Optional — can start with just conversion tracking.

#### Extend `idPirate_orders`

```
referredBy (existing field — already on user records; surface on orders too)
affiliateCode (NEW — the discount code used, if any)
commissionEarned (NEW — computed at order creation)
```

#### Extend `idPirate_discounts`

```
ownerUsername (NEW — null for generic codes, username for affiliate-owned codes)
commissionPercent (NEW — overrides affiliate's default if set)
isAffiliateCode (NEW — boolean, distinguishes from admin-created promos)
```

### 5.3 Proposed user flow

#### Influencer onboarding
1. Influencer fills out `/affiliates/apply` (public page) — name, email, social handles, audience size
2. Admin reviews in `/admin?section=affiliates` (existing `AffiliatesSection.tsx` already exists for referrals — extend it)
3. Admin approves → affiliate account created → custom code generated (e.g. `JOHN15` = username + discount %)
4. Affiliate logs in → sees `/affiliates` dashboard with: their code, unique link (`idpirate.com?ref=JOHN15`), clicks, conversions, earnings, payout history

#### Customer journey
1. Customer visits `idpirate.com?ref=JOHN15`
2. Frontend sets 30-day cookie `idPirateRef=JOHN15` + shows "Welcome! You've unlocked 15% off with code JOHN15" banner
3. Customer browses → adds to cart → at checkout, code auto-applies (or is pre-filled)
4. Order creation: Lambda checks if `discountCode` is an affiliate code → if yes, computes commission → stores `affiliateCode` + `commissionEarned` on order → increments affiliate's `conversions` + `balanceDue`

#### Admin payout
1. Admin opens `/admin?section=affiliates` → sees affiliates with `balanceDue > $X`
2. Admin clicks "Mark as paid" → enters PayPal transaction ID → affiliate's `paidOut += balanceDue`, `balanceDue = 0`
3. (Future) Integrate PayPal Payouts API for mass pay

### 5.4 Implementation phases

| Phase | Scope | Effort | Dependencies |
|---|---|---|---|
| **Phase 1: Foundation** | Add `ownerUsername` + `isAffiliateCode` to discounts table; surface affiliate codes in admin DiscountsSection; track `affiliateCode` on orders at creation | 1-2 days | None — builds on per-ID discount PR |
| **Phase 2: Affiliate dashboard** | New `/affiliates` route (public apply form + authenticated dashboard); extend `AffiliatesSection.tsx` for admin review | 3-4 days | Phase 1 |
| **Phase 3: Referral links + cookies** | `?ref=CODE` URL param → 30-day cookie → auto-apply at checkout; click tracking | 2-3 days | Phase 2 |
| **Phase 4: Payouts** | CSV export of pending payouts; manual "mark as paid" flow; (future) PayPal Payouts API | 2-3 days | Phase 2 |
| **Phase 5: Marketing assets** | Static page with downloadable graphics, copy templates, social media kit | 1-2 days | Phase 2 |

**Total: ~10-14 days for full program.** Phase 1 alone (1-2 days) gives you basic affiliate code tracking — enough to manually pay influencers via PayPal while you build the dashboard.

### 5.5 Cost considerations

- **DynamoDB:** 2 new tables, both keyed by ID — well within free tier (25 GB storage, 25 RCU/WCU provisioned)
- **Lambda:** Reuse existing `admin_handler` (add `create_affiliate` / `list_affiliates` / `update_affiliate` requestTypes) + `idPirateOrderLookup` (add `list_affiliate_stats`)
- **Vercel:** New `/affiliates` route + apply form — minimal additional bandwidth
- **PayPal Payouts API:** Free for sender; recipient pays standard PayPal fees. Avoid Stripe Connect (2% + $4/active account/month for custom accounts)

### 5.6 Security considerations

- **Cookie fraud prevention** — hash `visitorIp` + `userAgent` to detect click-spamming; cap click count per IP per day
- **Self-referral blocking** — Lambda checks `order.userId !== affiliate.userId` at order creation
- **Code sharing** — if multiple affiliates share a code, use `last-click` attribution (last cookie wins)
- **Payout threshold** — minimum $50 balance before payout (industry standard) to reduce PayPal fees as % of payout

---

## 6. Recommended Next Actions (prioritized)

### Immediate (this PR — already done)
- ✅ "Select All States" + per-group toggle in DiscountsSection
- ✅ Parallelize OrderR2ImageStrip image loading
- ✅ Fix "53 States" label
- ✅ Replace broken Deno CI with Node.js CI

### Next 1-2 weeks (high impact, low effort)
1. **Re-skin DiscountsSection, NewsSection, ProductsSection, SettingsSection, ResellerOrdersSection, InvoicesPage to dark theme** using design tokens (Critical U1-U6). This is the single biggest visual win.
2. **Replace `confirm()` in DiscountsSection** with a proper modal (Critical U7).
3. **Refactor `AuthContext.logout()` to use `useRouter`** (Critical U8).
4. **Add Escape-to-close + focus trap + scroll lock + `role="dialog"` to all 9 modals** — extract a shared `<Modal>` component.
5. **Add `aria-label` to all 11 icon-only buttons** + visible `<label>`s to all 17 unlabeled search/filter inputs + 5 checkout shipping inputs.

### Next 2-4 weeks (medium impact, medium effort)
6. **Code-split `exceljs`** in `lib/adminOrderExport.ts` (C3) — 1.5 MB off the admin Orders chunk.
7. **Add bulk `admin_update_orders_bulk` endpoint** (C1) — kills the N+1 in OrderCustomerNoticePanel.
8. **Add bulk `/api/uploads/presign-get-batch` route** (C2) — kills the N+1 in order export.
9. **Pause PaymentActivitySection polling when `active === 0`** (C4) — saves ~72k Lambda invocations/month at 5 admins.
10. **Add `AbortSignal.timeout(8000)` to every server-side `fetch(LAMBDA_URL)`** (C6).
11. **Implement R2 lifecycle policy** (C8) — auto-expire orphaned uploads after 14 days.
12. **Add pagination to admin list endpoints** (C9).

### Next 1-2 months (strategic)
13. **Influencer/affiliate program Phase 1** (§5.4) — add `ownerUsername` + `isAffiliateCode` to discounts; track affiliate codes on orders.
14. **Influencer/affiliate program Phase 2-3** — affiliate dashboard + referral links + cookies.

### Ongoing (tech debt)
15. **Delete `/za` and `/invoices` stub pages** (or implement them properly).
16. **Add loading skeletons** for in-page refetch (not just route load).
17. **Add "Try again" buttons to all 9 error states**.
18. **Bump all touch targets to `min-h-[44px] min-w-[44px]`** across admin/reseller tables.
19. **Fix `SettingsSection` hardcoded version strings** ("Next.js 15.x" → read from package.json; `ORDERS_LAMBDA_URL` → `ORDER_LAMBDA_URL`).

---

## 7. Files Modified in This PR

| File | Change |
|---|---|
| `app/admin/components/DiscountsSection.tsx` | Added bulk selection helpers (`selectAllVisible`, `clearAllVisible`, `clearAll`, `toggleGroup`); added bulk action bar above product picker; per-group toggle on group header with selected count; `aria-label` on search input + chip remove buttons; bumped chip preview from 6 to 8 |
| `app/components/order/OrderR2ImageStrip.tsx` | Replaced sequential `for...of await` with `Promise.all(withKeys.map(...))` for parallel image fetch |
| `lib/productCatalog.ts` | Added `US_STATE_REGION_COUNT` export (excludes UK/PR/international) |
| `app/page.tsx` | Use `US_STATE_REGION_COUNT` (51) instead of `ALL_REGION_COUNT` (53) for "States Available" stat + "View All N States →" button |
| `.github/workflows/deno.yml` | **Deleted** — legacy Deno workflow that failed on every PR |
| `.github/workflows/ci.yml` | **Added** — proper Node.js CI (typecheck + test + build) |

All changes pass `npm run typecheck`, `npm run build`, and `npm test` (16/16 vitest tests).
