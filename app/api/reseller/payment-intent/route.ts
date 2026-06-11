import { NextRequest, NextResponse } from 'next/server';

const RESELLER_LAMBDA_URL = process.env.RESELLER_LAMBDA_URL;

/**
 * POST /api/reseller/payment-intent — Reseller-scoped read of crypto payment invoice.
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
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

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
  }

  try {
    const lambdaResponse = await fetch(RESELLER_LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        requestType: 'get_reseller_payment_intent',
        orderId,
      }),
    });

    const data = await lambdaResponse.json();
    return NextResponse.json(data, { status: lambdaResponse.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/payment-intent]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
