import { NextRequest, NextResponse } from 'next/server';

const LOOKUP_LAMBDA_URL = process.env.LOOKUP_LAMBDA_URL;

/**
 * POST /api/orders/track — Track an order by ID (public, no auth required).
 */
export async function POST(request: NextRequest) {
    if (!LOOKUP_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Lookup service is not configured.' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();

        const lambdaResponse = await fetch(LOOKUP_LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestType: 'summary', orderId: body.orderId }),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        console.error('[API /orders/track] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
