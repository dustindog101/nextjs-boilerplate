import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload } from '@/lib/auth-server';
import { getPresignedGetUrl } from '@/lib/r2';
import { orderContainsR2Key } from '@/lib/orderR2Keys';

export const runtime = 'nodejs';

const LOOKUP_LAMBDA_URL = process.env.LOOKUP_LAMBDA_URL;

/**
 * Authenticated user: presigned GET for an R2 key that belongs to their order (or admin).
 */
export async function POST(request: NextRequest) {
  if (!LOOKUP_LAMBDA_URL) {
    return NextResponse.json({ error: 'Lookup service is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  const user = decodeJwtPayload(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  let body: { orderId?: string; key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!orderId || !key || key.includes('..') || key.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid orderId or key.' }, { status: 400 });
  }

  try {
    const lambdaResponse = await fetch(LOOKUP_LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ requestType: 'get_order', orderId }),
    });

    const order = await lambdaResponse.json();
    if (!lambdaResponse.ok) {
      return NextResponse.json(
        { error: (order as { error?: string }).error || 'Order not found.' },
        { status: lambdaResponse.status === 404 ? 404 : 403 }
      );
    }

    if (user.role !== 'admin' && order.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (!orderContainsR2Key(order, key)) {
      return NextResponse.json({ error: 'Asset not part of this order.' }, { status: 403 });
    }

    const url = await getPresignedGetUrl(key);
    return NextResponse.json({ url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Presign GET failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
