# admin_handler.py — ID Pirate Admin Lambda
# Handles all admin-only operations via requestType dispatch.
# Every request must carry a valid admin JWT.
#
# DynamoDB Tables used:
#   idPirate_users     (userId PK, username SK, UsernameIndex GSI)
#   idPirate_orders    (orderId PK, UserIdIndex GSI on userId)
#   idPirate_discounts (code PK)
#   idPirate_batches   (batchId PK)

import json
import boto3
import decimal
import os
import jwt
import datetime
from boto3.dynamodb.conditions import Key, Attr

# --- Configuration ---
JWT_SECRET    = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_for_dev_only')
JWT_ALGORITHM = "HS256"

USERS_TABLE_NAME     = 'idPirate_users'
ORDERS_TABLE_NAME    = 'idPirate_orders'
DISCOUNTS_TABLE_NAME = 'idPirate_discounts'
BATCHES_TABLE_NAME   = 'idPirate_batches'

USER_ID_ORDER_GSI = 'UserIdIndex'  # GSI on idPirate_orders: userId

# --- AWS Resources ---
dynamodb       = boto3.resource('dynamodb')
users_table    = dynamodb.Table(USERS_TABLE_NAME)
orders_table   = dynamodb.Table(ORDERS_TABLE_NAME)
discounts_table = dynamodb.Table(DISCOUNTS_TABLE_NAME)
batches_table  = dynamodb.Table(BATCHES_TABLE_NAME)

# ── Helpers ────────────────────────────────────────────────────────────────────

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def now_iso():
    return datetime.datetime.utcnow().isoformat() + 'Z'

def verify_admin_jwt(auth_header):
    """Decode JWT and assert role == admin. Raises on failure."""
    if not auth_header:
        raise PermissionError("Authorization header is missing.")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise PermissionError("Authorization header must be 'Bearer <token>'.")
    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('role') != 'admin':
            raise PermissionError("Access denied: Administrator privileges required.")
        return payload
    except jwt.ExpiredSignatureError:
        raise PermissionError("Token has expired.")
    except jwt.InvalidTokenError:
        raise PermissionError("Invalid token.")

def ok(data, encoder=True):
    body = json.dumps(data, cls=DecimalEncoder) if encoder else json.dumps(data)
    return {'statusCode': 200, 'headers': HEADERS, 'body': body}

def err(msg, status=400):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'error': msg})}

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
}

# ── Main Handler ───────────────────────────────────────────────────────────────

