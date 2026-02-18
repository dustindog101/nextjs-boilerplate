import { NextRequest, NextResponse } from 'next/server';

const ADMIN_LAMBDA_URL = process.env.ADMIN_LAMBDA_URL;

/**
 * POST /api/admin — Admin-only operations (list users, update user, etc.).
 * Requires Authorization header with Bearer token.
 * The Lambda itself validates admin role from the token.
 */
export async function POST(request: NextRequest) {
    if (!ADMIN_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Admin service is not configured.' },
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
        const body = await request.json();

        const lambdaResponse = await fetch(ADMIN_LAMBDA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(body),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        console.error('[API /admin] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
