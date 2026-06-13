import { NextRequest, NextResponse } from 'next/server';

const RESELLER_LAMBDA_URL = process.env.RESELLER_LAMBDA_URL;

async function proxyReseller(
  request: NextRequest,
  requestType: string,
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
    body: JSON.stringify({ requestType, ...body }),
  });

  const data = await lambdaResponse.json();
  return NextResponse.json(data, { status: lambdaResponse.status });
}

/** GET /api/reseller/batches — List batches for logged-in reseller. */
export async function GET(request: NextRequest) {
  try {
    return await proxyReseller(request, 'list_batches');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/batches GET]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}

/** POST /api/reseller/batches — Create draft batch. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyReseller(request, 'create_batch', body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/batches POST]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
