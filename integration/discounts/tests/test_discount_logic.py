"""
Unit tests for the scope-aware discount logic in:
  - ID-Pirate-CreateOrder-Function/shared/order_pricing.py
  - admin_handler/lambda_function.py (create/update discount validation)
  - idPirateOrderLookup/lambda_function.py (validate_discount branch)

Uses moto to mock DynamoDB so we don't touch real AWS.
Run: pytest /home/z/my-project/repos/idpirate-lambdas/tests/test_discount_logic.py -v
"""
import os
# MUST set env BEFORE any boto3 import — Lambda modules call boto3.resource() at import time
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ.setdefault("JWT_SECRET", "test-secret-only")

import sys
import json
import decimal
import datetime
import pytest
from unittest.mock import patch, MagicMock

LAMBDA_ROOT = "/home/z/my-project/repos/idpirate-lambdas"
CREATE_ORDER_ROOT = os.path.join(LAMBDA_ROOT, "ID-Pirate-CreateOrder-Function")
ADMIN_ROOT = os.path.join(LAMBDA_ROOT, "admin_handler")
LOOKUP_ROOT = os.path.join(LAMBDA_ROOT, "idPirateOrderLookup")

# IMPORTANT: For order_pricing tests we must import from CreateOrder's shared/
# folder specifically. We do this by inserting ONLY that folder on sys.path
# (not all 4 Lambda folders, which would cause the wrong shared/ to be picked).
# The lookup/admin tests use _import_fresh which manipulates sys.path explicitly.
sys.path.insert(0, LAMBDA_ROOT)

from moto import mock_aws
import boto3


