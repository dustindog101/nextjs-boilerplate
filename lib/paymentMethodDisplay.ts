import type { CryptoAssetId } from './paymentConstants';
import { CRYPTO_ASSET_MAP } from './paymentConstants';
import { parseCryptoAssetFromMethod } from './payments/orderHelpers';

export type PaymentLogoId =
  | 'apple_pay'
  | 'zelle'
  | 'venmo'
  | 'cash_app'
  | 'card'
  | 'crypto'
  | 'btc'
  | 'ltc'
  | 'sol'
  | 'usdc'
  | 'unknown';

const MANUAL_NAME_MAP: Record<string, PaymentLogoId> = {
  'apple pay': 'apple_pay',
  zelle: 'zelle',
  venmo: 'venmo',
  'cash app': 'cash_app',
  card: 'card',
  crypto: 'crypto',
  bitcoin: 'btc',
};

const CRYPTO_LOGO_MAP: Record<CryptoAssetId, PaymentLogoId> = {
  btc: 'btc',
  ltc: 'ltc',
  sol: 'sol',
  usdc_ethereum: 'usdc',
  usdc_solana: 'usdc',
  usdc_polygon: 'usdc',
  usdc_base: 'usdc',
};

/** Logo asset path under /public. Wordmarks use invert on dark UI. */
export const PAYMENT_LOGO_SRC: Record<Exclude<PaymentLogoId, 'unknown'>, string> = {
  apple_pay: '/payment-logos/apple-pay.svg',
  zelle: '/payment-logos/zelle.svg',
  venmo: '/payment-logos/venmo.svg',
  cash_app: '/payment-logos/cash-app.svg',
  card: '/payment-logos/card.svg',
  crypto: '/payment-logos/crypto.svg',
  btc: '/payment-logos/bitcoin.svg',
  ltc: '/payment-logos/litecoin.svg',
  sol: '/payment-logos/solana.svg',
  usdc: '/payment-logos/usdc.svg',
};

/** Brands with a clear wordmark — hide redundant text when showing logo. */
const LOGO_ONLY_BRANDS = new Set<PaymentLogoId>([
  'apple_pay',
  'zelle',
  'venmo',
  'cash_app',
]);

export function resolvePaymentLogoId(method?: string | null): PaymentLogoId {
  if (!method?.trim()) return 'unknown';

  const lower = method.trim().toLowerCase();

  const cryptoAsset = parseCryptoAssetFromMethod(method);
  if (cryptoAsset) return CRYPTO_LOGO_MAP[cryptoAsset];

  if (lower.startsWith('crypto')) return 'crypto';

  const manual = MANUAL_NAME_MAP[lower];
  if (manual) return manual;

  return 'unknown';
}

export function paymentLogoAccessibleName(
  method: string | null | undefined,
  logoId: PaymentLogoId
): string {
  if (!method?.trim()) return 'Payment method';

  const cryptoAsset = parseCryptoAssetFromMethod(method);
  if (cryptoAsset) {
    return CRYPTO_ASSET_MAP[cryptoAsset]?.label ?? method;
  }

  switch (logoId) {
    case 'apple_pay':
      return 'Apple Pay';
    case 'zelle':
      return 'Zelle';
    case 'venmo':
      return 'Venmo';
    case 'cash_app':
      return 'Cash App';
    case 'crypto':
      return 'Crypto';
    case 'card':
      return 'Card';
    default:
      return method.trim();
  }
}

/** Short label shown next to logo when text is still useful (e.g. USDC chain). */
export function paymentMethodCompanionLabel(method?: string | null): string | null {
  if (!method?.trim()) return null;

  const logoId = resolvePaymentLogoId(method);
  if (LOGO_ONLY_BRANDS.has(logoId)) return null;

  const cryptoAsset = parseCryptoAssetFromMethod(method);
  if (cryptoAsset) {
    const meta = CRYPTO_ASSET_MAP[cryptoAsset];
    return meta?.label ?? method.replace(/^Crypto:\s*/i, '').trim();
  }

  if (logoId === 'crypto') return 'Crypto';
  if (logoId === 'unknown') return method.trim();

  return null;
}

export function shouldShowPaymentLabel(method?: string | null): boolean {
  return paymentMethodCompanionLabel(method) !== null;
}

export function manualPaymentLogoId(name: string): PaymentLogoId {
  return MANUAL_NAME_MAP[name.toLowerCase()] ?? 'unknown';
}

export function cryptoAssetLogoId(assetId: CryptoAssetId): PaymentLogoId {
  return CRYPTO_LOGO_MAP[assetId];
}

/** Wordmark SVGs are dark — invert on the dark site chrome. */
export function paymentLogoNeedsInvert(logoId: PaymentLogoId): boolean {
  return logoId === 'apple_pay';
}
