# idPirate_batches

Reseller production batching — groups portal orders without repricing.

## Schema

| Attribute | Type | Notes |
|-----------|------|-------|
| `batchId` | PK | UUID |
| `resellerId` | String | GSI PK (reseller slug) |
| `createdAt` | String | GSI SK (ISO) |
| `name` | String | User label |
| `status` | String | `draft` \| `submitted` \| `in_production` \| `shipped` \| `completed` \| `cancelled` |
| `orderIds` | List | Order IDs in batch |
| `batchType` | String | `same_address` \| `pay_later_bundle` |
| `shipTo` | String | Normalized address when same_address |
| `settlementStatus` | String | `unpaid` \| `paid` (manual v1) |

**GSI:** `ResellerIdIndex` — PK `resellerId`, SK `createdAt`

## Create (one-time)

```bash
bash scripts/deploy-aws-crypto.sh --tables-only
```
