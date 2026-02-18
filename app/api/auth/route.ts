import { NextRequest, NextResponse } from 'next/server';

const AUTH_LAMBDA_URL = process.env.AUTH_LAMBDA_URL;

export async function POST(request: NextRequest) {
    if (!AUTH_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Authentication service is not configured.' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();

        const lambdaResponse = await fetch(AUTH_LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await lambdaResponse.json();
        return NextResponse.json(data, { status: lambdaResponse.status });
    } catch (error: any) {
        console.error('[API /auth] Error:', error.message);
        return NextResponse.json(
            { error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
