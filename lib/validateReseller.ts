/**
 * Asks LOOKUP Lambda whether resellerId is allowed to use reseller upload sessions.
 * Lambda should handle POST JSON: { requestType: 'validate_reseller', resellerId } and return { valid: true } or { isReseller: true }.
 */
export async function lookupValidateReseller(resellerId: string): Promise<boolean> {
  const url = process.env.LOOKUP_LAMBDA_URL;
  if (!url) {
    console.warn('[validateReseller] LOOKUP_LAMBDA_URL is not set.');
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'validate_reseller', resellerId }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid?: boolean; isReseller?: boolean };
    return data.valid === true || data.isReseller === true;
  } catch (e) {
    console.error('[validateReseller]', e);
    return false;
  }
}
