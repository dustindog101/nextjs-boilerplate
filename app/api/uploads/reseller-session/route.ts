import { NextRequest, NextResponse } from 'next/server';
import {
  lookupValidateResellerResult,
  normalizeResellerIdForPortal,
} from '@/lib/validateReseller';
import { signResellerUploadToken } from '@/lib/uploadToken';

export const runtime = 'nodejs';

const TTL_SECONDS = 15 * 60;

export async function POST(request: NextRequest) {
  const uploadSecret = process.env.R2_UPLOAD_TOKEN_SECRET;
  if (!uploadSecret) {
    return NextResponse.json({ error: 'Upload signing is not configured.' }, { status: 503 });
  }

  let body: { resellerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const resellerId =
    typeof body.resellerId === 'string' ? normalizeResellerIdForPortal(body.resellerId) : '';
  if (!resellerId) {
    return NextResponse.json({ error: 'resellerId is required.' }, { status: 400 });
  }

  const vr = await lookupValidateResellerResult(resellerId);
  if (!vr.ok) {
    return NextResponse.json(
      {
        error: 'Invalid reseller.',
        code: vr.code,
        ...(vr.lambdaHttpStatus != null && { lambdaHttpStatus: vr.lambdaHttpStatus }),
      },
      { status: 403 }
    );
  }

  const token = signResellerUploadToken(resellerId, uploadSecret, TTL_SECONDS);
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  return NextResponse.json({ token, expiresAt });
}
