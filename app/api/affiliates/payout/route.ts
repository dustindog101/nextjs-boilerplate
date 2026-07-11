import { NextRequest, NextResponse } from 'next/server';

const ADMIN_LAMBDA_URL = process.env.ADMIN_LAMBDA_URL;
const LAMBDA_TIMEOUT_MS = 8_000;

/**
 * POST /api/affiliates/payout — Authenticated. Requests a PayPal payout
 * for the caller's current pending affiliate balance (must be >= $50).
 * Proxies to the admin Lambda with `requestType: 'request_affiliate_payout'`
 * + the caller's JWT.
 */
export async function POST(request: NextRequest) {
    if (!ADMIN_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Affiliate service is not configured.' },
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
        // Body optional — future fields (e.g. PayPal email) can be forwarded.
        let body: Record<string, unknown> = {};
        try {
            body = await request.json();
        } catch {
            // No body or invalid JSON — proceed with empty payload.
        }

        const lambdaResponse = await fetch(ADMIN_LAMBDA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ requestType: 'request_affiliate_payout', ...body }),
            signal: AbortSignal.timeout(LAMBDA_TIMEOUT_MS),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Payout request timed out. Please try again.' },
                { status: 504 }
            );
        }
        console.error('[API /affiliates/payout] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
