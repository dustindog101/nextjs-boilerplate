#!/usr/bin/env bash
# Deploy crypto payment gateway to existing ID Pirate AWS account.
# Prereq: aws login (or valid AWS credentials), .env.local with Lambda URLs.
#
# Usage:
#   ./scripts/deploy-aws-crypto.sh              # full deploy
#   ./scripts/deploy-aws-crypto.sh --tables-only
#   ./scripts/deploy-aws-crypto.sh --lambdas-only
#   ./scripts/deploy-aws-crypto.sh --dry-run
#
# Optional overrides (integration/aws-deploy.config):
#   AWS_REGION, PAYMENT_WATCHER_FUNCTION_NAME, ETHERSCAN_API_KEY, etc.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_DIR="$ROOT/dist/lambda-zips"
ENV_FILE="$ROOT/.env.local"
CONFIG_FILE="$ROOT/integration/aws-deploy.config"
REGION="${AWS_REGION:-us-east-1}"
WATCHER_NAME="${PAYMENT_WATCHER_FUNCTION_NAME:-idPirate-payment-watcher}"
EVENT_RULE_NAME="${PAYMENT_WATCHER_RULE_NAME:-idPirate-payment-watcher-every-2-min}"
DRY_RUN=false
TABLES_ONLY=false
LAMBDAS_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --tables-only) TABLES_ONLY=true ;;
    --lambdas-only) LAMBDAS_ONLY=true ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

