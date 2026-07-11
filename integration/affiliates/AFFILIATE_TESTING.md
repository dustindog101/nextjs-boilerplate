# Affiliate Program — Testing Guide

This document describes how to test the affiliate program end-to-end,
what the expected results are, and how to use the test script for
future regression testing.

## Quick start

```bash
# Set AWS credentials (read/write to DynamoDB + invoke Lambdas)
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1

# Optional: set ADMIN_JWT to test the admin Lambda create_discount path
# (if not set, the script inserts the test code directly into DynamoDB)
export ADMIN_JWT="<your admin JWT>"

# Run the test
python3 /home/z/my-project/scripts/test_affiliate_flow.py
```

## What the test does

The test creates a temporary affiliate-owned discount code, validates it
through the customer-facing API, simulates an order using the code, and
verifies that commission is correctly tracked on the order. It cleans up
after itself (deletes the test code + test order).

### Test steps

| Step | What | Expected | Pass criteria |
|---|---|---|---|
| 1 | Create affiliate code (`isAffiliateCode=true`, `ownerUsername`, `commissionPercent=12.5`) | Code created in DynamoDB | `isAffiliateCode=True`, `ownerUsername` lowercased, `commissionPercent=12.5` |
| 2 | Verify affiliate fields persisted in DynamoDB | Item has all 3 affiliate fields | All fields present + correct types |
| 3 | `validate_discount` on the code (orderTotal=$200) | 200 OK, discountAmount=$30 (15%) | `status=200`, `discountAmount=30.0` |
| 4 | Verify commission NOT in validate response | `commissionEarned` + `affiliateOwner` absent | Neither field in response body |
| 5 | Create order with affiliate code | 201 Created, orderId returned | `status=201`, `orderId` present |
| 6 | Verify `commissionEarned` on order in DynamoDB | `commissionEarned=11.25` (12.5% of $90 id_subtotal), `affiliateOwner` set, `affiliatePaid=False` | All 3 fields correct |

### Commission math

The test uses:
- Discount: 15% off whole cart
- Commission: 12.5% of order subtotal
- Order: 1x PA:STANDARD ($90 list price, no volume discount for 1 ID)

So:
- `discountAmount` = 15% of $200 = **$30**
- `commissionEarned` = 12.5% of $90 (id_subtotal, NOT order_total with fees) = **$11.25**

> **Important:** Commission is calculated on `id_subtotal` (products only),
> NOT on `order_total` (which includes handling + shipping fees). This is by
> design — affiliates earn commission on product revenue, not on fees.

## Test results

Results are saved to `/home/z/my-project/download/affiliate_test_results.json`
with:
- Timestamp
- Per-step pass/fail + response body
- Test code + owner username (for debugging)
- Overall pass/fail

### Sample passing result (from 2026-07-11 test run)

```
OVERALL: PASS
Steps: 6 total, 6 passed

Step 1: create_affiliate_code_direct — PASS
Step 2: verify_dynamo_persistence — PASS
  → isAffiliateCode=True, owner=test_affiliate_89710, commission=12.5
Step 3: validate_discount — PASS (status=200, discountAmount=30.0)
Step 4: commission_not_exposed — PASS
Step 5: create_order_with_affiliate_code — PASS (status=201)
Step 6: verify_commission_on_order — PASS
  → commissionEarned=11.25 (expected 11.25)
  → affiliateOwner=test_affiliate_89710
  → affiliatePaid=False
```

## Manual testing via the admin UI

1. Log in as admin -> go to `/admin` -> Discounts tab
2. Click "New Code"
3. Fill in: Code (e.g. `JOHN15`), Type (percentage), Value (15)
4. Check "This code is owned by an affiliate"
5. Enter Affiliate Username (e.g. `john_influencer`) + Commission % (e.g. 12.5)
6. Click "Create"
7. Verify the code appears in the table with an "Aff" badge next to it
8. Hover the badge — tooltip should show "Affiliate: john_influencer (12.5%)"

## Manual testing via checkout (customer flow)

1. As a customer, add items to cart and go to `/checkout`
2. Enter the affiliate code (e.g. `JOHN15`) in the discount code field
3. Click "Apply"
4. Verify the discount is applied (15% off)
5. Verify the order summary shows the discount line
6. Complete the order
7. As admin, check the order in DynamoDB — it should have:
   - `discountCode: "JOHN15"`
   - `commissionEarned: <amount>`
   - `affiliateOwner: "john_influencer"`
   - `affiliatePaid: false`

## Regression testing

Run the test script:
- After any change to `admin_handler` discount CRUD
- After any change to `idPirateOrderLookup` validate_discount
- After any change to `ID-Pirate-CreateOrder-Function` order_pricing.py
- Before merging dev -> main

The script is safe to run against production — it creates + deletes its own
test data and never modifies existing codes or orders.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Step 1 fails with 403 | Admin JWT missing or expired | Mint a new admin JWT, or run without `ADMIN_JWT` (script falls back to direct DynamoDB insert) |
| Step 3 fails with 404 | Code not created / wrong code | Check Step 1 + 2 passed |
| Step 5 fails with 500 | Create Order Lambda error | Check CloudWatch logs for `ID-Pirate-CreateOrder-Function` |
| Step 6 commissionEarned is None | `_add_affiliate_commission` not called | Verify `id_subtotal` is passed to `_validate_discount_amount` in `calc_order_usd_total` |
| Step 6 commissionEarned wrong | Commission calculated on order_total instead of id_subtotal | Check `_add_affiliate_commission` uses `commission_base` (which is `id_subtotal`) |
