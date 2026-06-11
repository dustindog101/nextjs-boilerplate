/** Human label for where an order originated (main site vs reseller portal). */

export function orderOriginLabel(order?: {
  source?: string;
  resellerId?: string;
  userId?: string;
} | null): string {
  if (!order) return '—';
  const source = (order.source || '').toLowerCase();
  if (source === 'reseller_portal' || order.resellerId) {
    return order.resellerId ? `Reseller · ${order.resellerId}` : 'Reseller portal';
  }
  if (source === 'white_label' || source === 'reseller') {
    return order.resellerId ? `Reseller · ${order.resellerId}` : 'Reseller';
  }
  if (source) {
    return source.replace(/_/g, ' ');
  }
  return 'Main site';
}
