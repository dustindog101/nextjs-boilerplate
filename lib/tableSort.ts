export type SortDirection = 'asc' | 'desc';

/**
 * Client-side stable sort. `accessors[sortKey]` returns comparable values; tieBreak keeps order deterministic.
 */
export function sortRows<T>(
  rows: T[],
  sortKey: string,
  direction: SortDirection,
  accessors: Record<string, (row: T) => string | number | boolean>,
  tieBreak: (a: T, b: T) => number
): T[] {
  const get = accessors[sortKey];
  if (!get || rows.length === 0) return [...rows];
  const mult = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    let cmp = 0;
    if (typeof va === 'boolean' && typeof vb === 'boolean') {
      cmp = va === vb ? 0 : va ? 1 : -1;
    } else if (typeof va === 'number' && typeof vb === 'number') {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
    }
    if (cmp !== 0) return cmp * mult;
    return tieBreak(a, b);
  });
}
