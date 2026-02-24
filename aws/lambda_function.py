# --- START OF FILE admin_handler.py ---

import json
import boto3
import decimal
import os
import jwt

# --- Configuration ---
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_for_dev_only')
JWT_ALGORITHM = "HS256"
USERS_TABLE_NAME = 'idPirate_users'
ORDERS_TABLE_NAME = 'idPirate_orders'
DISCOUNTS_TABLE_NAME = 'idPirate_discounts'
BATCHES_TABLE_NAME = 'idPirate_batches'

# --- Boto3 and other initializations ---
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(USERS_TABLE_NAME)

# --- Helper Classes and Functions ---
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super(DecimalEncoder, self).default(o)

def verify_admin_jwt(auth_header):
    """
    Verifies the JWT and ensures the user has the 'admin' role.
    Returns the decoded payload if valid, otherwise raises an exception.
    """
    if not auth_header:
        raise ValueError("Authorization header is missing.")
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise ValueError("Authorization header must be in 'Bearer <token>' format.")
        
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
    except PermissionError as e:
        raise e # Re-raise the specific permission error

# --- Main Handler ---
def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }

    # Handle OPTIONS preflight request immediately
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 204, 'headers': headers, 'body': ''}

    try:
        # --- Authorization Check: Every request to this handler must be from an admin ---
        auth_header = event.get('headers', {}).get('authorization')
        verify_admin_jwt(auth_header) # This will raise an error if not a valid admin

        # --- Request Processing ---
        body = event.get('body')
        if not body:
            raise ValueError("Request body is empty.")
        
        request_body = json.loads(body)
        request_type = request_body.get('requestType')

        if not request_type:
            raise ValueError("Missing 'requestType' in request body.")

        # ===================================================
        # USER MANAGEMENT ENDPOINTS
        # ===================================================
        if request_type == 'list_all_users':
            # Note: A scan is okay for a few hundred users but can be slow/costly for thousands.
            # For larger scale, you would implement pagination.
            response = users_table.scan()
            users = response.get('Items', [])
            # Remove sensitive info before sending to frontend
            for user in users:
                user.pop('hashedPassword', None)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(users, cls=DecimalEncoder)}

        elif request_type == 'admin_update_user':
            user_id_to_update = request_body.get('userId')
            update_data = request_body.get('updateData', {})
            
            if not user_id_to_update or not update_data:
                raise ValueError("Missing 'userId' or 'updateData' for update operation.")

            # Construct the UpdateExpression and ExpressionAttributeValues for DynamoDB
            update_expression_parts = []
            expression_attribute_values = {}
            
            # Map of allowed fields to update
            allowed_fields = ['username', 'role', 'isReseller', 'discount']

            for key, value in update_data.items():
                if key in allowed_fields:
                    update_expression_parts.append(f"#{key} = :{key}")
                    expression_attribute_values[f":{key}"] = value
            
            # Prevent updating empty fields
            if not update_expression_parts:
                raise ValueError("No valid fields provided for update.")

            # Add the updatedAt timestamp
            update_expression_parts.append("#updatedAt = :updatedAt")
            expression_attribute_values[":updatedAt"] = boto3.dynamodb.types.TypeSerializer().serialize(datetime.datetime.utcnow().isoformat())['S']


            update_expression = "SET " + ", ".join(update_expression_parts)
            expression_attribute_names = {f"#{key}": key for key in update_data.keys() if key in allowed_fields}
            expression_attribute_names["#updatedAt"] = "updatedAt"


            # Perform the update
            users_table.update_item(
                Key={'userId': user_id_to_update},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names
            )
            
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': f'User {user_id_to_update} updated successfully.'})}

        # --- Add other request types (orders, discounts, etc.) here in the future ---
        # elif request_type == 'list_all_orders':
        #     pass

        else:
            raise ValueError(f"Unknown admin 'requestType': '{request_type}'.")

    except (ValueError) as e:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    except (PermissionError, jwt.PyJWTError) as e:
        # Catches our specific permission errors from the JWT check
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    except Exception as e:
        import traceback
        print("--- UNEXPECTED ADMIN HANDLER ERROR ---")
        traceback.print_exc()
        print("------------------------------------")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'An internal server error occurred.'})}

# --- END OF FILE admin_handler.py ---