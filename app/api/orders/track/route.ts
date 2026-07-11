import { NextRequest, NextResponse } from 'next/server';

const LOOKUP_LAMBDA_URL = process.env.LOOKUP_LAMBDA_URL;
const LAMBDA_TIMEOUT_MS = 8_000;

/**
 * POST /api/orders/track — Proxies to lookup Lambda: track/summary, get_order (JWT),
 * validate_discount, etc. Forwards JSON body and Authorization when present.
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

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const auth = request.headers.get('Authorization');
        if (auth) {
            headers['Authorization'] = auth;
        }

        const lambdaResponse = await fetch(LOOKUP_LAMBDA_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(LAMBDA_TIMEOUT_MS),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Lookup service timed out. Please try again.' },
                { status: 504 }
            );
        }
        console.error('[API /orders/track] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
