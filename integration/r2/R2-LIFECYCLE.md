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

The browser **PUT**s directly to the presigned URL on `*.r2.cloudflarestorage.com` (a **different origin** than `https://yourslug.idpirate.com`). Cloudflare must return `Access-Control-Allow-Origin` on that host or the browser blocks the request.

**Why preflight fails:** Uploads use `Content-Type: image/webp`, which is **not** a [simple request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#what_requests_use_cors) content type, so the browser sends an **OPTIONS** preflight before PUT. Your CORS rule must allow **OPTIONS** (not only PUT). If OPTIONS is missing, DevTools shows: *“Response to preflight request doesn’t pass access control check”* and *No `Access-Control-Allow-Origin` header*.

**Origins must match exactly:** `https://idpirate.com` does **not** cover `https://shaygocray123.idpirate.com`. Each reseller subdomain is its own origin. Either list them explicitly or use a single permissive origin (below).

In Cloudflare Dashboard → R2 → your bucket → **Settings → CORS policy** → JSON:

**Option A — all app origins (good for white-label):** one rule with a wildcard origin. Access is still gated by **presigned URLs** (opaque tokens), not public bucket listing.

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**Option B — explicit origins only:** include apex, `www`, Vercel preview, localhost, and **each** reseller host you need (example):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://manny.localhost:3000",
      "https://idpirate.com",
      "https://www.idpirate.com",
      "https://YOUR-APP.vercel.app",
      "https://shaygocray123.idpirate.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

Save, wait a short time for propagation, then hard-refresh and retry. See Cloudflare’s [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/) if anything still fails.