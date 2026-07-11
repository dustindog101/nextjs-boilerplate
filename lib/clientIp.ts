import { NextRequest } from 'next/server';

const MAX_IP_LEN = 45;

/** Client IP from Vercel/proxy headers — use in Route Handlers only. */
export function getClientIp(request: NextRequest): string | undefined {
  const raw =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim();
  if (!raw || raw === 'unknown') return undefined;
  return raw.slice(0, MAX_IP_LEN);
}
