import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload } from '@/lib/auth-server';
import { deleteObjectFromR2 } from '@/lib/r2';
import { verifyResellerUploadToken } from '@/lib/uploadToken';

export const runtime = 'nodejs';

function isSafeKey(key: string): boolean {
  return !key.includes('..') && !key.startsWith('/') && key.length > 3 && key.length < 1024;
}

export async function POST(request: NextRequest) {
  const uploadSecret = process.env.R2_UPLOAD_TOKEN_SECRET;
  if (!uploadSecret) {
    return NextResponse.json({ error: 'Upload is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const raw = authHeader.slice(7).trim();
  if (!raw) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key || !isSafeKey(key)) {
    return NextResponse.json({ error: 'Invalid key.' }, { status: 400 });
  }

  const segments = raw.split('.');
  let allowed = false;

  if (segments.length === 2) {
    const reseller = verifyResellerUploadToken(raw, uploadSecret);
    if (!reseller) {
      return NextResponse.json({ error: 'Invalid or expired upload session.' }, { status: 401 });
    }
    allowed = key.startsWith(`r/${reseller.resellerId}/`);
  } else if (segments.length === 3) {
    const user = decodeJwtPayload(raw);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }
    if (user.role === 'admin') {
      allowed = /^u\/[^/]+\/.+/.test(key) || /^r\/[^/]+\/.+/.test(key);
    } else {
      allowed = key.startsWith(`u/${user.userId}/`);
    }
  } else {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  try {
    await deleteObjectFromR2(key);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Delete failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