run() {
  if $DRY_RUN; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

require_aws() {
  if ! aws sts get-caller-identity --region "$REGION" >/dev/null 2>&1; then
    echo "AWS credentials missing or expired. Run: aws login" >&2
    exit 1
  fi
  echo "AWS account: $(aws sts get-caller-identity --query Account --output text)"
  echo "Region: $REGION"
}

load_env() {
  if [[ -f "$CONFIG_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$CONFIG_FILE"
  fi
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

normalize_url() {
  local u="${1%/}"
  echo "$u"
}

resolve_fn_from_url() {
  local target
  target="$(normalize_url "$1")"
  local fn url
  for fn in $(aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output text); do
    url="$(aws lambda get-function-url-config --function-name "$fn" --region "$REGION" --query 'FunctionUrl' --output text 2>/dev/null || true)"
    [[ -z "$url" || "$url" == "None" ]] && continue
    if [[ "$(normalize_url "$url")" == "$target" ]]; then
      echo "$fn"
      return 0
    fi
  done
  return 1
}

table_exists() {
  aws dynamodb describe-table --table-name "$1" --region "$REGION" >/dev/null 2>&1
}

gsi_exists() {
  local table="$1"
  local gsi="$2"
  aws dynamodb describe-table --table-name "$table" --region "$REGION" \
    --query "GlobalSecondaryIndexes[?IndexName=='${gsi}'].IndexName" --output text 2>/dev/null | grep -q "$gsi"
}

ensure_batches_table() {
  if ! table_exists idPirate_batches; then
    echo "  Creating idPirate_batches..."
    run aws dynamodb create-table \
      --region "$REGION" \
      --table-name idPirate_batches \
      --attribute-definitions \
        AttributeName=batchId,AttributeType=S \
        AttributeName=resellerId,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
      --key-schema AttributeName=batchId,KeyType=HASH \
      --global-secondary-indexes \
        '[{"IndexName":"ResellerIdIndex","KeySchema":[{"AttributeName":"resellerId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
      --billing-mode PAY_PER_REQUEST
    run aws dynamodb wait table-exists --table-name idPirate_batches --region "$REGION"
    return
  fi

  echo "  idPirate_batches — exists"
  if gsi_exists idPirate_batches ResellerIdIndex; then
    echo "  idPirate_batches ResellerIdIndex — exists"
    return
  fi

  echo "  idPirate_batches — adding missing ResellerIdIndex GSI..."
  run aws dynamodb update-table \
    --region "$REGION" \
    --table-name idPirate_batches \
    --attribute-definitions \
      AttributeName=batchId,AttributeType=S \
      AttributeName=resellerId,AttributeType=S \
      AttributeName=createdAt,AttributeType=S \
    --global-secondary-index-updates \
      '[{"Create":{"IndexName":"ResellerIdIndex","KeySchema":[{"AttributeName":"resellerId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}}]'
  if ! $DRY_RUN; then
    echo "  Waiting for ResellerIdIndex to become ACTIVE..."
    while true; do
      status="$(aws dynamodb describe-table --table-name idPirate_batches --region "$REGION" \
        --query "GlobalSecondaryIndexes[?IndexName=='ResellerIdIndex'].IndexStatus | [0]" --output text 2>/dev/null || true)"
      [[ "$status" == "ACTIVE" ]] && break
      sleep 3
    done
  fi
}

create_payment_tables() {
  echo "== DynamoDB tables =="

  if table_exists idPirate_settings; then
    echo "  idPirate_settings — exists"
  else
    echo "  Creating idPirate_settings..."
    run aws dynamodb create-table \
      --region "$REGION" \
      --table-name idPirate_settings \
      --attribute-definitions AttributeName=pk,AttributeType=S \
      --key-schema AttributeName=pk,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST
    run aws dynamodb wait table-exists --table-name idPirate_settings --region "$REGION"
  fi

  if table_exists idPirate_payment_intents; then
    echo "  idPirate_payment_intents — exists"
  else
    echo "  Creating idPirate_payment_intents..."
    run aws dynamodb create-table \
      --region "$REGION" \
      --table-name idPirate_payment_intents \
      --attribute-definitions \
        AttributeName=intentId,AttributeType=S \
        AttributeName=orderId,AttributeType=S \
        AttributeName=status,AttributeType=S \
        AttributeName=expiresAt,AttributeType=S \
      --key-schema AttributeName=intentId,KeyType=HASH \
      --global-secondary-indexes \
        '[{"IndexName":"OrderIdIndex","KeySchema":[{"AttributeName":"orderId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"StatusExpiresIndex","KeySchema":[{"AttributeName":"status","KeyType":"HASH"},{"AttributeName":"expiresAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
      --billing-mode PAY_PER_REQUEST
    run aws dynamodb wait table-exists --table-name idPirate_payment_intents --region "$REGION"
  fi

  ensure_batches_table
}

update_lambda_zip() {
  local label="$1"
  local zip_path="$2"
  local url_var="$3"
  local url="${!url_var:-}"

  if [[ -z "$url" ]]; then
    echo "  SKIP $label — $url_var not set in .env.local"
    return 0
  fi
  if [[ ! -f "$zip_path" ]]; then
    echo "  ERROR $label — missing $zip_path (run ./scripts/build-payment-lambda-zips.sh)" >&2
    return 1
  fi

  local fn
  fn="$(resolve_fn_from_url "$url")" || {
    echo "  ERROR $label — no Lambda function matches $url_var" >&2
    return 1
  }

  echo "  Updating $label → $fn"
  run aws lambda update-function-code \
    --region "$REGION" \
    --function-name "$fn" \
    --zip-file "fileb://$zip_path" \
    --output text --query 'LastModified' >/dev/null

  # Wait for update to finish before next upload
  if ! $DRY_RUN; then
    aws lambda wait function-updated --function-name "$fn" --region "$REGION"
  fi
}

deploy_lambdas() {
  echo "== Lambda code uploads =="
  if [[ ! -d "$ZIP_DIR" ]]; then
    echo "Building zips..."
  fi
  if [[ ! -f "$ZIP_DIR/lookup.zip" ]]; then
    "$ROOT/scripts/build-payment-lambda-zips.sh"
  fi

  update_lambda_zip "LOOKUP" "$ZIP_DIR/lookup.zip" LOOKUP_LAMBDA_URL
  update_lambda_zip "ADMIN" "$ZIP_DIR/admin.zip" ADMIN_LAMBDA_URL
  update_lambda_zip "CREATE ORDER" "$ZIP_DIR/create-order.zip" ORDER_LAMBDA_URL
  update_lambda_zip "RESELLER" "$ZIP_DIR/reseller.zip" RESELLER_LAMBDA_URL
}

get_execution_role_arn() {
  local ref_url="${LOOKUP_LAMBDA_URL:-${ADMIN_LAMBDA_URL:-}}"
  if [[ -z "$ref_url" ]]; then
    echo "Set LOOKUP_LAMBDA_URL or ADMIN_LAMBDA_URL to clone IAM role for payment_watcher." >&2
    return 1
  fi
  local ref_fn
  ref_fn="$(resolve_fn_from_url "$ref_url")"
  aws lambda get-function --function-name "$ref_fn" --region "$REGION" \
    --query 'Configuration.Role' --output text
}

ensure_payment_watcher() {
  echo "== payment_watcher Lambda =="
  local zip_path="$ZIP_DIR/payment-watcher.zip"
  [[ -f "$zip_path" ]] || "$ROOT/scripts/build-payment-lambda-zips.sh"

  if aws lambda get-function --function-name "$WATCHER_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "  Updating $WATCHER_NAME..."
    run aws lambda update-function-code \
      --region "$REGION" \
      --function-name "$WATCHER_NAME" \
      --zip-file "fileb://$zip_path" \
      --output text --query 'LastModified' >/dev/null
    if ! $DRY_RUN; then
      aws lambda wait function-updated --function-name "$WATCHER_NAME" --region "$REGION"
    fi
  else
    echo "  Creating $WATCHER_NAME..."
    local role_arn="${PAYMENT_WATCHER_ROLE_ARN:-}"
    if [[ -z "$role_arn" ]]; then
      role_arn="$(get_execution_role_arn)"
      echo "  Using IAM role from existing Lambda: $role_arn"
    fi
    run aws lambda create-function \
      --region "$REGION" \
      --function-name "$WATCHER_NAME" \
      --runtime python3.12 \
      --architectures arm64 \
      --handler lambda_function.lambda_handler \
      --role "$role_arn" \
      --timeout 30 \
      --memory-size 256 \
      --zip-file "fileb://$zip_path"
    if ! $DRY_RUN; then
      aws lambda wait function-active --function-name "$WATCHER_NAME" --region "$REGION"
    fi
  fi

  local env_updates=()
  env_updates+=("CRYPTO_PAYMENTS_ENABLED=${CRYPTO_PAYMENTS_ENABLED:-true}")
  [[ -n "${ETHERSCAN_API_KEY:-}" ]] && env_updates+=("ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY")
  [[ -n "${SOLANA_RPC_URL:-}" ]] && env_updates+=("SOLANA_RPC_URL=$SOLANA_RPC_URL")
  [[ -n "${HELIUS_API_KEY:-}" ]] && env_updates+=("HELIUS_API_KEY=$HELIUS_API_KEY")

  if [[ ${#env_updates[@]} -gt 0 ]]; then
    echo "  Setting watcher env vars..."
    local json='{"Variables":{'
    local first=true
    for kv in "${env_updates[@]}"; do
      local k="${kv%%=*}" v="${kv#*=}"
      $first || json+=','
      first=false
      json+="\"$k\":\"$v\""
    done
    json+='}}'
    run aws lambda update-function-configuration \
      --region "$REGION" \
      --function-name "$WATCHER_NAME" \
      --environment "$json" \
      --output text --query 'LastModified' >/dev/null
  fi
}

ensure_eventbridge_rule() {
  echo "== EventBridge schedule =="
  local fn_arn
  fn_arn="$(aws lambda get-function --function-name "$WATCHER_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)"

  run aws events put-rule \
    --region "$REGION" \
    --name "$EVENT_RULE_NAME" \
    --schedule-expression "rate(2 minutes)" \
    --state ENABLED \
    --description "Poll blockchains for crypto payment intents"

  run aws events put-targets \
    --region "$REGION" \
    --rule "$EVENT_RULE_NAME" \
    --targets "Id"="1","Arn"="$fn_arn"

  local sid="idpirate-payment-watcher-eventbridge"
  run aws lambda add-permission \
    --region "$REGION" \
    --function-name "$WATCHER_NAME" \
    --statement-id "$sid" \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:$(aws sts get-caller-identity --query Account --output text):rule/${EVENT_RULE_NAME}" \
    2>/dev/null || true
}

set_lookup_env() {
  echo "== LOOKUP env (PAY_TOKEN_SECRET) =="
  if [[ -z "${LOOKUP_LAMBDA_URL:-}" ]]; then
    echo "  SKIP — LOOKUP_LAMBDA_URL not set"
    return 0
  fi
  if [[ -z "${PAY_TOKEN_SECRET:-}" ]]; then
    echo "  WARN — PAY_TOKEN_SECRET not in .env.local; set on LOOKUP Lambda manually"
    return 0
  fi
  local fn
  fn="$(resolve_fn_from_url "$LOOKUP_LAMBDA_URL")"
  local current
  current="$(aws lambda get-function-configuration --function-name "$fn" --region "$REGION" --query 'Environment.Variables' --output json 2>/dev/null || echo '{}')"
  local merged
  merged="$(echo "$current" | python3 -c "
import json, os, sys
v = json.load(sys.stdin) if sys.stdin.readable() else {}
if not isinstance(v, dict): v = {}
v['PAY_TOKEN_SECRET'] = os.environ['PAY_TOKEN_SECRET']
v['CRYPTO_PAYMENTS_ENABLED'] = os.environ.get('CRYPTO_PAYMENTS_ENABLED', 'true')
sys.stdout.write(json.dumps({'Variables': v}))
" PAY_TOKEN_SECRET="$PAY_TOKEN_SECRET" CRYPTO_PAYMENTS_ENABLED="${CRYPTO_PAYMENTS_ENABLED:-true}")"
  run aws lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$fn" \
    --environment "$merged" \
    --output text --query 'LastModified' >/dev/null
}

smoke_test() {
  if [[ -z "${LOOKUP_LAMBDA_URL:-}" ]]; then
    return 0
  fi
  echo "== Smoke test =="
  if command -v jq >/dev/null 2>&1; then
    LOOKUP_LAMBDA_URL="$LOOKUP_LAMBDA_URL" "$ROOT/integration/payments/smoke-test.sh"
  else
    curl -sS -X POST "$LOOKUP_LAMBDA_URL" \
      -H 'Content-Type: application/json' \
      -d '{"requestType":"list_crypto_methods"}'
    echo
  fi
}

main() {
  require_aws
  load_env

  if $TABLES_ONLY; then
    create_payment_tables
    exit 0
  fi

  if $LAMBDAS_ONLY; then
    deploy_lambdas
    ensure_payment_watcher
    ensure_eventbridge_rule
    set_lookup_env
    smoke_test
    exit 0
  fi

  create_payment_tables
  deploy_lambdas
  ensure_payment_watcher
  ensure_eventbridge_rule
  set_lookup_env
  smoke_test

  echo ""
  echo "Deploy complete. Next steps:"
  echo "  1. Set PAY_TOKEN_SECRET in Vercel + .env.local (must match LOOKUP Lambda)"
  echo "  2. Redeploy Vercel"
  echo "  3. Admin → Crypto Pay — enable assets and deposit addresses"
  echo "  See integration/AWS_DEPLOY.md for details."
}

main "$@"
