# R2 uploads — lifecycle and backend notes

**Cost note:** R2 storage and egress are part of the overall “stay in free tier when possible” goal—use lifecycle rules (below), avoid retaining orphan uploads forever, and keep upload sizes reasonable as volume grows. See **AGENTS.md** (*Cost, free tier, and scale*).

Python Lambda source lives in **`lambda functions/`** at the repo root (folder name includes a space). After changing handlers, deploy to AWS and point Vercel env vars at the Function URLs. Lookup handler: `lambda functions/idPirateOrderLookup/lambda_function.py`. Reseller order API: `lambda functions/reseller_handler/lambda_function.py` + **`RESELLER_LAMBDA_URL`**.

**Next.js:** `middleware.ts` does **not** rewrite `/api/*` — presign and upload APIs must stay on the same host as the page or CORS will block the browser PUT to R2.

## Object keys

- Authenticated users: `u/{userId}/{uuid}-{photo|signature}.{ext}`
- Reseller portal: `r/{resellerId}/{uuid}-{photo|signature}.{ext}`
- New uploads normalize to **WebP** in the browser (`.webp`); older keys may still end in `.jpg` / `.png`.

## ORDER Lambda / DynamoDB

The create-order handler stores `ids` as sent by the client (`lambda functions/ID-Pirate-CreateOrder-Function/lambda_function.py`). Each ID object may include `**photoKey`** and `**signatureKey**`; they are persisted inside the `ids` array automatically—no schema change required if the frontend sends them.

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

## Browser uploads — CORS (required)

The browser **PUT**s directly to the presigned R2 URL. If the bucket CORS policy does not allow your origin, the request fails with an **opaque “network error”** (XHR `onerror`).

In Cloudflare Dashboard → R2 → your bucket → **Settings → CORS policy**, add rules that include **every origin** you use (dev + production), for example:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://manny.localhost:3000",
      "https://YOUR-APP.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `YOUR-APP.vercel.app` with your real hostname. After saving, hard-refresh the app and retry the upload.