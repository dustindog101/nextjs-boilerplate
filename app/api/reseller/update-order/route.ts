import { NextRequest, NextResponse } from 'next/server';

// Proxy route for reseller order updates.
// Forwards to RESELLER_LAMBDA_URL with requestType: update_reseller_order.
// Admin panel order updates remain POST /api/admin → admin_handler (admin_update_order).

const RESELLER_LAMBDA_URL = process.env.RESELLER_LAMBDA_URL;

export async function POST(req: NextRequest) {
    if (!RESELLER_LAMBDA_URL) {
        return NextResponse.json(
            { error: 'Reseller service is not configured.' },
            { status: 503 }
        );
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const body = await req.json();

    const lambdaResp = await fetch(RESELLER_LAMBDA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ ...body, requestType: 'update_reseller_order' }),
    });

    const data = await lambdaResp.json();
    return NextResponse.json(data, { status: lambdaResp.status });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
    });
}
