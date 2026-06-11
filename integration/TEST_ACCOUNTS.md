# Test Accounts (ID Pirate)

Shared credentials for local/staging QA. **Not for production customer data.**

> Passwords are intentionally simple-but-strong for dev. Rotate if this repo is ever public.

## Accounts

| Role | Username | Password | `userId` (DynamoDB) | Notes |
|------|----------|----------|---------------------|-------|
| Regular user | `idpirate_test_user` | `IdPirateTest1!` | `bd74c1d4-9bf0-4d50-8a2a-0a2b7d3c8c31` | Register/login verified against live AUTH Lambda |
| Admin (promote) | `idpirate_test_admin` | `IdPirateAdmin1!` | `8c63c800-3698-44ce-9f87-a9d3ad45d29f` | Registered as `role: user` — promote once (see below) |
| Reseller | `idpirate_test_reseller` | `IdPirateReseller1!` | `48d09b92-21ad-4615-aa46-3058bd327f52` | `isReseller: true` — portal `idpirate_test_reseller.idpirate.com` |

## Promote test reseller (one-time, if recreated)

1. Register at `/account` with username `idpirate_test_reseller` / `IdPirateReseller1!`
2. DynamoDB → **`idPirate_users`** → find by `username` = `idpirate_test_reseller`
3. Set **`isReseller`** → `true`
4. Log in → `/reseller` dashboard; white-label link uses username as subdomain slug

Or admin UI: **Users** → edit `idpirate_test_reseller` → check **Is Reseller?**

Local subdomain: `http://idpirate_test_reseller.localhost:3000` (add to `RESELLER_UPLOAD_DEV_SLUGS` if uploads fail before Lambda deploy).

## Promote test admin (one-time, AWS Console)

1. Open DynamoDB → table **`idPirate_users`**
2. Find item: `userId` = `8c63c800-3698-44ce-9f87-a9d3ad45d29f`, `username` = `idpirate_test_admin`
3. Edit attribute **`role`** → `admin`
4. Save, then log in at `/account` → `/admin` should load

Or use an existing admin in the UI: **Users** → set `idpirate_test_admin` role to admin.

## Quick login test

```bash
# From project root (requires .env.local + npm run dev)
curl -s -X POST http://localhost:3000/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"requestType":"login","username":"idpirate_test_user","password":"IdPirateTest1!"}'
```

## What each account can test

| Flow | User | Admin (after promote) |
|------|------|------------------------|
| `/account` login | Yes | Yes |
| `/order/new` → checkout (manual pay) | Yes | Yes |
| `/checkout` crypto (when gateway deployed) | Yes | — |
| `/admin` Crypto Pay settings | — | Yes |
| `/dashboard`, `/orders` | Yes | Yes |
| `/reseller` dashboard | — | — | Yes (after `isReseller`) |
| White-label portal (`{username}.idpirate.com`) | — | — | Yes |

## Recreate accounts

If deleted from DynamoDB, register again at `/account` (same usernames/passwords) or:

```bash
curl -s -X POST "$AUTH_LAMBDA_URL" -H 'Content-Type: application/json' \
  -d '{"requestType":"register","username":"idpirate_test_user","password":"IdPirateTest1!","confirmPassword":"IdPirateTest1!"}'
```

Replace `AUTH_LAMBDA_URL` with your Function URL from `.env.local`.
