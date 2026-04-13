/**
 * Asks LOOKUP Lambda whether resellerId is allowed to use reseller upload sessions.
 * Lambda should handle POST JSON: { requestType: 'validate_reseller', resellerId } and return { valid: true } or { isReseller: true }.
 *
 * If `LOOKUP_LAMBDA_URL` is unset: returns `true` only in development, or when
 * `ALLOW_RESELLER_UPLOAD_WITHOUT_LOOKUP=true` (e.g. preview envs), so local uploads work without Lambda.
 *
 * `RESELLER_UPLOAD_DEV_SLUGS` — comma-separated ids allowed in **development only** when Lambda
 * does not know your local test slug (e.g. `manny` for manny.localhost). Production ignores this.
 */
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

export async function lookupValidateReseller(resellerId: string): Promise<boolean> {
  const id = resellerId.trim();
  if (!id) return false;

  if (isDevSlugAllowlisted(id)) {
    console.warn(
      `[validateReseller] RESELLER_UPLOAD_DEV_SLUGS allowlist matched for "${id}" (development only).`
    );
    return true;
  }

  const url = process.env.LOOKUP_LAMBDA_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[validateReseller] LOOKUP_LAMBDA_URL unset — allowing reseller upload session in development only.'
      );
      return true;
    }
    if (process.env.ALLOW_RESELLER_UPLOAD_WITHOUT_LOOKUP === 'true') {
      console.warn(
        '[validateReseller] ALLOW_RESELLER_UPLOAD_WITHOUT_LOOKUP=true — skipping Lambda reseller check.'
      );
      return true;
    }
    console.warn('[validateReseller] LOOKUP_LAMBDA_URL is not set.');
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'validate_reseller', resellerId: id }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid?: boolean; isReseller?: boolean };
    return data.valid === true || data.isReseller === true;
  } catch (e) {
    console.error('[validateReseller]', e);
    return false;
  }
}
