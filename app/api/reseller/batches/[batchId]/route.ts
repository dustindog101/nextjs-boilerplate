import { NextRequest, NextResponse } from 'next/server';

const RESELLER_LAMBDA_URL = process.env.RESELLER_LAMBDA_URL;

type RouteContext = { params: Promise<{ batchId: string }> };

async function proxyReseller(
  request: NextRequest,
  requestType: string,
  batchId: string,
  body: Record<string, unknown> = {}
) {
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

  const lambdaResponse = await fetch(RESELLER_LAMBDA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ requestType, batchId, ...body }),
  });

  const data = await lambdaResponse.json();
  return NextResponse.json(data, { status: lambdaResponse.status });
}

/** GET /api/reseller/batches/[batchId] — Batch detail. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { batchId } = await context.params;
  try {
    return await proxyReseller(request, 'get_batch', batchId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/batches/[batchId] GET]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}

/** PATCH /api/reseller/batches/[batchId] — Update draft batch. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { batchId } = await context.params;
  try {
    const body = await request.json();
    return await proxyReseller(request, 'update_batch', batchId, body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/batches/[batchId] PATCH]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
