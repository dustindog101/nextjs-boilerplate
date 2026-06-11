import type { PaymentIntent, PaymentIntentStatus } from '../paymentTypes';

export function isIntentPastExpiry(intent: Pick<PaymentIntent, 'expiresAt'>): boolean {
  if (!intent.expiresAt) return false;
  return new Date(intent.expiresAt).getTime() <= Date.now();
}

/** Resolved status — time-based expiry unless already cancelled or confirmed. */
export function effectiveIntentStatus(intent: PaymentIntent): PaymentIntentStatus {
  if (intent.status === 'cancelled' || intent.status === 'confirmed') {
    return intent.status;
  }
  if (intent.status === 'expired' || isIntentPastExpiry(intent)) {
    return 'expired';
  }
  return intent.status;
}

export function isActivePaymentIntent(intent: PaymentIntent | null): boolean {
  if (!intent) return false;
  const status = effectiveIntentStatus(intent);
  return status === 'pending' || status === 'detected';
}

export function intentStatusLabel(status: PaymentIntentStatus): string {
  switch (status) {
    case 'pending':
      return 'Waiting for payment';
    case 'detected':
      return 'Seen on chain — confirming…';
    case 'confirmed':
      return 'Payment confirmed';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}
