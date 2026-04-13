#!/usr/bin/env bash
# Builds a Lambda *layer* zip for PyJWT (`import jwt`) for Python 3.13 and 3.14 runtimes.
#
# AWS expects dependencies under:
#   python/lib/python3.13/site-packages/
#   python/lib/python3.14/site-packages/
# (see https://docs.aws.amazon.com/lambda/latest/dg/python-package.html )
#
# A single layer zip can include BOTH paths so the same layer works on either runtime.
#
# Usage (from repo root):
#   chmod +x scripts/build-pyjwt-lambda-layer.sh
#   ./scripts/build-pyjwt-lambda-layer.sh
# Upload pyjwt-layer.zip → Lambda → Layers → Create version → Attach to function(s).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/pyjwt-layer.zip"
WORKDIR="${ROOT}/.layer-build-pyjwt"
PYJWT_SPEC='PyJWT>=2.8.0,<3'

rm -rf "$WORKDIR"
mkdir -p "$WORKDIR/python/lib/python3.13/site-packages"
mkdir -p "$WORKDIR/python/lib/python3.14/site-packages"

python3 -m pip install "$PYJWT_SPEC" -t "$WORKDIR/python/lib/python3.13/site-packages" -q
python3 -m pip install "$PYJWT_SPEC" -t "$WORKDIR/python/lib/python3.14/site-packages" -q

find "$WORKDIR/python" -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find "$WORKDIR/python" -name '*.pyc' -delete 2>/dev/null || true

(
  cd "$WORKDIR"
  rm -f "$OUT"
  zip -r "$OUT" python -x "**/__pycache__/**" -x "**/*.pyc"
)
rm -rf "$WORKDIR"

echo "Created: $OUT"
echo "--- Top of zip (should show python/lib/python3.13/... and python/lib/python3.14/...) ---"
unzip -l "$OUT" | head -35
