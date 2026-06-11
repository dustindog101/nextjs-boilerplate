import { NextRequest, NextResponse } from 'next/server';
import { signPayToken, PAY_TOKEN_DEFAULT_TTL_SECONDS } from '@/lib/payToken';
import { isCryptoOrder, isOrderUnpaid } from '@/lib/payments/orderHelpers';

export const runtime = 'nodejs';

const LOOKUP_LAMBDA_URL = process.env.LOOKUP_LAMBDA_URL;
const PAY_TOKEN_SECRET = process.env.PAY_TOKEN_SECRET;

/** Simple per-instance rate limit for pay-session minting. */
const recentMints = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recentMints.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  recentMints.set(key, hits);
  return false;
}

/**
 * POST /api/payments/pay-session — Mint a short-lived HMAC pay token for guest crypto invoice access.
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  if (!PAY_TOKEN_SECRET) {
    return NextResponse.json({ error: 'Pay session signing is not configured.' }, { status: 503 });
  }
  if (!LOOKUP_LAMBDA_URL) {
    return NextResponse.json({ error: 'Lookup service is not configured.' }, { status: 503 });
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

  const clientKey = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(`${clientKey}:${orderId}`)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }

  try {
    const lambdaResponse = await fetch(LOOKUP_LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'track', orderId }),
    });
    const order = await lambdaResponse.json();
    if (!lambdaResponse.ok) {
      return NextResponse.json(
        { error: (order as { error?: string }).error || 'Order not found.' },
        { status: lambdaResponse.status }
      );
    }

    if (!isOrderUnpaid(order)) {
      return NextResponse.json({ error: 'Order is already paid.' }, { status: 400 });
    }
    if (!isCryptoOrder(order)) {
      return NextResponse.json(
        { error: 'This order does not use crypto payment.' },
        { status: 400 }
      );
    }

    const payToken = signPayToken(orderId, PAY_TOKEN_SECRET, PAY_TOKEN_DEFAULT_TTL_SECONDS);
    const expiresAt = new Date(Date.now() + PAY_TOKEN_DEFAULT_TTL_SECONDS * 1000).toISOString();
    return NextResponse.json({ payToken, expiresAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /payments/pay-session]', message);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
