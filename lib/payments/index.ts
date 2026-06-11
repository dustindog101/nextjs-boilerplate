/**
 * Crypto payment gateway — public module boundary.
 * Import from `@/lib/payments` for checkout crypto flows or admin payment settings.
 */

export * from './api';
export * from './paySession';
export * from './orderHelpers';
export * from './intentStatus';
export { CRYPTO_ASSETS, MANUAL_PAYMENT_METHODS, cryptoPaymentMethodLabel, DEFAULT_PAYMENT_INTENT_TTL_HOURS } from '../paymentConstants';
export type { CryptoAssetId } from '../paymentConstants';
export type {
  PaymentIntent,
  PaymentGateways,
  SitePaymentSettings,
  CryptoMethodPublic,
  PaymentRail,
  PaymentActivitySummary,
  AdminPaymentIntentRow,
  AdminPaymentIntentOrder,
  ListPaymentIntentsParams,
  ListPaymentIntentsResponse,
} from '../paymentTypes';
export { PAYMENT_RAILS, PAYMENT_RAIL_MAP } from './rails';
export type { PaymentRailMeta, RailAvailability } from './rails';
export { orderOriginLabel } from './originLabel';

/** Checkout-only: parent payment option id for the Crypto accordion. */
export const CRYPTO_PAYMENT_PARENT_ID = '__crypto__';
