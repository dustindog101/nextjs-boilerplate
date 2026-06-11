/**
 * Crypto payment gateway — client API only.
 * All calls go through POST /api/orders/track, POST /api/admin, pay-session, or reseller routes.
 */

import { getStorageItem } from '../storage';
import type {
  CryptoMethodPublic,
  ListPaymentIntentsParams,
  ListPaymentIntentsResponse,
  PaymentActivitySummary,
  PaymentIntent,
  SitePaymentSettings,
} from '../paymentTypes';

export interface PaymentRequestOptions {
  /** HMAC guest pay token — used instead of JWT when present. */
  payToken?: string | null;
}

const PUBLIC_REQUEST_TYPES = new Set(['list_crypto_methods']);

function needsJwt(body: object, payToken?: string | null): boolean {
  const rt = (body as { requestType?: string }).requestType;
  if (!rt || PUBLIC_REQUEST_TYPES.has(rt)) return false;
  return !payToken;
}

async function trackFetch<T>(body: object, options?: PaymentRequestOptions): Promise<T> {
  const payToken = options?.payToken ?? undefined;
  const payload = payToken ? { ...body, payToken } : body;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (needsJwt(body, payToken)) {
    const token = getStorageItem('idPirateAuthToken');
    if (!token) throw new Error('Authentication required.');
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/orders/track', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Payment API error');
  }
  return data as T;
}

async function adminFetch<T>(payload: object): Promise<T> {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Admin action requires authentication token.');
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Admin API error');
  }
  return data as T;
}

async function resellerFetch<T>(payload: object): Promise<T> {
  const token = getStorageItem('idPirateAuthToken');
  if (!token) throw new Error('Reseller action requires authentication.');
  const response = await fetch('/api/reseller/payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Reseller payment API error');
  }
  return data as T;
}

export async function listCryptoMethods(): Promise<{ methods: CryptoMethodPublic[]; enabled?: boolean }> {
  return trackFetch({ requestType: 'list_crypto_methods' });
}

export async function createPaymentIntent(
  orderId: string,
  asset: string,
  options?: PaymentRequestOptions
): Promise<PaymentIntent> {
  return trackFetch({ requestType: 'create_payment_intent', orderId, asset }, options);
}

export async function getPaymentIntent(
  orderId: string,
  options?: PaymentRequestOptions
): Promise<{ intent: PaymentIntent | null }> {
  return trackFetch({ requestType: 'get_payment_intent', orderId }, options);
}

export async function cancelPaymentIntent(
  orderId: string,
  options?: PaymentRequestOptions
): Promise<{ message: string; intentId?: string }> {
  return trackFetch({ requestType: 'cancel_payment_intent', orderId }, options);
}

export async function resellerGetPaymentIntent(
  orderId: string
): Promise<{ intent: PaymentIntent | null }> {
  return resellerFetch({ orderId });
}

export async function adminGetPaymentSettings(): Promise<SitePaymentSettings> {
  return adminFetch({ requestType: 'get_payment_settings' });
}

export async function adminUpdatePaymentSettings(
  paymentGateways: SitePaymentSettings['paymentGateways'],
  paymentIntentTtlHours: number
): Promise<{ message: string; settings: SitePaymentSettings }> {
  return adminFetch({
    requestType: 'update_payment_settings',
    paymentGateways,
    paymentIntentTtlHours,
  });
}

export async function adminSetOrderPaymentExpiry(
  orderId: string,
  paymentExpiresAt: string | null
): Promise<{ message: string }> {
  return adminFetch({ requestType: 'set_order_payment_expiry', orderId, paymentExpiresAt });
}

export async function adminGetOrderPaymentIntent(
  orderId: string
): Promise<{ intent: PaymentIntent | null }> {
  return adminFetch({ requestType: 'get_order_payment_intent', orderId });
}

export async function adminCreateOrderPaymentIntent(
  orderId: string,
  asset: string
): Promise<PaymentIntent> {
  const data = await adminFetch<{ intent: PaymentIntent }>({
    requestType: 'admin_create_payment_intent',
    orderId,
    asset,
  });
  return data.intent;
}

export async function adminCancelOrderPaymentIntent(
  orderId: string
): Promise<{ message: string; intentId?: string }> {
  return adminFetch({ requestType: 'admin_cancel_payment_intent', orderId });
}

export async function adminGetPaymentActivitySummary(): Promise<PaymentActivitySummary> {
  return adminFetch({ requestType: 'get_payment_activity_summary' });
}

export async function adminListPaymentIntents(
  params: ListPaymentIntentsParams = {}
): Promise<ListPaymentIntentsResponse> {
  return adminFetch({
    requestType: 'list_payment_intents',
    status: params.status ?? 'all',
    asset: params.asset,
    search: params.search,
    limit: params.limit,
  });
}
