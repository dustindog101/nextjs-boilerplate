import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/clientIp';

const ORDER_LAMBDA_URL = process.env.ORDER_LAMBDA_URL;
const LOOKUP_LAMBDA_URL = process.env.LOOKUP_LAMBDA_URL;

/**
 * GET /api/orders — Fetch all orders for the authenticated user.
 * Requires Authorization header with Bearer token.
 */
export async function GET(request: NextRequest) {
    if (!LOOKUP_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Order lookup service is not configured.' },
            { status: 503 }
        );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json(
            { error: 'Authentication required.' },
            { status: 401 }
        );
    }

    try {
        const lambdaResponse = await fetch(LOOKUP_LAMBDA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ requestType: 'list_user_orders' }),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        console.error('[API /orders GET] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders — Submit a new order.
 */
export async function POST(request: NextRequest) {
    if (!ORDER_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Order service is not configured.' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const clientIp = getClientIp(request);

        const lambdaResponse = await fetch(ORDER_LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientIp ? { ...body, clientIp } : body),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        console.error('[API /orders POST] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
