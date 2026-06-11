#!/usr/bin/env bash
# Build Lambda deployment zips for the crypto payment gateway.
# Handlers use lambda_function.lambda_handler — files must be at zip root.
# Run from repo root: ./scripts/build-payment-lambda-zips.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LAMBDA_ROOT="$ROOT/lambda functions"
OUT="$ROOT/dist/lambda-zips"
mkdir -p "$OUT"

build_flat_zip() {
  local name="$1"
  local work="$OUT/.build-$name"
  local zip_path="$OUT/$name.zip"
  rm -rf "$work" "$zip_path"
  mkdir -p "$work"
  shift
  while [[ $# -gt 0 ]]; do
    local src="$1"
    local dest="${2:-$(basename "$src")}"
    if [[ -d "$LAMBDA_ROOT/$src" ]]; then
      cp -R "$LAMBDA_ROOT/$src" "$work/$dest"
    else
      cp "$LAMBDA_ROOT/$src" "$work/$dest"
    fi
    shift 2
  done
  (cd "$work" && zip -rq "$zip_path" .)
  rm -rf "$work"
  echo "Wrote $zip_path"
}

build_flat_zip lookup \
  idPirateOrderLookup/lambda_function.py lambda_function.py \
  idPirateOrderLookup/payment_routes.py payment_routes.py \
  payment_shared payment_shared \
  shared shared

build_flat_zip admin \
  admin_handler/lambda_function.py lambda_function.py \
  admin_handler/payment_admin.py payment_admin.py \
  payment_shared payment_shared \
  shared shared

build_flat_zip create-order \
  ID-Pirate-CreateOrder-Function/lambda_function.py lambda_function.py \
  shared shared

build_flat_zip payment-watcher \
  payment_watcher/lambda_function.py lambda_function.py \
  payment_watcher/adapters adapters \
  payment_shared payment_shared

build_flat_zip reseller \
  reseller_handler/lambda_function.py lambda_function.py \
  payment_shared payment_shared

echo "Done. Upload zips from $OUT to AWS Lambda (see integration/AWS_DEPLOY.md)."
