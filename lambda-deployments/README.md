# Lambda Deployments

This directory contains **zip archives of every Lambda deployment** made to
AWS, committed to git history so changes are traceable and recoverable.

## Why this exists

Per the owner's rule: "each time lambda is changed it should be zipped and
committed." This provides:
- **Audit trail** — every Lambda change is a git commit with the exact code deployed
- **Recovery** — if a deployment breaks production, the previous zip is one
  `git checkout` away
- **Reproducibility** — any zip can be re-deployed via `scripts/deploy_lambdas.py`

## Naming convention

```
<lambda_function_name>-<UTC_timestamp>.zip
```

Example: `admin_handler-20260711-153714.zip`

## What's inside each zip

The full source tree of that Lambda function at deploy time:
- `lambda_function.py` (entry point)
- `shared/` (if present — product catalog, order pricing)
- `payment_shared/` (if present — crypto gateway)
- `payment_admin.py` / `payment_routes.py` / `adapters/` (if present)
- `batches.py` (if present — reseller batches)

Excludes: `__pycache__/`, `*.pyc`, `_lambda_meta.json`.

## manifest.json

A JSON index of all deployments with:
- Lambda name
- Zip filename
- UTC timestamp
- Size in bytes

## How to create a new deployment zip

After editing Lambda source in `/home/z/my-project/repos/idpirate-lambdas/`:

```bash
# Zip one or more Lambdas for commit
python3 /home/z/my-project/scripts/zip_lambda_for_commit.py admin_handler idPirateOrderLookup

# Then commit the zip(s) + manifest
git add lambda-deployments/
git commit -m "lambda: <description of change>"
```

## How to deploy a specific zip to AWS

```bash
# Deploy all 3 Lambdas from current source (scripts/deploy_lambdas.py)
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  python3 /home/z/my-project/scripts/deploy_lambdas.py

# To deploy a SPECIFIC historical zip:
# 1. Extract it to a temp dir
# 2. Use boto3 lambda.update_function_code with the zip bytes
# (See scripts/deploy_lambdas.py for the pattern)
```

## Security

These zips contain **no secrets** — all sensitive values are read from Lambda
environment variables (`os.environ.get(...)`). Verified by scanning every
source file for hardcoded keys/tokens/passwords before the first commit.

## Relationship to `lambda-backups/`

- `lambda-backups/` — one-time AES-256 encrypted snapshot of all 6 Lambdas
  at a point in time (the pristine pre-feature state)
- `lambda-deployments/` — ongoing unencrypted zips of each deployment,
  committed per-change
