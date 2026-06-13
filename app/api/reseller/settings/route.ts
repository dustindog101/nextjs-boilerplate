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

/** GET /api/reseller/settings — Reseller pricing settings. */
export async function GET(request: NextRequest) {
  try {
    return await proxyReseller(request, 'get_reseller_settings');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/settings GET]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}

/** PATCH /api/reseller/settings — Update reseller retail pricing. */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyReseller(request, 'update_reseller_settings', body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/settings PATCH]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
