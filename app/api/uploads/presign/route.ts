import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload } from '@/lib/auth-server';
import { getPresignedPutUrl } from '@/lib/r2';
import { verifyResellerUploadToken } from '@/lib/uploadToken';

export const runtime = 'nodejs';

type Kind = 'photo' | 'signature';

export async function POST(request: NextRequest) {
  const uploadSecret = process.env.R2_UPLOAD_TOKEN_SECRET;
  if (!uploadSecret) {
    return NextResponse.json({ error: 'Upload signing is not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const raw = authHeader.slice(7).trim();
  if (!raw) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: {
    contentType?: string;
    kind?: Kind;
    idFormClientId?: number;
    fileSize?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { contentType, kind, idFormClientId, fileSize } = body;
  if (kind !== 'photo' && kind !== 'signature') {
    return NextResponse.json({ error: 'kind must be photo or signature.' }, { status: 400 });
  }
  if (typeof contentType !== 'string' || !contentType) {
    return NextResponse.json({ error: 'contentType is required.' }, { status: 400 });
  }
  if (typeof fileSize !== 'number' || !Number.isFinite(fileSize)) {
    return NextResponse.json({ error: 'fileSize is required.' }, { status: 400 });
  }
  if (typeof idFormClientId !== 'number' || !Number.isFinite(idFormClientId)) {
    return NextResponse.json({ error: 'idFormClientId is required.' }, { status: 400 });
  }

  const segments = raw.split('.');
  let keyPrefix: string;

  if (segments.length === 2) {
    const reseller = verifyResellerUploadToken(raw, uploadSecret);
    if (!reseller) {
      return NextResponse.json({ error: 'Invalid or expired upload session.' }, { status: 401 });
    }
    keyPrefix = `r/${reseller.resellerId}/`;
  } else if (segments.length === 3) {
    const user = decodeJwtPayload(raw);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }
    keyPrefix = `u/${user.userId}/`;
  } else {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
  }

  try {
    const { url, key } = await getPresignedPutUrl({
      keyPrefix,
      kind,
      contentType,
      contentLength: fileSize,
    });
    return NextResponse.json({
      url,
      key,
      contentType,
      contentLength: fileSize,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Presign failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
