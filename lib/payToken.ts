import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TYP = 'pay';

const DEFAULT_TTL_SECONDS = 48 * 60 * 60;

export function signPayToken(
  orderId: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = JSON.stringify({ typ: TOKEN_TYP, orderId, exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyPayToken(
  token: string,
  secret: string,
  expectedOrderId: string
): { orderId: string } | null {
  try {
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      typ?: string;
      orderId?: string;
      exp?: number;
    };
    if (payload.typ !== TOKEN_TYP || !payload.orderId || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.orderId !== expectedOrderId) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { orderId: payload.orderId };
  } catch {
    return null;
  }
}

export const PAY_TOKEN_DEFAULT_TTL_SECONDS = DEFAULT_TTL_SECONDS;