def _setup_tables():
    """Create the discounts + users + orders tables in the mock."""
    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    ddb.create_table(
        TableName="idPirate_discounts",
        KeySchema=[{"AttributeName": "code", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "code", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    ddb.create_table(
        TableName="idPirate_users",
        KeySchema=[
            {"AttributeName": "userId", "KeyType": "HASH"},
            {"AttributeName": "username", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "username", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    ddb.create_table(
        TableName="idPirate_orders",
        KeySchema=[{"AttributeName": "orderId", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "orderId", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    return ddb


def _put_discount(table, **kwargs):
    item = {
        "code": kwargs["code"],
        "discountType": kwargs.get("discountType", "percentage"),
        "value": decimal.Decimal(str(kwargs.get("value", 10))),
        "minOrder": decimal.Decimal(str(kwargs.get("minOrder", 0))),
        "usedCount": kwargs.get("usedCount", 0),
        "isActive": kwargs.get("isActive", True),
        "scope": kwargs.get("scope", "cart"),
        "createdAt": "2025-01-01T00:00:00Z",
    }
    if "maxUses" in kwargs:
        item["maxUses"] = int(kwargs["maxUses"])
    if "expiresAt" in kwargs:
        item["expiresAt"] = kwargs["expiresAt"]
    if "startsAt" in kwargs:
        item["startsAt"] = kwargs["startsAt"]
    if "productIds" in kwargs:
        item["productIds"] = set(kwargs["productIds"])
    if "allowedUsernames" in kwargs:
        item["allowedUsernames"] = set(kwargs["allowedUsernames"])
    table.put_item(Item=item)
    return item


def _make_admin_jwt():
    import jwt
    payload = {
        "userId": "admin-1",
        "username": "admin",
        "role": "admin",
        "isReseller": False,
        "exp": int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).timestamp()),
        "iat": int(datetime.datetime.now(datetime.timezone.utc).timestamp()),
    }
    return f"Bearer {jwt.encode(payload, 'test-secret-only', algorithm='HS256')}"


def _import_fresh(module_path, name="lambda_function"):
    """Remove cached modules and re-import so moto mock applies cleanly.

    After import, we monkey-patch the module's *_table references to point
    at fresh moto-backed tables (because the module created them at import
    time, before mock_aws was active)."""
    # Clear ALL cached lambda_function modules + shared modules
    for k in list(sys.modules.keys()):
        if k == name or k.startswith("shared.") or k.startswith("payment_admin") or k.startswith("payment_routes") or k.startswith("payment_shared"):
            del sys.modules[k]
    # Stub payment_admin / payment_routes so we don't load payment subsystem
    sys.modules["payment_admin"] = MagicMock(
        is_payment_admin_request=lambda rt: False,
        dispatch_payment_admin=lambda *a, **k: {},
    )
    sys.modules["payment_routes"] = MagicMock(
        is_payment_request=lambda rt: False,
        dispatch_payment=lambda *a, **k: {},
    )

    # Remove any other Lambda folders from sys.path so we import the RIGHT one
    # (both admin_handler and idPirateOrderLookup have lambda_function.py)
    lambda_root_dirs = [
        os.path.join(LAMBDA_ROOT, "admin_handler"),
        os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"),
        os.path.join(LAMBDA_ROOT, "ID-Pirate-CreateOrder-Function"),
        os.path.join(LAMBDA_ROOT, "reseller_handler"),
    ]
    for d in lambda_root_dirs:
        while d in sys.path:
            sys.path.remove(d)
    # Now insert the target path at position 0
    sys.path.insert(0, module_path)

    mod = __import__(name)

    # Rebind DynamoDB table refs to the moto-backed ones
    mock_dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
    if hasattr(mod, "discounts_table"):
        mod.discounts_table = mock_dynamodb.Table("idPirate_discounts")
    if hasattr(mod, "users_table"):
        mod.users_table = mock_dynamodb.Table("idPirate_users")
    if hasattr(mod, "orders_table"):
        mod.orders_table = mock_dynamodb.Table("idPirate_orders")
    if hasattr(mod, "batches_table"):
        try:
            mod.batches_table = mock_dynamodb.Table("idPirate_batches")
        except Exception:
            pass
    return mod


# ─── Tests: order_pricing._validate_discount_amount ──────────────────────

@mock_aws
def test_validate_cart_scope_percentage():
    _setup_tables()
    # Force CreateOrder's shared/ to be first on sys.path
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    # Drop cached shared modules
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="SAVE10", discountType="percentage", value=10, scope="cart")

    result = _validate_discount_amount("SAVE10", 200.0, table, ids_list=[])
    assert result["scope"] == "cart"
    assert result["amount"] == 20.0
    assert result["appliedTo"] is None


@mock_aws
def test_validate_cart_scope_fixed():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="FLAT15", discountType="fixed", value=15, scope="cart")

    result = _validate_discount_amount("FLAT15", 200.0, table, ids_list=[])
    assert result["amount"] == 15.0
    assert result["scope"] == "cart"


@mock_aws
def test_validate_line_item_scope_percentage():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="PERID20",
        discountType="percentage",
        value=20,
        scope="line_item",
        productIds=["PA:STANDARD", "CA:DMV_POLY"],
    )

    ids_list = [
        {"productId": "PA:STANDARD"},
        {"productId": "CA:DMV_POLY"},
        {"productId": "FL:STANDARD"},
        {"productId": "PA:STANDARD"},
    ]
    result = _validate_discount_amount("PERID20", 500.0, table, ids_list=ids_list)
    assert result["scope"] == "line_item"
    # PA:STANDARD list price = 90 → 90 × 0.20 = 18.00 × 2 units = 36.00
    # CA:DMV_POLY list price = 100 + 25 = 125 → 125 × 0.20 = 25.00 × 1 unit = 25.00
    # total = 61.00
    assert result["amount"] == 61.00, f"expected 61.00, got {result['amount']}"
    assert len(result["appliedTo"]) == 3
    pids = sorted(a["productId"] for a in result["appliedTo"])
    assert pids == ["CA:DMV_POLY", "PA:STANDARD", "PA:STANDARD"]


@mock_aws
def test_validate_line_item_scope_fixed():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="PERID10",
        discountType="fixed",
        value=10,
        scope="line_item",
        productIds=["PA:STANDARD"],
    )

    ids_list = [
        {"productId": "PA:STANDARD"},
        {"productId": "PA:STANDARD"},
        {"productId": "FL:STANDARD"},
    ]
    result = _validate_discount_amount("PERID10", 300.0, table, ids_list=ids_list)
    assert result["amount"] == 20.0
    assert len(result["appliedTo"]) == 2
    for a in result["appliedTo"]:
        assert a["perUnitDiscount"] == 10.0


@mock_aws
def test_validate_line_item_requires_ids():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="NOIDS",
        discountType="percentage",
        value=10,
        scope="line_item",
        productIds=["PA:STANDARD"],
    )
    with pytest.raises(ValueError, match="requires ids"):
        _validate_discount_amount("NOIDS", 200.0, table, ids_list=None)


@mock_aws
def test_validate_expired_code_rejected():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    past = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)).isoformat()
    _put_discount(table, code="EXPIRED", value=10, expiresAt=past)

    with pytest.raises(ValueError, match="expired"):
        _validate_discount_amount("EXPIRED", 200.0, table, ids_list=[])


