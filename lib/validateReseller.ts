/**
 * Asks LOOKUP Lambda whether resellerId is allowed to use reseller upload sessions.
 * Lambda should handle POST JSON: { requestType: 'validate_reseller', resellerId } and return { valid: true } or { isReseller: true }.
 *
 * If `LOOKUP_LAMBDA_URL` is unset: returns `true` only in development, or when
 * `ALLOW_RESELLER_UPLOAD_WITHOUT_LOOKUP=true` (e.g. preview envs), so local uploads work without Lambda.
 * **Production** (`manny.idpirate.com`) always calls Lambda — localhost can look "fixed" while prod
 * still fails until Lambda is deployed and returns `valid` for that username.
 *
 * `RESELLER_UPLOAD_DEV_SLUGS` — comma-separated ids allowed in **development only** when Lambda
 * does not know your local test slug (e.g. `manny` for manny.localhost). Production ignores this.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Subdomain / path slug is case-insensitive; DynamoDB username should match after lowercasing. */
export function normalizeResellerIdForPortal(id: string): string {
  const t = id.trim();
  if (!t) return t;
  if (UUID_RE.test(t)) return t;
  return t.toLowerCase();
}

function parseLookupLambdaJson(text: string): { valid?: boolean; isReseller?: boolean } | null {
  try {
    let data: unknown = JSON.parse(text);
    // Some proxies return API Gateway–shaped JSON: { statusCode, body: "<stringified JSON>" }
    if (
      data &&
      typeof data === 'object' &&
      'body' in data &&
      typeof (data as { body: unknown }).body === 'string'
    ) {
      data = JSON.parse((data as { body: string }).body);
    }
    if (!data || typeof data !== 'object') return null;
    return data as { valid?: boolean; isReseller?: boolean };
  } catch {
    return null;
  }
}

function isDevSlugAllowlisted(resellerId: string): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  const raw = process.env.RESELLER_UPLOAD_DEV_SLUGS;
  if (!raw?.trim()) return false;
  const allowed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(resellerId);
}

/** Shown in /api/uploads/reseller-session JSON when validation fails (Network tab). */
export type ResellerLookupFailureCode =
  | 'LOOKUP_URL_MISSING'
  | 'LAMBDA_HTTP'
  | 'LAMBDA_BAD_JSON'
  | 'LAMBDA_DENIED'
  | 'LAMBDA_FETCH_ERR';

export type ResellerLookupResult =
  | { ok: true }
  | { ok: false; code: ResellerLookupFailureCode; lambdaHttpStatus?: number };

export async function lookupValidateResellerResult(resellerId: string): Promise<ResellerLookupResult> {
  const id = normalizeResellerIdForPortal(resellerId);
  if (!id) return { ok: false, code: 'LAMBDA_DENIED' };

  if (isDevSlugAllowlisted(id)) {
    console.warn(
      `[validateReseller] RESELLER_UPLOAD_DEV_SLUGS allowlist matched for "${id}" (development only).`
    );
    return { ok: true };
  }

  const url = process.env.LOOKUP_LAMBDA_URL?.trim();
  if (!url) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[validateReseller] LOOKUP_LAMBDA_URL unset — allowing reseller upload session in development only.'
      );
      return { ok: true };
    }
    if (process.env.ALLOW_RESELLER_UPLOAD_WITHOUT_LOOKUP === 'true') {
      console.warn(
        '[validateReseller] ALLOW_RESELLER_UPLOAD_WITHOUT_LOOKUP=true — skipping Lambda reseller check.'
      );
      return { ok: true };
    }
    console.warn('[validateReseller] LOOKUP_LAMBDA_URL is not set.');
    return { ok: false, code: 'LOOKUP_URL_MISSING' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'validate_reseller', resellerId: id }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn('[validateReseller] Lambda HTTP', res.status, text.slice(0, 200));
      return { ok: false, code: 'LAMBDA_HTTP', lambdaHttpStatus: res.status };
    }
    const data = parseLookupLambdaJson(text);
    if (!data) {
      console.warn('[validateReseller] Unparseable Lambda body:', text.slice(0, 300));
      return { ok: false, code: 'LAMBDA_BAD_JSON' };
    }
    if (data.valid === true || data.isReseller === true) {
      return { ok: true };
    }
    return { ok: false, code: 'LAMBDA_DENIED' };
  } catch (e) {
    console.error('[validateReseller]', e);
    return { ok: false, code: 'LAMBDA_FETCH_ERR' };
  }
}

export async function lookupValidateReseller(resellerId: string): Promise<boolean> {
  const r = await lookupValidateResellerResult(resellerId);
  return r.ok;
}