def lambda_handler(event, context):
    # Handle CORS preflight
    method = event.get('requestContext', {}).get('http', {}).get('method', '')
    if method == 'OPTIONS':
        return {'statusCode': 204, 'headers': HEADERS, 'body': ''}

    try:
        auth_header = event.get('headers', {}).get('authorization') or \
                      event.get('headers', {}).get('Authorization')
        verify_admin_jwt(auth_header)

        body = event.get('body')
        if not body:
            return err("Request body is empty.")
        rb = json.loads(body)
        rt = rb.get('requestType')
        if not rt:
            return err("Missing 'requestType'.")

        # ── USER MANAGEMENT ────────────────────────────────────────────────────

        if rt == 'list_all_users':
            resp = users_table.scan()
            users = resp.get('Items', [])
            for u in users:
                u.pop('hashedPassword', None)
            return ok(users)

        elif rt == 'admin_update_user':
            user_id   = rb.get('userId')
            update_data = rb.get('updateData', {})
            if not user_id or not update_data:
                return err("Missing 'userId' or 'updateData'.")

            allowed = ['username', 'role', 'isReseller', 'discount', 'notes']
            parts, vals, names = [], {}, {}
            for k, v in update_data.items():
                if k in allowed:
                    parts.append(f"#{k} = :{k}")
                    vals[f":{k}"] = v
                    names[f"#{k}"] = k
            if not parts:
                return err("No valid fields to update.")

            parts.append("#updatedAt = :updatedAt")
            vals[":updatedAt"] = now_iso()
            names["#updatedAt"] = "updatedAt"

            users_table.update_item(
                Key={'userId': user_id},
                UpdateExpression="SET " + ", ".join(parts),
                ExpressionAttributeValues=vals,
                ExpressionAttributeNames=names,
            )
            return ok({'message': f'User {user_id} updated.'})

        elif rt == 'admin_delete_user':
            user_id = rb.get('userId')
            username = rb.get('username')  # needed for composite PK
            if not user_id or not username:
                return err("Requires 'userId' and 'username'.")
            users_table.delete_item(Key={'userId': user_id, 'username': username})
            return ok({'message': f'User {user_id} deleted.'})

        # ── ORDER MANAGEMENT ───────────────────────────────────────────────────

        elif rt == 'list_all_orders':
            # Scan all orders. For large datasets add pagination via ExclusiveStartKey.
            resp = orders_table.scan()
            orders = resp.get('Items', [])
            for o in orders:
                o['numberOfIds'] = len(o.get('ids', []))
            return ok(orders)

        elif rt == 'get_order':
            order_id = rb.get('orderId')
            if not order_id:
                return err("Missing 'orderId'.")
            resp = orders_table.get_item(Key={'orderId': order_id})
            item = resp.get('Item')
            if not item:
                return err(f"Order '{order_id}' not found.", 404)
            item['numberOfIds'] = len(item.get('ids', []))
            return ok(item)

        elif rt == 'admin_update_order':
            order_id    = rb.get('orderId')
            update_data = rb.get('updateData', {})
            if not order_id or not update_data:
                return err("Requires 'orderId' and 'updateData'.")

            allowed = ['status', 'paymentStatus', 'notes', 'shipping', 'trackingNumber']
            parts, vals, names = [], {}, {}
            for k, v in update_data.items():
                if k in allowed:
                    parts.append(f"#{k} = :{k}")
                    vals[f":{k}"] = v
                    names[f"#{k}"] = k
            if not parts:
                return err("No valid fields to update.")

            parts.append("#updatedAt = :updatedAt")
            vals[":updatedAt"] = now_iso()
            names["#updatedAt"] = "updatedAt"

            orders_table.update_item(
                Key={'orderId': order_id},
                UpdateExpression="SET " + ", ".join(parts),
                ExpressionAttributeValues=vals,
                ExpressionAttributeNames=names,
            )
            return ok({'message': f'Order {order_id} updated.'})

        # ── DISCOUNT MANAGEMENT ────────────────────────────────────────────────

        elif rt == 'list_discounts':
            resp = discounts_table.scan()
            return ok(resp.get('Items', []))

        elif rt == 'create_discount':
            code = rb.get('code', '').strip().upper()
            if not code:
                return err("Missing 'code'.")
            discount_type  = rb.get('discountType', 'percentage')  # 'percentage' | 'fixed'
            discount_value = rb.get('value', 0)
            expires_at     = rb.get('expiresAt')  # ISO string or None
            max_uses       = rb.get('maxUses')    # int or None
            min_order      = rb.get('minOrder', 0)

            item = {
                'code': code,
                'discountType': discount_type,
                'value': decimal.Decimal(str(discount_value)),
                'minOrder': decimal.Decimal(str(min_order)),
                'usedCount': 0,
                'isActive': True,
                'createdAt': now_iso(),
            }
            if expires_at:
                item['expiresAt'] = expires_at
            if max_uses is not None:
                item['maxUses'] = int(max_uses)

            # Prevent overwriting an existing code
            discounts_table.put_item(
                Item=item,
                ConditionExpression=Attr('code').not_exists()
            )
            return ok({'message': f'Discount code "{code}" created.'})

        elif rt == 'update_discount':
            code = rb.get('code', '').strip().upper()
            update_data = rb.get('updateData', {})
            if not code or not update_data:
                return err("Requires 'code' and 'updateData'.")

            allowed = ['discountType', 'value', 'minOrder', 'expiresAt', 'maxUses', 'isActive']
            parts, vals, names = [], {}, {}
            for k, v in update_data.items():
                if k in allowed:
                    parts.append(f"#{k} = :{k}")
                    vals[f":{k}"] = decimal.Decimal(str(v)) if isinstance(v, (int, float)) else v
                    names[f"#{k}"] = k
            if not parts:
                return err("No valid fields.")

            parts.append("#updatedAt = :updatedAt")
            vals[":updatedAt"] = now_iso()
            names["#updatedAt"] = "updatedAt"

            discounts_table.update_item(
                Key={'code': code},
                UpdateExpression="SET " + ", ".join(parts),
                ExpressionAttributeValues=vals,
                ExpressionAttributeNames=names,
            )
            return ok({'message': f'Discount "{code}" updated.'})

        elif rt == 'delete_discount':
            code = rb.get('code', '').strip().upper()
            if not code:
                return err("Missing 'code'.")
            discounts_table.delete_item(Key={'code': code})
            return ok({'message': f'Discount "{code}" deleted.'})

        # ── METRICS ────────────────────────────────────────────────────────────

        elif rt == 'get_metrics':
            # Scan-based metrics — acceptable at this scale.
            orders_resp = orders_table.scan(
                ProjectionExpression='orderId, #s, price, createdAt, userId, paymentStatus',
                ExpressionAttributeNames={'#s': 'status'}
            )
            all_orders = orders_resp.get('Items', [])

            users_resp  = users_table.scan(ProjectionExpression='userId, createdAt, isReseller')
            all_users   = users_resp.get('Items', [])

            total_revenue = sum(
                float(o.get('price', {}).get('total', 0))
                for o in all_orders
                if o.get('paymentStatus') == 'Paid'
            )
            status_counts = {}
            for o in all_orders:
                s = o.get('status', 'unknown')
                status_counts[s] = status_counts.get(s, 0) + 1

            reseller_count = sum(1 for u in all_users if u.get('isReseller'))

            return ok({
                'totalOrders':   len(all_orders),
                'totalUsers':    len(all_users),
                'totalRevenue':  round(total_revenue, 2),
                'resellerCount': reseller_count,
                'statusBreakdown': status_counts,
            })

        # ── REFERRALS / AFFILIATES ────────────────────────────────────────────

        elif rt == 'list_referrals':
            # Find all users who have a referredBy field set.
            resp = users_table.scan(
                FilterExpression=Attr('referredBy').exists(),
                ProjectionExpression='userId, username, referredBy, createdAt',
            )
            referred = resp.get('Items', [])

            # Group by referrer
            referral_map = {}
            for u in referred:
                referrer = u.get('referredBy', '')
                if referrer not in referral_map:
                    referral_map[referrer] = []
                referral_map[referrer].append({
                    'userId': u['userId'],
                    'username': u['username'],
                    'joinedAt': u.get('createdAt', ''),
                })

            result = [
                {'referrer': k, 'referredUsers': v, 'count': len(v)}
                for k, v in referral_map.items()
            ]
            result.sort(key=lambda x: x['count'], reverse=True)
            return ok(result)

        else:
            return err(f"Unknown requestType: '{rt}'.")

    except PermissionError as e:
        return err(str(e), 403)
    except ValueError as e:
        return err(str(e), 400)
    except discounts_table.meta.client.exceptions.ConditionalCheckFailedException:
        return err("Discount code already exists.", 409)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return err('Internal server error.', 500)