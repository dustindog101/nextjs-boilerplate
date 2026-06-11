import type { CryptoAssetId } from './paymentConstants';

export interface PaymentGatewayConfig {
  enabled: boolean;
  address: string;
  minConfirmations: number;
}

export type PaymentGateways = Record<CryptoAssetId, PaymentGatewayConfig>;

export interface SitePaymentSettings {
  pk: 'site';
  paymentGateways: PaymentGateways;
  paymentIntentTtlHours: number;
  updatedAt?: string;
}

export type PaymentIntentStatus =
  | 'pending'
  | 'detected'
  | 'confirmed'
  | 'expired'
  | 'cancelled';

export interface PaymentIntent {
  intentId: string;
  orderId: string;
  userId: string;
  asset: CryptoAssetId;
  depositAddress: string;
  expectedAmount: string;
  expectedAtomic: string;
  uniqueSuffix: number;
  baseTotalUsd: number;
  exchangeRate: number | null;
  status: PaymentIntentStatus;
  txHash?: string | null;
  confirmations?: number;
  expiresAt: string;
  createdAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  assetLabel?: string;
  assetSymbol?: string;
}

export interface CryptoMethodPublic {
  id: CryptoAssetId;
  label: string;
  icon: string;
  symbol: string;
}

/** Payment rail — crypto live; zelle/cashapp reserved for self-hosted rails. */
export type PaymentRail = 'crypto' | 'zelle' | 'cashapp';

export interface PaymentActivitySummary {
  active: number;
  pending: number;
  detected: number;
  confirmed: number;
  confirmedLast7Days: number;
  expired: number;
  cancelled: number;
  enabledCryptoAssets: number;
}

export interface AdminPaymentIntentOrder {
  orderId: string;
  userId?: string;
  source?: string;
  resellerId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  status?: string;
  orderTotal?: number;
  createdAt?: string;
}

export interface AdminPaymentIntentRow extends PaymentIntent {
  rail?: PaymentRail;
  order?: AdminPaymentIntentOrder | null;
}

export interface ListPaymentIntentsParams {
  status?: 'all' | 'active' | PaymentIntentStatus;
  asset?: string;
  search?: string;
  limit?: number;
}

export interface ListPaymentIntentsResponse {
  intents: AdminPaymentIntentRow[];
  count: number;
}