@mock_aws
def test_validate_starts_at_future_rejected():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    future = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat()
    _put_discount(table, code="FUTURE", value=10, startsAt=future)

    with pytest.raises(ValueError, match="not yet active"):
        _validate_discount_amount("FUTURE", 200.0, table, ids_list=[])


@mock_aws
def test_validate_max_uses_reached():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="MAXED", value=10, maxUses=20, usedCount=20)

    with pytest.raises(ValueError, match="usage limit"):
        _validate_discount_amount("MAXED", 200.0, table, ids_list=[])


@mock_aws
def test_validate_min_order_not_met():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="MIN100", value=10, minOrder=100)

    with pytest.raises(ValueError, match="Minimum order"):
        _validate_discount_amount("MIN100", 50.0, table, ids_list=[])


@mock_aws
def test_validate_inactive_code_rejected():
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="OFF", value=10, isActive=False)

    with pytest.raises(ValueError, match="inactive"):
        _validate_discount_amount("OFF", 200.0, table, ids_list=[])


# ─── Tests: validate_discount branch in lookup Lambda ──────────────────────

@mock_aws
def test_lookup_validate_cart_scope_returns_cart():
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="CART10", value=10, scope="cart")

    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "CART10",
            "orderTotal": 200.0,
        })
    }
    response = lookup.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 200, body
    assert body["scope"] == "cart"
    assert body["discountAmount"] == 20.0
    assert "appliedTo" not in body


@mock_aws
def test_lookup_validate_line_item_scope_with_items():
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="LINE20",
        value=20,
        scope="line_item",
        productIds=["PA:STANDARD"],
    )

    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "LINE20",
            "orderTotal": 500.0,
            "items": [
                {"productId": "PA:STANDARD", "quantity": 2, "unitPrice": 90.0},
                {"productId": "FL:STANDARD", "quantity": 1, "unitPrice": 100.0},
            ],
        })
    }
    response = lookup.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 200, body
    assert body["scope"] == "line_item"
    assert body["productIds"] == ["PA:STANDARD"]
    # 2 × 90 × 0.20 = 36
    assert body["discountAmount"] == 36.0
    assert len(body["appliedTo"]) == 1
    assert body["appliedTo"][0]["productId"] == "PA:STANDARD"
    assert body["appliedTo"][0]["quantity"] == 2
    assert body["appliedTo"][0]["lineDiscount"] == 36.0


@mock_aws
def test_lookup_validate_line_item_without_items_errors():
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="NEEDITEMS",
        value=20,
        scope="line_item",
        productIds=["PA:STANDARD"],
    )

    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "NEEDITEMS",
            "orderTotal": 200.0,
        })
    }
    response = lookup.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 400
    assert "cart items" in body["error"].lower()


@mock_aws
def test_lookup_validate_allowed_usernames_enforced():
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="VIPONLY",
        value=10,
        allowedUsernames=["alice", "bob"],
    )

    # Wrong user
    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "VIPONLY",
            "orderTotal": 200.0,
            "username": "eve",
        })
    }
    response = lookup.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 403
    assert "not available" in body["error"].lower()

    # Right user
    event2 = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "VIPONLY",
            "orderTotal": 200.0,
            "username": "alice",
        })
    }
    response2 = lookup.lambda_handler(event2, None)
    body2 = json.loads(response2["body"])
    assert response2["statusCode"] == 200
    assert body2["discountAmount"] == 20.0


@mock_aws
def test_lookup_validate_old_code_without_scope_defaults_to_cart():
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    table.put_item(Item={
        "code": "LEGACY",
        "discountType": "percentage",
        "value": decimal.Decimal("15"),
        "minOrder": decimal.Decimal("0"),
        "usedCount": 0,
        "isActive": True,
        "createdAt": "2025-01-01T00:00:00Z",
    })

    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "LEGACY",
            "orderTotal": 100.0,
        })
    }
    response = lookup.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 200, body
    assert body["scope"] == "cart"
    assert body["discountAmount"] == 15.0


# ─── Tests: admin_handler create_discount + update_discount ────────────────

