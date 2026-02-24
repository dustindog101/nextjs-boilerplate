# order_lookup.py — ID Pirate Order Lookup Lambda
# Handles public tracking and authenticated order fetching.
#
# Public  requestTypes : 'track', 'validate_discount'
# Protected requestTypes: 'list_user_orders', 'get_order'

import json
import boto3
import decimal
import os
import jwt
import datetime
from boto3.dynamodb.conditions import Key

JWT_SECRET       = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_for_dev_only')
JWT_ALGORITHM    = "HS256"
ORDERS_TABLE     = 'idPirate_orders'
DISCOUNTS_TABLE  = 'idPirate_discounts'
USER_ID_GSI      = 'UserIdIndex'

dynamodb       = boto3.resource('dynamodb')
orders_table   = dynamodb.Table(ORDERS_TABLE)
discounts_table = dynamodb.Table(DISCOUNTS_TABLE)

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def verify_jwt(auth_header):
    if not auth_header:
        raise ValueError("Authorization header is missing.")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise ValueError("Invalid Authorization format.")
    try:
        return jwt.decode(parts[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise ValueError("Token is invalid or expired.")

def ok(data):
    return {'statusCode': 200, 'body': json.dumps(data, cls=DecimalEncoder)}

def err(msg, status=400):
    return {'statusCode': status, 'body': json.dumps({'error': msg})}

def lambda_handler(event, context):
    try:
        body = event.get('body')
        if not body:
            return {'statusCode': 200, 'body': json.dumps({'message': 'Preflight OK'})}

        rb = json.loads(body)
        rt = rb.get('requestType')
        if not rt:
            return err("Missing 'requestType'.")

        # ── Public endpoints ────────────────────────────────────────────────

        if rt in ['track', 'summary']:
            order_id = rb.get('orderId')
            if not order_id:
                return err("Missing 'orderId'.")
            resp = orders_table.get_item(Key={'orderId': order_id})
            item = resp.get('Item')
            if not item:
                return err(f"Order '{order_id}' not found.", 404)
            item['numberOfIds'] = len(item.get('ids', []))
            return ok(item)

        elif rt == 'validate_discount':
            code       = rb.get('code', '').strip().upper()
            order_total = float(rb.get('orderTotal', 0))
            if not code:
                return err("Missing discount code.")

            resp = discounts_table.get_item(Key={'code': code})
            d = resp.get('Item')
            if not d:
                return err("Invalid discount code.", 404)
            if not d.get('isActive', True):
                return err("Discount code is no longer active.")

            # Check expiry
            expires_at = d.get('expiresAt')
            if expires_at:
                exp_dt = datetime.datetime.fromisoformat(expires_at.replace('Z', ''))
                if datetime.datetime.utcnow() > exp_dt:
                    return err("Discount code has expired.")

            # Check usage limit
            max_uses = d.get('maxUses')
            if max_uses is not None and int(d.get('usedCount', 0)) >= int(max_uses):
                return err("Discount code has reached its usage limit.")

            # Check minimum order
            min_order = float(d.get('minOrder', 0))
            if order_total < min_order:
                return err(f"Minimum order of ${min_order:.2f} required for this code.")

            discount_type  = d.get('discountType', 'percentage')
            discount_value = float(d.get('value', 0))
            if discount_type == 'percentage':
                discount_amount = round(order_total * (discount_value / 100), 2)
            else:  # fixed
                discount_amount = min(discount_value, order_total)

            return ok({
                'code': code,
                'discountType': discount_type,
                'value': discount_value,
                'discountAmount': discount_amount,
                'newTotal': round(order_total - discount_amount, 2),
            })

        # ── Protected endpoints ─────────────────────────────────────────────

        elif rt == 'list_user_orders':
            auth_header = event.get('headers', {}).get('authorization') or \
                          event.get('headers', {}).get('Authorization')
            payload = verify_jwt(auth_header)
            user_id = payload.get('userId')

            resp = orders_table.query(
                IndexName=USER_ID_GSI,
                KeyConditionExpression=Key('userId').eq(user_id)
            )
            orders = resp.get('Items', [])
            for o in orders:
                o['numberOfIds'] = len(o.get('ids', []))
            return ok({'orders': orders})

        elif rt == 'get_order':
            # Auth required — user can only fetch their own order
            auth_header = event.get('headers', {}).get('authorization') or \
                          event.get('headers', {}).get('Authorization')
            payload = verify_jwt(auth_header)
            user_id  = payload.get('userId')
            order_id = rb.get('orderId')
            if not order_id:
                return err("Missing 'orderId'.")

            resp = orders_table.get_item(Key={'orderId': order_id})
            item = resp.get('Item')
            if not item:
                return err(f"Order '{order_id}' not found.", 404)

            # Security: non-admins can only see their own orders
            if item.get('userId') != user_id and payload.get('role') != 'admin':
                return err("Access denied.", 403)

            item['numberOfIds'] = len(item.get('ids', []))
            return ok(item)

        else:
            return err(f"Unknown requestType: '{rt}'.")

    except ValueError as e:
        return err(str(e), 400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return err('Internal server error.', 500)