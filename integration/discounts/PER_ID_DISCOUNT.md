# Per-ID Discount Codes — Backend Handoff

This PR adds **per-ID (line-item) discount codes** to ID Pirate, plus fixes
two pre-existing bugs. The frontend changes are committed here; the backend
Python Lambda changes have **already been deployed** to AWS (see
`lambda-backups/` for a pristine snapshot of the previous Lambda sources).

## What changed

### DynamoDB `idPirate_discounts` (additive — no migration needed)

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `scope` | String | yes (default `'cart'` for old items) | `'cart'` \| `'line_item'` |
| `productIds` | String Set | only when `scope='line_item'` | e.g. `{'PA:STANDARD','CA:DMV_POLY'}` |
| `startsAt` | String (ISO) | optional | **Newly enforced** — was collected by UI but never persisted |
| `allowedUsernames` | String Set | optional | **Newly enforced** — was collected by UI but never persisted |

Existing items without `scope` are treated as `'cart'` everywhere
(backward compatible).

### `idPirateOrderLookup` — `validate_discount` branch

**New request fields (all optional, backward compatible):**

```jsonc
{
  "requestType": "validate_discount",
  "code": "SAVE10",
  "orderTotal": 220.00,
  "items": [                      // NEW — required for line_item scope
    { "productId": "PA:STANDARD", "quantity": 2, "unitPrice": 90.00 }
  ],
  "username": "alice"             // NEW — required when code has allowedUsernames
}
```

**New response fields:**

```jsonc
{
  "code": "SAVE10",
  "discountType": "percentage",
  "value": 10,
  "scope": "line_item",                  // NEW — always present after deploy
  "productIds": ["PA:STANDARD"],         // NEW — only when scope='line_item'
  "discountAmount": 18.00,
  "newTotal": 202.00,
  "appliedTo": [                         // NEW — only when scope='line_item'
    { "productId": "PA:STANDARD", "quantity": 2, "unitPrice": 90.00,
      "perUnitDiscount": 9.00, "lineDiscount": 18.00 }
  ]
}
```

Old callers that omit `items` / `username` keep working — Lambda falls back
to cart-scope math.

### `admin_handler` — `create_discount` + `update_discount`

`create_discount` body adds: `scope`, `productIds?`, `startsAt?`, `allowedUsernames?`
`update_discount` `updateData` allow-list adds the same four keys. Sending
`null` for any of them REMOVES the attribute (e.g. clearing `productIds`).

### `ID-Pirate-CreateOrder-Function`

- `shared/order_pricing.py` — `_validate_discount_amount` now returns a
  structured dict `{amount, appliedTo, scope}` and accepts an `ids_list`
  argument for per-line math
- `lambda_function.py` — increments `usedCount` atomically after order
  creation (**bug fix**: previously never incremented, so `maxUses` was
  unenforceable past initial validation). Also looks up the user's username
  from DynamoDB to enforce `allowedUsernames` server-side at order creation.

## Bug fixes included

1. **`startsAt` and `allowedUsernames` are now persisted + enforced.**
   Previously the admin form collected these fields but the Lambda dropped
   them silently. Now: `startsAt` blocks validation before the start time;
   `allowedUsernames` rejects users not on the list (with a 403).

2. **`usedCount` is now incremented on each order creation.** Previously
   `maxUses` only caught codes that were *already* at the limit; codes could
   be redeemed forever until someone manually edited the counter.

## Deployment (already done)

Three Lambdas were updated via `lambda:UpdateFunctionCode`:

| Lambda | Source folder | Status |
|---|---|---|
| `admin_handler` | `admin_handler/` | deployed (version 1) |
| `idPirateOrderLookup` | `idPirateOrderLookup/` | deployed (version 1) |
| `ID-Pirate-CreateOrder-Function` | `ID-Pirate-CreateOrder-Function/` | deployed (version 1) |

Smoke-tested with real data (existing code `SXC` correctly returns
`scope: "cart"` in the new response shape).

If you need to redeploy locally:
```bash
# 1. Restore source from the encrypted backup (see lambda-backups/README.md)
# 2. Apply the patches from this branch (or use the modified source already
#    on disk at /home/z/my-project/repos/idpirate-lambdas/)
# 3. Deploy with the same script:
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  python3 scripts/deploy_lambdas.py
```

## Testing

### Backend (Python, with moto mocks)
```
/home/z/my-project/repos/idpirate-lambdas/tests/test_discount_logic.py
```
20 tests covering: cart scope (percentage + fixed), line_item scope
(percentage + fixed), `ids_list` requirement, expiry, startsAt future,
maxUses reached, minOrder, inactive codes, allowedUsernames enforcement,
backward-compat for old codes without `scope`, admin create/update with
all new fields.

Run: `pytest /home/z/my-project/repos/idpirate-lambdas/tests/ -v`

### Frontend (vitest)
```
tests/pricing.test.ts
```
16 tests covering: retail volume tiers, wholesale tiers, cart-scope
discount (legacy scalar + new structured), line_item scope discount with
breakdown, total clamping, TEST product exclusion.

Run: `npm test`

## Backward compatibility

- **Old discount codes** (no `scope` attribute) → treated as `'cart'`
- **Old `validateDiscount(code, total)` callers** → still work; Lambda
  returns `scope='cart'` and no `appliedTo`
- **Old admin Lambda** (if not yet redeployed) → frontend sends
  `scope='cart'` as default; admin form still works
- **Frontend deployed before backend** → frontend falls back to cart-scope
  math when `discountResult.appliedTo` is missing
- **Backend deployed before frontend** → Lambda tolerates missing
  `items`/`username` and falls back to cart-scope logic

## Files changed

### Frontend (this repo)
- `lib/apiClient.ts` — `Discount`, `DiscountInput`, `DiscountUpdate`,
  `DiscountValidation`, `DiscountAppliedLine`, `ValidateDiscountOptions`
  types; `validateDiscount` accepts items + username
- `lib/pricing.ts` — `calcOrderPricing` accepts structured `discount`
  input; `OrderPriceBreakdown` surfaces `discountScope` + `discountAppliedTo`
- `app/admin/components/DiscountsSection.tsx` — scope radio (Cart / Specific
  products), product multi-select picker grouped by region, Scope column
  in table
- `app/checkout/page.tsx` — passes cart items + username to
  `validateDiscount`; renders per-line discount breakdown in order summary
- `tests/pricing.test.ts` — 16 vitest tests
- `vitest.config.ts` — vitest config with `@/` alias

### Backend (deployed to AWS, source at `lambda-backups/`)
- `admin_handler/lambda_function.py` — `create_discount` persists
  scope/productIds/startsAt/allowedUsernames; `update_discount` extended
  allow-list with proper String Set handling
- `idPirateOrderLookup/lambda_function.py` — `validate_discount` is
  scope-aware; enforces startsAt + allowedUsernames
- `ID-Pirate-CreateOrder-Function/shared/order_pricing.py` —
  `_validate_discount_amount` returns structured result; `calc_order_usd_total`
  surfaces `discountScope` + `discountAppliedTo`
- `ID-Pirate-CreateOrder-Function/lambda_function.py` — increments
  `usedCount`; looks up username for allowedUsernames check; persists
  `discountScope` + `discountAppliedTo` on saved orders
