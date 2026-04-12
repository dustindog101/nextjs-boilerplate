/**
 * Returns true if `key` is stored as photoKey or signatureKey on any line item in the order.
 */
export function orderContainsR2Key(order: { ids?: unknown[] }, key: string): boolean {
  if (!key || !order?.ids || !Array.isArray(order.ids)) return false;
  for (const row of order.ids) {
    if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>;
      if (r.photoKey === key || r.signatureKey === key) return true;
    }
  }
  return false;
}
