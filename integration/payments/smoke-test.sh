#!/usr/bin/env bash
# Smoke-test crypto gateway after AWS deploy. Requires env vars:
#   LOOKUP_LAMBDA_URL, ADMIN_LAMBDA_URL, ADMIN_JWT (optional)
set -euo pipefail

if [[ -z "${LOOKUP_LAMBDA_URL:-}" ]]; then
  echo "LOOKUP_LAMBDA_URL is required." >&2
  exit 1
fi

echo "== list_crypto_methods (public) =="
curl -sS -X POST "$LOOKUP_LAMBDA_URL" \
  -H 'Content-Type: application/json' \
  -d '{"requestType":"list_crypto_methods"}' | jq .

if [[ -n "${ADMIN_LAMBDA_URL:-}" && -n "${ADMIN_JWT:-}" ]]; then
  echo "== get_payment_settings (admin) =="
  curl -sS -X POST "$ADMIN_LAMBDA_URL" \
    -H "Authorization: Bearer $ADMIN_JWT" \
    -H 'Content-Type: application/json' \
    -d '{"requestType":"get_payment_settings"}' | jq .
fi

echo "Smoke test complete."
