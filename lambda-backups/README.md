# Lambda Source Backups

This directory contains **AES-256-encrypted** zip archives of the AWS Lambda
source code for the ID Pirate backend, snapshotted at the timestamp in the
filename.

## Why this exists

Per `integration/LAMBDA_WORKFLOW.md`, the canonical `lambda functions/`
directory is **gitignored** and lives only on the developer's local machine.
These backups provide a recovery path if a local copy is lost or an AWS deploy
goes wrong.

## How to extract

The zip is encrypted with **AES-256** (not the weak ZipCrypto used by
`zip -e`). Use `7z` or `pyzipper`:

```bash
# Option 1: 7-Zip
7z x idpirate-lambdas-backup-YYYYMMDD-HHMMSS.zip

# Option 2: Python pyzipper
pip install pyzipper
python3 -c "
import pyzipper
with pyzipper.AESZipFile('idpirate-lambdas-backup-YYYYMMDD-HHMMSS.zip') as zf:
    zf.setpassword(b'<PASSWORD>')
    zf.extractall('extracted/')
"

# Option 3: Windows — use 7-Zip or WinRAR (both support AES-256 zips)
```

## Password

**The password is intentionally NOT committed to this repo.** Ask the repo
owner (`dustindog101`) — they hold it.

## What's inside

Each zip contains one folder per Lambda function:

| Folder                            | Lambda name                      | Purpose                                              |
| --------------------------------- | -------------------------------- | ---------------------------------------------------- |
| `ID-Pirate-CreateOrder-Function/` | `ID-Pirate-CreateOrder-Function` | Create order; server-side pricing                    |
| `admin_handler/`                  | `admin_handler`                  | Admin CRUD; users, discounts, orders, metrics        |
| `idPirateOrderLookup/`            | `idPirateOrderLookup`            | Public track/summary; `validate_discount`; pay intents |
| `idPirate_auth/`                  | `idPirate_auth`                  | Login/register, JWT                                  |
| `reseller_handler/`               | `reseller_handler`               | Reseller-only order ops                              |
| `idPirate-payment-watcher/`       | `idPirate-payment-watcher`       | EventBridge blockchain poller (no Function URL)      |

The zip also contains `manifest.json` with metadata (runtime, handler, last
modified timestamp, redacted env-var keys) for each Lambda.

## Security note

These sources contain no hardcoded secrets — all sensitive values are read
from Lambda environment variables (`os.environ.get(...)`). The repo's
`AGENTS.md` already documents the architecture, table names, and request
routings, so the incremental exposure from this backup is minimal. The
AES-256 password is an additional layer — treat it as you would any
operational secret.

## How to create a new backup

```bash
LAMBDA_BACKUP_PASSWORD='<password>' \
  python3 /home/z/my-project/scripts/make_lambda_backup.py
```

The script reads pristine Lambda sources from
`/home/z/my-project/repos/idpirate-lambdas/` (downloaded via
`scripts/aws_lambda_inspect.py` — read-only boto3) and writes a timestamped
zip into this directory.
