# Lambda Deployments

This directory contains **AES-256-encrypted zip archives** of every Lambda
deployment made to AWS, committed to git history so changes are traceable
and recoverable.

## Password

All zips are encrypted with **AES-256** (via `pyzipper`, NOT the weak
ZipCrypto used by `zip -e`). Password is held by the repo owner — ask
`dustindog101`. Set it as env var `LAMBDA_ZIP_PASSWORD` when working with
the encryption scripts.

## Naming convention

```
<lambda_function_name>-<UTC_timestamp>-<label>.zip
```

| Label | Meaning | When to remove |
|---|---|---|
| `dev` | Current dev branch deployment (live on AWS) | Replace with next deployment's zip |
| `rollback` | Pre-dev snapshot (main branch version) | **Remove once dev → main is merged and verified** |

### Current zips

| Zip | Label | What |
|---|---|---|
| `admin_handler-20260711-162702-dev.zip` | dev | Affiliate program (v3) — live on AWS |
| `idPirateOrderLookup-20260711-162702-dev.zip` | dev | DecimalEncoder fix (v3, same code as v2) — live on AWS |
| `ID-Pirate-CreateOrder-Function-20260711-162702-dev.zip` | dev | Affiliate commission tracking (v3) — live on AWS |
| `admin_handler-20260711-153714-rollback.zip` | rollback | Pre-affiliate (v2, main branch) — **remove after dev → main merge** |
| `idPirateOrderLookup-20260711-153714-rollback.zip` | rollback | Pre-affiliate (v2, main branch) — **remove after dev → main merge** |

## How to extract

```bash
# Set the password
export LAMBDA_ZIP_PASSWORD='<password>'

# Option 1: 7-Zip
7z x admin_handler-20260711-162702-dev.zip

# Option 2: Python pyzipper
python3 -c "
import pyzipper, os
pw = os.environ['LAMBDA_ZIP_PASSWORD'].encode()
with pyzipper.AESZipFile('admin_handler-20260711-162702-dev.zip') as zf:
    zf.setpassword(pw)
    zf.extractall('extracted/')
"
```

## How to roll back to a previous version

If the dev branch Lambda changes need to be reverted:

```bash
# 1. Extract the rollback zip
export LAMBDA_ZIP_PASSWORD='<password>'
python3 -c "
import pyzipper
with pyzipper.AESZipFile('lambda-deployments/admin_handler-20260711-153714-rollback.zip') as zf:
    zf.setpassword(__import__('os').environ['LAMBDA_ZIP_PASSWORD'].encode())
    zf.extractall('/tmp/rollback-admin_handler/')
"

# 2. Deploy the rollback source to AWS
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... python3 -c "
import boto3, sys
sys.path.insert(0, '/home/z/my-project/scripts')
from deploy_lambdas import zip_directory
from pathlib import Path
zip_bytes = zip_directory(Path('/tmp/rollback-admin_handler'))
lam = boto3.client('lambda', region_name='us-east-1')
lam.update_function_code(FunctionName='admin_handler', ZipFile=zip_bytes, Publish=True)
print('Rolled back admin_handler to pre-dev version')
"
```

## How to create a new deployment zip

After editing Lambda source in `/home/z/my-project/repos/idpirate-lambdas/`:

```bash
# 1. Zip the changed Lambda(s) — creates unencrypted zip
python3 /home/z/my-project/scripts/zip_lambda_for_commit.py admin_handler ID-Pirate-CreateOrder-Function

# 2. Deploy to AWS
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... python3 /home/z/my-project/scripts/deploy_lambdas.py

# 3. Encrypt the zips with AES-256
LAMBDA_ZIP_PASSWORD='<password>' python3 /home/z/my-project/scripts/encrypt_lambda_zips.py

# 4. Commit the encrypted zips + manifest
git add lambda-deployments/
git commit -m "lambda: <description of change>"
```

## manifest.json

A JSON index of all deployments with:
- Lambda name
- Zip filename
- Label (`dev` or `rollback`)
- UTC timestamp
- Size in bytes
- Encryption status (always `true` + `AES-256`)
- Note explaining when to remove

## Security

These zips contain **no secrets** — all sensitive values are read from Lambda
environment variables (`os.environ.get(...)`). Verified by scanning every
source file for hardcoded keys/tokens/passwords before the first commit.
The AES-256 password is an additional layer — treat it as you would any
operational secret.

## Cleanup policy

- **`dev` zips**: Keep the latest one per Lambda. When a new deployment
  is made, the previous `dev` zip can be deleted (it's superseded).
- **`rollback` zips**: Keep until the dev branch is merged to main and
  verified in production. Once approved, delete all `rollback` zips —
  they're no longer needed (the `dev` zip becomes the new baseline).

## Relationship to `lambda-backups/`

- `lambda-backups/` — one-time AES-256 encrypted snapshot of all 6 Lambdas
  at a point in time (the pristine pre-feature state, before per-ID discounts)
- `lambda-deployments/` — ongoing AES-256 encrypted zips of each deployment,
  committed per-change, with `dev` and `rollback` labels
