import type { JwtPayload } from './types';

function decodeJwtPart(part: string): string {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  return Buffer.from(padded, 'base64').toString('utf8');
}

/**
 * Decode JWT payload (same shape as client). Does not verify signature — matches existing app behavior.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = decodeJwtPart(parts[1]);
    const payload = JSON.parse(json) as JwtPayload;
    if (!payload.userId || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
