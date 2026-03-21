import { NextRequest, NextResponse } from 'next/server';

// Proxy route for reseller order updates.
// Forwards requests to the admin_handler Lambda using requestType: 'reseller_update_order'.
// The Lambda performs its own JWT validation and ownership check — only the owning
// reseller (or an admin) can update status/paymentStatus on an order.

const LAMBDA_URL = process.env.ADMIN_LAMBDA_URL;

export async function POST(req: NextRequest) {
    if (!LAMBDA_URL) {
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const body = await req.json();

    const lambdaResp = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
        },
        // Inject the requestType so the Lambda knows which handler to run
        body: JSON.stringify({ ...body, requestType: 'reseller_update_order' }),
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
