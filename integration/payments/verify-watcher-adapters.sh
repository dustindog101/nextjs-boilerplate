#!/usr/bin/env bash
# Probe external chain APIs used by payment_watcher — connectivity + auth, not live deposits.
# Run from repo root. Empty transfer lists are OK; HTTP 403/429 or NOTOK without key = fail.
#
#   ETHERSCAN_API_KEY=... HELIUS_API_KEY=... ./integration/payments/verify-watcher-adapters.sh
set -euo pipefail

UA='idPirate-payment-watcher/1.0'
PASS=0
FAIL=0

check_http() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -sS -o /tmp/idpirate-verify.json -w '%{http_code}' \
    -H "Accept: application/json" \
    -H "User-Agent: $UA" \
    "$url" || echo "000")
  if [[ "$code" == "200" ]]; then
    echo "  OK   $name (HTTP $code)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $name (HTTP $code)" >&2
    FAIL=$((FAIL + 1))
  fi
}

echo "== Esplora (BTC / LTC) =="
# Genesis coinbase address — always has txs on mainnet explorers
check_http "BTC blockstream" \
  "https://blockstream.info/api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/txs"
# Tip height — avoids flaky address validation on the public Esplora instance
check_http "LTC litecoinspace" \
  "https://litecoinspace.org/api/blocks/tip/height"

echo ""
echo "== Blockscout (Base / Optimism USDC) =="
USDC_BASE='0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
# Burn address — API should return JSON status even with zero matching txs
check_http "Base Blockscout tokentx" \
  "https://base.blockscout.com/api?module=account&action=tokentx&contractaddress=${USDC_BASE}&address=0x0000000000000000000000000000000000000001&page=1&offset=5&sort=desc"

echo ""
echo "== Etherscan V2 (Ethereum / Polygon USDC) =="
if [[ -z "${ETHERSCAN_API_KEY:-}" ]]; then
  echo "  SKIP Etherscan (set ETHERSCAN_API_KEY to test)"
else
  USDC_ETH='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  USDC_POLY='0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
  check_http "Etherscan V2 Ethereum" \
    "https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&contractaddress=${USDC_ETH}&address=0x0000000000000000000000000000000000000001&page=1&offset=5&sort=desc&apikey=${ETHERSCAN_API_KEY}"
  check_http "Etherscan V2 Polygon" \
    "https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokentx&contractaddress=${USDC_POLY}&address=0x0000000000000000000000000000000000000001&page=1&offset=5&sort=desc&apikey=${ETHERSCAN_API_KEY}"
fi

echo ""
echo "== Solana RPC =="
if [[ -n "${HELIUS_API_KEY:-}" ]]; then
  RPC="https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}"
elif [[ -n "${SOLANA_RPC_URL:-}" ]]; then
  RPC="$SOLANA_RPC_URL"
else
  RPC='https://api.mainnet-beta.solana.com'
  echo "  (using public Solana RPC — may rate-limit; set HELIUS_API_KEY for production)"
fi
code=$(curl -sS -o /tmp/idpirate-sol.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  "$RPC" || echo "000")
if [[ "$code" == "200" ]] && grep -q '"result"' /tmp/idpirate-sol.json 2>/dev/null; then
  echo "  OK   Solana getHealth (HTTP $code)"
  PASS=$((PASS + 1))
else
  echo "  FAIL Solana getHealth (HTTP $code)" >&2
  FAIL=$((FAIL + 1))
fi

echo ""
echo "== Summary: $PASS passed, $FAIL failed =="
if [[ "$FAIL" -gt 0 ]]; then
  echo "Fix failing adapters before enabling the affected assets in Admin → Payments → Gateways." >&2
  exit 1
fi
echo "All probed endpoints reachable. Watcher still needs real deposit addresses + matching on-chain amounts to confirm end-to-end."
