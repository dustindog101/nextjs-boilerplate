# ID Pirate AI Coding Skills and Rules

## Why This Exists

This ruleset is for AI agents generating code in this repository. It captures architecture constraints and coding conventions to avoid regressions and style drift.

## Tech Stack (Authoritative)

- Frontend framework: Next.js `16` (App Router)
- UI: React `19`
- Language: TypeScript `5`
- Styling: Tailwind CSS `v4` + custom tokens/utilities in `app/globals.css`
- Charts/icons libs: `recharts`, `lucide-react`
- Backend services: AWS Lambda handlers (Python); source in `**lambda functions/**` at repo root
- Data store: DynamoDB (users, orders, discounts, batches)

## Cost and free-tier awareness (owner intent)

Stay within **free tiers** of Vercel, AWS (Lambda, DynamoDB, etc.), Cloudflare R2, and other services **when possible**. Code for **current** load **and** **future growth**: avoid unbounded scans, chatty Lambdas, huge payloads, and third-party APIs that assume paid tiers. Prefer pagination, efficient DynamoDB access patterns, and lean uploads. See **AGENTS.md** → *Cost, free tier, and scale* for the full note.

## Non-Negotiable Architecture Rules

1. API access from UI/page code must go through `lib/apiClient.ts`.
2. UI/page code must not call Lambda URLs directly.
3. localStorage usage must go through `lib/storage.ts` helpers:
  - `getStorageItem`
  - `setStorageItem`
  - `removeStorageItem`
4. Route Handlers in `app/api/*` are the only server proxy boundary for frontend requests.
5. Shared business constants (pricing/options) must come from `lib/constants.ts`.
6. Shared domain types must come from `lib/types.ts`.
7. Protected pages must use:
  - `withAuth` for user routes
  - `withAdminAuth` for admin routes
  - `withResellerAuth` for `/reseller`
8. Keep Lambda env vars server-only (`AUTH_LAMBDA_URL`, `ORDER_LAMBDA_URL`, `LOOKUP_LAMBDA_URL`, `ADMIN_LAMBDA_URL`, `**RESELLER_LAMBDA_URL`**); never use `NEXT_PUBLIC_`.

## Design and UX Rules

1. Preserve dark-first visual system. No light-theme page backgrounds.
2. Prefer `.glass` surfaces for card containers and maintain existing tokenized styling.
3. Price text must always use `.text-price`.
4. Reuse existing shared UI components from `app/components/ui` before introducing new primitives.
5. Keep motion subtle and consistent with current utilities (`animate-fade-up`, delays).
6. Keep legal content pages plain (simple headings + paragraphs).

## Code Style and Implementation Rules

1. Prefer functional React components with hooks.
2. Use strict TypeScript types for component props, API payloads, and state.
3. Keep page logic thin by extracting reusable logic/utilities where meaningful.
4. Never hardcode pricing values in page/component files.
5. Avoid direct `window.location` navigation in normal page flow; use Next router APIs.
6. Avoid `alert()`; use project notification patterns/components.
7. Handle loading, error, and empty states explicitly in data-fetching views.
8. When adding admin endpoints, enforce auth at both route-handler boundary and Lambda role validation.

## File Placement Conventions

- New page route: `app/<route>/page.tsx`
- New API proxy: `app/api/<resource>/route.ts`
- Reusable UI component: `app/components/ui/`
- Domain/shared logic: `lib/`
- Auth/global app concerns: `app/contexts/`, `app/hooks/`, `app/layout.tsx`
- Backend handler updates: `**lambda functions/**` (Python Lambdas deployed to AWS)

## Data Flow Contract Conventions

1. Client -> `lib/apiClient.ts` function
2. API client -> `/api/*` route handler
3. Route handler -> Lambda URL using server env var
4. Lambda -> DynamoDB
5. Response path returns through same chain with normalized JSON errors

## Pre-Commit AI Checklist

- Did I avoid direct API calls from pages/components?
- Did I avoid direct `localStorage` usage?
- Did I import constants/types from shared modules?
- Did I keep visuals aligned with the project’s dark glass style?
- Did I preserve auth guards on protected routes?
- Did I include loading/error states for async UI?
- Did I avoid leaking server env vars to client scope?

## Known Risk Areas to Watch

1. `app/hooks/useOrder.ts` still has partial mock/editing flow behavior and TODO comments.
2. `**lambda functions/**` is the backend source set in this repo; older docs mentioning `aws/handlers/` may be stale.
3. Reseller and admin flows use **different** Lambdas — do not route reseller UI through `GET /api/orders` or mix env vars.

## Reasoning and Justification

- Rules emphasize centralization (`apiClient`, `storage`, shared constants/types) because this repo already uses those as core stability seams.
- The architecture boundary rules reduce security risk (no client Lambda URLs) and simplify future migrations.
- UX rules are strict to prevent visual inconsistency across many AI-generated patches.

## Assumptions

1. `AGENTS.md` and current implementation jointly define project intent; where they conflict, prefer explicit owner constraints in `AGENTS.md`.
2. `**lambda functions/*`** is the backend source set tracked in this repo.
3. Current package versions in `package.json` are the target baseline for generated code compatibility.

## Limitations / Blind Spots

- No automated test suite exists to enforce these rules mechanically.
- Some architecture behavior depends on deployed Lambda versions not fully represented in this repository.
- Styling tokens show historical drift; consistency decisions may require owner confirmation for final canonical palette.