import { NextRequest, NextResponse } from 'next/server';

const RESELLER_LAMBDA_URL = process.env.RESELLER_LAMBDA_URL;

type RouteContext = { params: Promise<{ batchId: string }> };

/** POST /api/reseller/batches/[batchId]/submit — Submit draft batch for production. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { batchId } = await context.params;

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

  try {
    const lambdaResponse = await fetch(RESELLER_LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        requestType: 'submit_batch',
        batchId,
      }),
    });

    const data = await lambdaResponse.json();
    return NextResponse.json(data, { status: lambdaResponse.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/batches/[batchId]/submit POST]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
