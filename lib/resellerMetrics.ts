/**
 * Reseller order financial helpers — use stored snapshots, not live tier recalc.
 */

export interface PriceSnapshot {
  total?: number;
  idSubtotal?: number;
  handling?: number;
  shipping?: number;
  retailPerId?: number;
  perIdEffective?: number;
  idCount?: number;
}

export interface ResellerOrderLike {
  status?: string;
  paymentStatus?: string;
  price?: { total?: number };
  customerPrice?: PriceSnapshot;
  wholesaleCost?: PriceSnapshot;
}

export function parseMoney(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) ? n : null;
}

/** Customer-facing total (crypto / retail). */
export function customerTotalFromOrder(o: ResellerOrderLike): number | null {
  const cp = parseMoney(o.customerPrice?.total);
  if (cp !== null) return cp;
  return parseMoney(o.price?.total);
}

/** Platform wholesale charge snapshot. */
export function wholesaleFromOrder(o: ResellerOrderLike): number | null {
  return parseMoney(o.wholesaleCost?.total);
}

/** Realized profit for a paid order. */
export function profitFromOrder(o: ResellerOrderLike): number | null {
  const rev = customerTotalFromOrder(o);
  const cost = wholesaleFromOrder(o);
  if (rev === null || cost === null) return null;
  if (o.paymentStatus !== 'Paid') return null;
  return Math.round((rev - cost) * 100) / 100;
}

export function isActivePortalOrder(o: ResellerOrderLike): boolean {
  return o.status !== 'cancelled';
}

export interface ResellerFinancialSummary {
  revenueCollected: number;
  wholesaleOwed: number;
  realizedProfit: number;
  projectedProfit: number;
  paidOrderCount: number;
  unpaidOrderCount: number;
}

export function summarizeResellerOrders(orders: ResellerOrderLike[]): ResellerFinancialSummary {
  let revenueCollected = 0;
  let wholesaleOwed = 0;
  let realizedProfit = 0;
  let projectedProfit = 0;
  let paidOrderCount = 0;
  let unpaidOrderCount = 0;

  for (const o of orders) {
    if (!isActivePortalOrder(o)) continue;
    const wholesale = wholesaleFromOrder(o);
    if (wholesale !== null) wholesaleOwed += wholesale;

    const customer = customerTotalFromOrder(o);
    const isPaid = o.paymentStatus === 'Paid';

    if (isPaid && customer !== null) {
      revenueCollected += customer;
      paidOrderCount += 1;
      if (wholesale !== null) {
        realizedProfit += customer - wholesale;
      }
    } else if (!isPaid && customer !== null && wholesale !== null) {
      projectedProfit += customer - wholesale;
      unpaidOrderCount += 1;
    } else if (!isPaid) {
      unpaidOrderCount += 1;
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    revenueCollected: round(revenueCollected),
    wholesaleOwed: round(wholesaleOwed),
    realizedProfit: round(realizedProfit),
    projectedProfit: round(projectedProfit),
    paidOrderCount,
    unpaidOrderCount,
  };
}

export function ordersToCsvRows(orders: ResellerOrderLike[]): string[][] {
  const header = [
    'orderId',
    'date',
    'paymentStatus',
    'customerTotal',
    'wholesaleCost',
    'profit',
    'status',
  ];
  const rows = orders.map((o) => {
    const anyO = o as ResellerOrderLike & { orderId?: string; createdAt?: string };
    const customer = customerTotalFromOrder(o);
    const wholesale = wholesaleFromOrder(o);
    const profit = profitFromOrder(o);
    return [
      anyO.orderId ?? '',
      anyO.createdAt ?? '',
      o.paymentStatus ?? '',
      customer !== null ? customer.toFixed(2) : '',
      wholesale !== null ? wholesale.toFixed(2) : '',
      profit !== null ? profit.toFixed(2) : '',
      o.status ?? '',
    ];
  });
  return [header, ...rows];
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const escape = (cell: string) => {
    if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
    return cell;
  };
  const body = rows.map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
