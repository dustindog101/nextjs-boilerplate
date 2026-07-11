import { NextRequest, NextResponse } from 'next/server';

const ADMIN_LAMBDA_URL = process.env.ADMIN_LAMBDA_URL;
const LAMBDA_TIMEOUT_MS = 8_000;

/**
 * POST /api/affiliates/apply — Public. Submits an affiliate application
 * (username, email, audience info) for review. Proxies to the admin Lambda
 * with `requestType: 'apply_affiliate'`.
 *
 * No auth required — applicants may not be registered users yet. The
 * Authorization header is forwarded when present so logged-in applicants
 * can be auto-linked to their account on the backend.
 */
export async function POST(request: NextRequest) {
    if (!ADMIN_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Affiliate service is not configured.' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const authHeader = request.headers.get('Authorization');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const lambdaResponse = await fetch(ADMIN_LAMBDA_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ requestType: 'apply_affiliate', ...body }),
            signal: AbortSignal.timeout(LAMBDA_TIMEOUT_MS),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Affiliate application timed out. Please try again.' },
                { status: 504 }
            );
        }
        console.error('[API /affiliates/apply] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
