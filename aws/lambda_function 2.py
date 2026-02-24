# --- START OF FILE order_lookup_function.py (Final Simplified Version) ---

import json
import boto3
import decimal
import os
import jwt
from boto3.dynamodb.conditions import Key

# --- Configuration ---
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_for_dev_only')
JWT_ALGORITHM = "HS256"
TABLE_NAME = 'idPirate_orders'
USER_ID_GSI_NAME = 'UserIdIndex'

# --- Boto3 and other initializations ---
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)

# --- Helper Classes and Functions ---
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super(DecimalEncoder, self).default(o)

def verify_jwt(auth_header):
    if not auth_header:
        raise ValueError("Authorization header is missing.")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise ValueError("Authorization header must be in 'Bearer <token>' format.")
    token = parts[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise ValueError("Token is invalid or expired.")

# --- Main Handler ---
def lambda_handler(event, context):
    try:
        # NOTE: We no longer handle headers here. This is now controlled by the Function URL config.
        body = event.get('body')
        if not body:
            # This handles the preflight OPTIONS request which has no body.
            # Returning a success code allows the browser to proceed.
            return {'statusCode': 200, 'body': json.dumps({'message': 'Preflight check successful'})}

        request_body = json.loads(body)
        request_type = request_body.get('requestType')

        if not request_type:
            raise ValueError("Missing 'requestType' in request body.")

        # --- Route 1: Public Endpoints ---
        if request_type in ['track', 'summary']:
            order_id = request_body.get('orderId')
            if not order_id:
                raise ValueError(f"Missing 'orderId' for requestType '{request_type}'.")
            
            response = table.get_item(Key={'orderId': order_id})
            item = response.get('Item')

            if not item:
                return {'statusCode': 404, 'body': json.dumps({'error': f"Order with ID '{order_id}' not found."})}

            item['numberOfIds'] = len(item.get('ids', []))
            return {'statusCode': 200, 'body': json.dumps(item, cls=DecimalEncoder)}

        # --- Route 2: Protected Endpoints ---
        elif request_type == 'list_user_orders':
            auth_header = event.get('headers', {}).get('authorization')
            jwt_payload = verify_jwt(auth_header)
            user_id = jwt_payload.get('userId')
            
            response = table.query(IndexName=USER_ID_GSI_NAME, KeyConditionExpression=Key('userId').eq(user_id))
            orders = response.get('Items', [])
            processed_orders = []
            for order in orders:
                order['numberOfIds'] = len(order.get('ids', []))
                processed_orders.append(order)
            return {'statusCode': 200, 'body': json.dumps({'orders': processed_orders}, cls=DecimalEncoder)}
        
        else:
            raise ValueError(f"Unknown 'requestType': '{request_type}'.")

    except (ValueError, jwt.PyJWTError) as e:
        return {'statusCode': 400, 'body': json.dumps({'error': str(e)})}
    except Exception as e:
        print(f"--- UNEXPECTED SERVER ERROR ---: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'An internal server error occurred.'})}

# --- END OF FILE order_lookup_function.py (Final Simplified Version) ---