# auth_handler.py Lambda Function (Consolidated for Login and Registration with Roles)

import json
import boto3
import uuid
import datetime
import bcrypt # Needs to be included in your Lambda deployment package or layer
import jwt    # Needs to be included in your Lambda deployment package or layer
import os     # For environment variables
from boto3.dynamodb.conditions import Key # For DynamoDB queries

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
USERS_TABLE_NAME = 'idPirate_users' # Confirm this table name
users_table = dynamodb.Table(USERS_TABLE_NAME)

# GSI for username lookup (Crucial for both login and registration)
USERNAME_INDEX_NAME = 'UsernameIndex' # Confirm this GSI name

# --- JWT Secret Key (VERY IMPORTANT: USE A STRONG, RANDOM KEY IN PRODUCTION) ---
# Retrieve from Lambda environment variable.
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_for_dev_only')
if JWT_SECRET == 'your_super_secret_jwt_key_for_dev_only':
    print("WARNING: JWT_SECRET environment variable not set. Using a default for development. DO NOT USE IN PRODUCTION.")

JWT_ALGORITHM = "HS256" # HMAC-SHA256, common for JWTs

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    }

    try:
        if 'body' in event:
            request_body = json.loads(event['body'])
        else:
            request_body = event

        request_type = request_body.get('requestType')
        username = request_body.get('username')
        password = request_body.get('password')

        if not request_type:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': "Missing 'requestType'. Valid types are 'login' or 'register'."})
            }
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Username and password are required.'})
            }

        # --- Handle Registration Request ---
        if request_type == 'register':
            confirm_password = request_body.get('confirmPassword')
            referrer = request_body.get('referrer') # Optional referrer

            if password != confirm_password:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Passwords do not match.'})
                }
            if len(username) < 3:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Username must be at least 3 characters long.'})
                }
            if len(password) < 8:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Password must be at least 8 characters long.'})
                }

            # Check if username already exists using GSI
            response = users_table.query(
                IndexName=USERNAME_INDEX_NAME,
                KeyConditionExpression=Key('username').eq(username)
            )
            if response['Items']:
                return {
                    'statusCode': 409, # Conflict
                    'headers': headers,
                    'body': json.dumps({'error': 'Username already exists. Please choose a different one.'})
                }

            # Hash Password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
 
            # Generate unique userId
            user_id = str(uuid.uuid4())
            current_timestamp = datetime.datetime.utcnow().isoformat() + 'Z'

            # --- Prepare user item with default role and reseller flag ---
            user_item = {
                'userId': user_id,
                'username': username,
                'hashedPassword': hashed_password,
                'role': 'user',        # Default role
                'isReseller': False,   # Default reseller flag
                'createdAt': current_timestamp,
                'updatedAt': current_timestamp, # New: Add updatedAt field
            }
            if referrer: # Add referrer if provided and not empty
                user_item['referredBy'] = referrer.strip()

            # Save user to DynamoDB
            users_table.put_item(Item=user_item)

            print(f"User '{username}' registered successfully with userId: {user_id}")
            return {
                'statusCode': 201, # Created
                'headers': headers,
                'body': json.dumps({'message': 'Registration successful! Please log in.'})
            }

        # --- Handle Login Request ---
        elif request_type == 'login':
            response = users_table.query(
                IndexName=USERNAME_INDEX_NAME,
                KeyConditionExpression=Key('username').eq(username)
            )
            user_item = response['Items'][0] if response['Items'] else None

            if not user_item:
                print(f"Login attempt for non-existent username: {username}")
                return {
                    'statusCode': 401, # Unauthorized
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid username or password.'})
                }

            if not bcrypt.checkpw(password.encode('utf-8'), user_item['hashedPassword'].encode('utf-8')):
                print(f"Login attempt with incorrect password for username: {username}")
                return {
                    'statusCode': 401, # Unauthorized
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid username or password.'})
                }

            # Generate JWT - Include role and isReseller in payload
            payload = {
                "userId": user_item['userId'],
                "username": user_item['username'],
                "role": user_item.get('role', 'user'), # Include role
                "isReseller": user_item.get('isReseller', False), # Include reseller status
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1) # Token expires in 1 hour
            }
            
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            print(f"User '{username}' logged in successfully. JWT issued.")
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Login successful!', 'token': token})
            }

        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': "Invalid 'requestType'. Valid types are 'login' or 'register'."})
            }

    except json.JSONDecodeError:
        print("Error: Invalid JSON in request body.")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid JSON in request body.'})
        }
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }

