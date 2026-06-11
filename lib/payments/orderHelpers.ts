import { CRYPTO_ASSETS, CRYPTO_ASSET_MAP } from '../paymentConstants';
import type { CryptoAssetId } from '../paymentConstants';
import type { OrderDetails } from '../types';

type OrderPaymentFields = Pick<
  OrderDetails,
  'paymentMethod' | 'paymentStatus' | 'cryptoAsset' | 'paymentIntentId'
>;

export function normalizePaymentStatus(
  status?: string | null
): 'Paid' | 'Unpaid' {
  if (!status) return 'Unpaid';
  return status.toLowerCase() === 'paid' ? 'Paid' : 'Unpaid';
}

export function isOrderUnpaid(order: OrderPaymentFields): boolean {
  return normalizePaymentStatus(order.paymentStatus) === 'Unpaid';
}

/** Parse crypto asset from stored paymentMethod strings (many legacy formats). */
export function parseCryptoAssetFromMethod(
  method?: string | null
): CryptoAssetId | null {
  if (!method) return null;

  const trimmed = method.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'crypto') return null;

  const withoutPrefix = trimmed.replace(/^crypto:\s*/i, '').trim();
  const bodyLower = withoutPrefix.toLowerCase();

  if (withoutPrefix in CRYPTO_ASSET_MAP) {
    return withoutPrefix as CryptoAssetId;
  }

  const exactLabel = CRYPTO_ASSETS.find(
    (a) => bodyLower === a.label.toLowerCase() || lower === a.label.toLowerCase()
  );
  if (exactLabel) return exactLabel.id;

  const exactSymbol = CRYPTO_ASSETS.find(
    (a) => bodyLower === a.symbol.toLowerCase() || lower === a.symbol.toLowerCase()
  );
  if (exactSymbol) return exactSymbol.id;

  if (/bitcoin|\bbtc\b/i.test(withoutPrefix) || /\bbtc\b/i.test(trimmed)) {
    return 'btc';
  }
  if (/litecoin|\bltc\b/i.test(withoutPrefix)) return 'ltc';
  if (/solana|\bsol\b/i.test(withoutPrefix) && !/usdc/i.test(withoutPrefix)) {
    return 'sol';
  }
  if (/usdc/i.test(withoutPrefix) || /usdc/i.test(trimmed)) {
    if (/ethereum|eth/i.test(withoutPrefix)) return 'usdc_ethereum';
    if (/polygon/i.test(withoutPrefix)) return 'usdc_polygon';
    if (/base/i.test(withoutPrefix)) return 'usdc_base';
    if (/solana|sol/i.test(withoutPrefix)) return 'usdc_solana';
    return 'usdc_ethereum';
  }

  const partialLabel = CRYPTO_ASSETS.find((a) =>
    bodyLower.includes(a.label.toLowerCase())
  );
  if (partialLabel) return partialLabel.id;

  return null;
}

export function isCryptoOrder(order: OrderPaymentFields): boolean {
  return !!(
    order.cryptoAsset ||
    order.paymentIntentId ||
    parseCryptoAssetFromMethod(order.paymentMethod) !== null ||
    order.paymentMethod?.toLowerCase().startsWith('crypto')
  );
}

export function cryptoAssetFromOrder(order: OrderPaymentFields): CryptoAssetId | null {
  if (order.cryptoAsset && order.cryptoAsset in CRYPTO_ASSET_MAP) {
    return order.cryptoAsset as CryptoAssetId;
  }
  return parseCryptoAssetFromMethod(order.paymentMethod);
}

export function showPayButton(order: OrderPaymentFields): boolean {
  return isCryptoOrder(order) && isOrderUnpaid(order);
}

/** Unpaid orders can open payment UI (crypto modal or order view). */
export function showPaymentAction(order: OrderPaymentFields): boolean {
  return isOrderUnpaid(order);
}
