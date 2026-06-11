/** Crypto payment gateway — asset metadata (mirrors Lambda payment_shared/config.py). */

export type CryptoAssetId =
  | 'btc'
  | 'ltc'
  | 'sol'
  | 'usdc_ethereum'
  | 'usdc_solana'
  | 'usdc_polygon'
  | 'usdc_base';

export interface CryptoAssetMeta {
  id: CryptoAssetId;
  label: string;
  symbol: string;
  icon: string;
  decimals: number;
  coingeckoId: string;
}

export const CRYPTO_ASSETS: CryptoAssetMeta[] = [
  { id: 'btc', label: 'Bitcoin', symbol: 'BTC', icon: '₿', decimals: 8, coingeckoId: 'bitcoin' },
  { id: 'ltc', label: 'Litecoin', symbol: 'LTC', icon: 'Ł', decimals: 8, coingeckoId: 'litecoin' },
  { id: 'sol', label: 'Solana', symbol: 'SOL', icon: '◎', decimals: 9, coingeckoId: 'solana' },
  { id: 'usdc_ethereum', label: 'USDC (Ethereum)', symbol: 'USDC', icon: '$', decimals: 6, coingeckoId: 'usd-coin' },
  { id: 'usdc_polygon', label: 'USDC (Polygon)', symbol: 'USDC', icon: '$', decimals: 6, coingeckoId: 'usd-coin' },
  { id: 'usdc_base', label: 'USDC (Base)', symbol: 'USDC', icon: '$', decimals: 6, coingeckoId: 'usd-coin' },
  { id: 'usdc_solana', label: 'USDC (Solana)', symbol: 'USDC', icon: '$', decimals: 6, coingeckoId: 'usd-coin' },
];

export const CRYPTO_ASSET_MAP = Object.fromEntries(
  CRYPTO_ASSETS.map((a) => [a.id, a])
) as Record<CryptoAssetId, CryptoAssetMeta>;

export const DEFAULT_PAYMENT_INTENT_TTL_HOURS = 48;

export const MANUAL_PAYMENT_METHODS = [
  { name: 'Zelle', icon: 'Z' },
  { name: 'Apple Pay', icon: '' },
  { name: 'Cash App', icon: '$' },
  { name: 'Venmo', icon: 'V' },
] as const;

export function cryptoPaymentMethodLabel(assetId: CryptoAssetId): string {
  const meta = CRYPTO_ASSET_MAP[assetId];
  return meta ? `Crypto: ${meta.label}` : `Crypto: ${assetId}`;
}
