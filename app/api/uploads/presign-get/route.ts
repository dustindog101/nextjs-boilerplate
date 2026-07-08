import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload } from '@/lib/auth-server';
import { clampPresignGetTtl, getPresignedGetUrl } from '@/lib/r2';

export const runtime = 'nodejs';

/**
 * Admin-only: returns a presigned GET URL for an object key in R2.
 * Accepts an optional `expiresInSeconds` to customize the link lifetime
 * (used by the admin export modal so exported spreadsheets stay readable
 * for longer than the default 15-minute viewing TTL).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const user = decodeJwtPayload(authHeader.slice(7).trim());
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  let body: { key?: string; expiresInSeconds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key || key.includes('..') || key.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid key.' }, { status: 400 });
  }

  const expiresInSeconds =
    typeof body.expiresInSeconds === 'number' ? clampPresignGetTtl(body.expiresInSeconds) : undefined;

  try {
    const url = await getPresignedGetUrl(key, expiresInSeconds);
    return NextResponse.json({ url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Presign GET failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