@mock_aws
def test_admin_create_cart_scope_discount():
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    event = {
        "body": json.dumps({
            "requestType": "create_discount",
            "code": "NEWSAVE10",
            "discountType": "percentage",
            "value": 10,
            "scope": "cart",
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 200, body

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    item = table.get_item(Key={"code": "NEWSAVE10"}).get("Item")
    assert item is not None
    assert item["scope"] == "cart"
    assert "productIds" not in item


@mock_aws
def test_admin_create_line_item_scope_discount():
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    event = {
        "body": json.dumps({
            "requestType": "create_discount",
            "code": "PERID15",
            "discountType": "percentage",
            "value": 15,
            "scope": "line_item",
            "productIds": ["PA:STANDARD", "CA:DMV_POLY"],
            "allowedUsernames": ["alice", "BOB"],
            "startsAt": "2025-01-01T00:00:00Z",
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 200, body

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    item = table.get_item(Key={"code": "PERID15"}).get("Item")
    assert item is not None
    assert item["scope"] == "line_item"
    assert item["productIds"] == {"PA:STANDARD", "CA:DMV_POLY"}
    assert item["allowedUsernames"] == {"alice", "bob"}
    assert item["startsAt"] == "2025-01-01T00:00:00Z"


@mock_aws
def test_admin_create_line_item_scope_requires_product_ids():
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    event = {
        "body": json.dumps({
            "requestType": "create_discount",
            "code": "BADPERID",
            "value": 10,
            "scope": "line_item",
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 400
    assert "productId" in body["error"]


@mock_aws
def test_admin_update_discount_can_change_scope():
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="SWITCHME", value=10, scope="cart")

    event = {
        "body": json.dumps({
            "requestType": "update_discount",
            "code": "SWITCHME",
            "updateData": {
                "scope": "line_item",
                "productIds": ["PA:STANDARD"],
            },
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    assert response["statusCode"] == 200, json.loads(response["body"])

    item = table.get_item(Key={"code": "SWITCHME"}).get("Item")
    assert item["scope"] == "line_item"
    assert item["productIds"] == {"PA:STANDARD"}


@mock_aws
def test_admin_update_discount_can_clear_productids():
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="CLEARME",
        value=10,
        scope="line_item",
        productIds=["PA:STANDARD"],
        allowedUsernames=["alice"],
    )

    event = {
        "body": json.dumps({
            "requestType": "update_discount",
            "code": "CLEARME",
            "updateData": {
                "productIds": None,
                "allowedUsernames": None,
            },
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    assert response["statusCode"] == 200, json.loads(response["body"])

    item = table.get_item(Key={"code": "CLEARME"}).get("Item")
    assert "productIds" not in item
    assert "allowedUsernames" not in item


# ─── Regression: DecimalEncoder must handle set/frozenset ─────────────────
# Bug: when a discount has productIds (DynamoDB String Set), list_discounts
# returned 500 because json.dumps couldn't serialize frozenset. This test
# ensures the encoder converts sets to sorted lists.

@mock_aws
def test_list_discounts_serializes_string_sets():
    """list_discounts must not 500 when items have productIds/allowedUsernames."""
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    # Insert an item with String Set attributes (what DynamoDB stores)
    _put_discount(
        table,
        code="WITHSET",
        value=15,
        scope="line_item",
        productIds=["PA:STANDARD", "CA:DMV_POLY", "FL:STANDARD"],
        allowedUsernames=["alice", "bob"],
    )
    # Also insert a plain cart-scope item to verify mixed responses work
    _put_discount(table, code="PLAIN", value=10, scope="cart")

    event = {
        "body": json.dumps({"requestType": "list_discounts"}),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    assert response["statusCode"] == 200, response["body"]

    items = json.loads(response["body"])
    assert len(items) == 2

    by_code = {it["code"]: it for it in items}
    assert "WITHSET" in by_code
    assert "PLAIN" in by_code

    # The String Set must come back as a JSON array (list), not crash
    pid_list = by_code["WITHSET"].get("productIds")
    assert isinstance(pid_list, list), f"expected list, got {type(pid_list)}"
    assert set(pid_list) == {"PA:STANDARD", "CA:DMV_POLY", "FL:STANDARD"}

    usernames_list = by_code["WITHSET"].get("allowedUsernames")
    assert isinstance(usernames_list, list)
    assert set(usernames_list) == {"alice", "bob"}

    # Plain item should not have productIds at all
    assert "productIds" not in by_code["PLAIN"]


@mock_aws
def test_validate_discount_serializes_string_sets_in_response():
    """validate_discount for a line_item code returns productIds as a list."""
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(
        table,
        code="LINE20",
        value=20,
        scope="line_item",
        productIds=["PA:STANDARD", "CA:DMV_POLY"],
    )

    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "LINE20",
            "orderTotal": 500.0,
            "items": [
                {"productId": "PA:STANDARD", "quantity": 2, "unitPrice": 90.0},
            ],
        })
    }
    response = lookup.lambda_handler(event, None)
    assert response["statusCode"] == 200, response["body"]
    body = json.loads(response["body"])
    # productIds in response must be a list (the Lambda explicitly sorts)
    assert isinstance(body["productIds"], list)
    assert body["productIds"] == ["CA:DMV_POLY", "PA:STANDARD"]  # sorted


# ─── AFFILIATE PROGRAM tests ──────────────────────────────────────────────

@mock_aws
def test_admin_create_affiliate_discount():
    """Admin can create a discount with affiliate ownership fields."""
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    event = {
        "body": json.dumps({
            "requestType": "create_discount",
            "code": "JOHN15",
            "discountType": "percentage",
            "value": 15,
            "scope": "cart",
            "isAffiliateCode": True,
            "ownerUsername": "John_Influencer",  # test lowercasing
            "commissionPercent": 12.5,
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 200, body

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    item = table.get_item(Key={"code": "JOHN15"}).get("Item")
    assert item is not None
    assert item["isAffiliateCode"] is True
    assert item["ownerUsername"] == "john_influencer"  # lowercased
    assert float(item["commissionPercent"]) == 12.5


@mock_aws
def test_admin_create_affiliate_requires_owner_username():
    """Affiliate code without ownerUsername is rejected."""
    _setup_tables()
    admin = _import_fresh(os.path.join(LAMBDA_ROOT, "admin_handler"))

    event = {
        "body": json.dumps({
            "requestType": "create_discount",
            "code": "NOOWNER",
            "value": 10,
            "isAffiliateCode": True,
            # no ownerUsername
            "commissionPercent": 10,
        }),
        "headers": {"Authorization": _make_admin_jwt()},
    }
    response = admin.lambda_handler(event, None)
    body = json.loads(response["body"])
    assert response["statusCode"] == 400
    assert "ownerUsername" in body["error"]


@mock_aws
def test_validate_affiliate_code_returns_commission():
    """validate_discount on an affiliate code doesn't expose commission (that's
    server-side only at order creation). But the code itself validates normally."""
    _setup_tables()
    lookup = _import_fresh(os.path.join(LAMBDA_ROOT, "idPirateOrderLookup"))

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="AFF10", value=10, scope="cart")
    # Add affiliate fields directly
    table.update_item(
        Key={"code": "AFF10"},
        UpdateExpression="SET isAffiliateCode = :a, ownerUsername = :o, commissionPercent = :c",
        ExpressionAttributeValues={
            ":a": True,
            ":o": "alice",
            ":c": decimal.Decimal("12.0"),
        },
    )

    event = {
        "body": json.dumps({
            "requestType": "validate_discount",
            "code": "AFF10",
            "orderTotal": 200.0,
        })
    }
    response = lookup.lambda_handler(event, None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["discountAmount"] == 20.0  # 10% of 200
    # validate_discount response doesn't include commission (server-side only)
    assert "commissionEarned" not in body


@mock_aws
def test_order_pricing_computes_affiliate_commission():
    """_validate_discount_amount returns commissionEarned for affiliate codes."""
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="AFF15", value=15, scope="cart")
    # Make it an affiliate code
    table.update_item(
        Key={"code": "AFF15"},
        UpdateExpression="SET isAffiliateCode = :a, ownerUsername = :o, commissionPercent = :c",
        ExpressionAttributeValues={
            ":a": True,
            ":o": "bob",
            ":c": decimal.Decimal("10.0"),
        },
    )

    result = _validate_discount_amount("AFF15", 200.0, table, ids_list=[], id_subtotal=180.0)
    # 15% discount on $200 = $30 discount
    assert result["amount"] == 30.0
    # 10% commission on $180 (id_subtotal, not order_total with fees)
    assert result["commissionEarned"] == 18.0
    assert result["affiliateOwner"] == "bob"


@mock_aws
def test_order_pricing_no_commission_for_non_affiliate():
    """_validate_discount_amount returns None commission for non-affiliate codes."""
    _setup_tables()
    if CREATE_ORDER_ROOT in sys.path:
        sys.path.remove(CREATE_ORDER_ROOT)
    sys.path.insert(0, CREATE_ORDER_ROOT)
    for k in list(sys.modules.keys()):
        if k.startswith("shared."):
            del sys.modules[k]
    from shared.order_pricing import _validate_discount_amount

    table = boto3.resource("dynamodb", region_name="us-east-1").Table("idPirate_discounts")
    _put_discount(table, code="REGULAR10", value=10, scope="cart")

    result = _validate_discount_amount("REGULAR10", 200.0, table, ids_list=[], id_subtotal=180.0)
    assert result["amount"] == 20.0
    assert result["commissionEarned"] is None
    assert result["affiliateOwner"] is None
