import { NextRequest, NextResponse } from 'next/server';

const LOOKUP_LAMBDA_URL = process.env.LOOKUP_LAMBDA_URL;

/**
 * GET /api/reseller/public-pricing?slug= — Public retail pricing for white-label portal.
 */
export async function GET(request: NextRequest) {
  if (!LOOKUP_LAMBDA_URL) {
    return NextResponse.json(
      { error: 'Lookup service is not configured.' },
      { status: 503 }
    );
  }

  const slug = request.nextUrl.searchParams.get('slug')?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Missing query param 'slug'." }, { status: 400 });
  }

  try {
    const lambdaResponse = await fetch(LOOKUP_LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'get_reseller_public_pricing',
        resellerId: slug,
      }),
    });

    const data = await lambdaResponse.json();
    return NextResponse.json(data, { status: lambdaResponse.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/reseller/public-pricing GET]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
