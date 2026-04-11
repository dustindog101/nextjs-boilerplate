# R2 uploads — lifecycle and backend notes

Lambda source in this repo lives under `**lambda functions/**` (gitignored). After changing handlers, deploy the ZIP to AWS and update function code. Lookup handler path: `lambda functions/idPirateOrderLookup/lambda_function.py`.

## Object keys

- Authenticated users: `u/{userId}/{uuid}-{photo|signature}.{ext}`
- Reseller portal: `r/{resellerId}/{uuid}-{photo|signature}.{ext}`

## ORDER Lambda / DynamoDB

The create-order handler stores `ids` as sent by the client (`lambda functions/ID-Pirate-CreateOrder-Function/lambda_function.py`). Each ID object may include `**photoKey**` and `**signatureKey**`; they are persisted inside the `ids` array automatically—no schema change required if the frontend sends them.

## LOOKUP Lambda — `validate_reseller`

`POST` with JSON:

```json
{ "requestType": "validate_reseller", "resellerId": "<userId>" }
```

Respond with `{ "valid": true }` or `{ "isReseller": true }` when the ID is a reseller. Otherwise reseller upload sessions return 403.

## R2 lifecycle (optional)

In Cloudflare R2 bucket settings, add a lifecycle rule to expire objects under prefixes `u/` or `r/` after **7–14 days** if you want to clean abandoned uploads that never landed on an order. Tighten rules once you track which keys are referenced by orders.

## Admin viewing

Use `adminPresignGetUrl` from `lib/apiClient.ts` (calls `POST /api/uploads/presign-get`) with an admin JWT to obtain a short-lived GET URL for a stored `photoKey` or `signatureKey`.