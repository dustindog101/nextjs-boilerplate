import { NextRequest, NextResponse } from 'next/server';

const RESELLER_LAMBDA_URL = process.env.RESELLER_LAMBDA_URL;

/**
 * GET /api/reseller/orders/[orderId] — Single order for reseller dashboard if caller owns it.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    if (!RESELLER_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Reseller service is not configured.' },
            { status: 503 }
        );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { orderId } = await context.params;
    if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 });
    }

    try {
        const lambdaResponse = await fetch(RESELLER_LAMBDA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify({
                requestType: 'get_reseller_order',
                orderId: decodeURIComponent(orderId),
            }),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API /api/reseller/orders/[orderId] GET]', message);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
