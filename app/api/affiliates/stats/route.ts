import { NextRequest, NextResponse } from 'next/server';

const ADMIN_LAMBDA_URL = process.env.ADMIN_LAMBDA_URL;
const LAMBDA_TIMEOUT_MS = 8_000;

/**
 * GET /api/affiliates/stats — Authenticated. Returns the caller's affiliate
 * dashboard stats: their codes, total/pending earnings, conversion count,
 * and recent commission-bearing orders. Proxies to the admin Lambda with
 * `requestType: 'get_affiliate_stats'` + the caller's JWT.
 *
 * The Lambda determines affiliate ownership from the JWT (either
 * `isAffiliate: true` on the user record, or codes with `ownerUsername`
 * matching the caller). Returns 404 when the caller is not an affiliate.
 */
export async function GET(request: NextRequest) {
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
        const lambdaResponse = await fetch(ADMIN_LAMBDA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ requestType: 'get_affiliate_stats' }),
            signal: AbortSignal.timeout(LAMBDA_TIMEOUT_MS),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Affiliate stats lookup timed out. Please try again.' },
                { status: 504 }
            );
        }
        console.error('[API /affiliates/stats] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
