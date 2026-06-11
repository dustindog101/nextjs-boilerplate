# Payment Gateway DynamoDB Tables

**Optional.** The core site does not need these tables. Create them only when enabling the crypto payment gateway.

IAM for LOOKUP, admin_handler, and payment_watcher Lambdas must include read/write access when crypto is enabled.

## `idPirate_settings`

| Attribute | Type | Notes |
|-----------|------|-------|
| `pk` | String (PK) | Always `"site"` singleton |

No GSI required.

## `idPirate_payment_intents`

| Attribute | Type | Notes |
|-----------|------|-------|
| `intentId` | String (PK) | UUID |
| `orderId` | String | GSI partition key |
| `status` | String | GSI partition key |
| `expiresAt` | String | GSI sort key (ISO) |
| `depositAddress` | String | |
| `expectedAtomic` | String | Integer string for exact match |

### GSI: `OrderIdIndex`

- PK: `orderId`
- Projection: ALL

### GSI: `StatusExpiresIndex`

- PK: `status`
- SK: `expiresAt`
- Projection: ALL

## AWS CLI (optional)

```bash
aws dynamodb create-table \
  --table-name idPirate_settings \
  --attribute-definitions AttributeName=pk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table \
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
```

## EventBridge (payment_watcher)

```bash
# Create rule: rate(2 minutes) → payment_watcher Lambda ARN
```
