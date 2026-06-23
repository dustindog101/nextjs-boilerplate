'use client';

import React from 'react';
import Image from 'next/image';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import {
  cryptoAssetLogoId,
  manualPaymentLogoId,
  PAYMENT_LOGO_SRC,
  paymentLogoAccessibleName,
  paymentLogoNeedsInvert,
  resolvePaymentLogoId,
  type PaymentLogoId,
} from '@/lib/paymentMethodDisplay';

const SIZE_CLASS = {
  xs: 'h-4',
  sm: 'h-5',
  md: 'h-7',
  lg: 'h-8',
} as const;

const SIZE_PX = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 32,
} as const;

export type PaymentLogoSize = keyof typeof SIZE_CLASS;

export interface PaymentMethodLogoProps {
  /** Stored order/checkout payment method string */
  method?: string | null;
  /** Direct logo id (checkout pickers) */
  logoId?: PaymentLogoId;
  /** Crypto asset id (checkout crypto picker) */
  assetId?: CryptoAssetId;
  /** Manual method name e.g. "Apple Pay" */
  manualMethod?: string;
  size?: PaymentLogoSize;
  className?: string;
}

function effectiveLogoId({
  method,
  logoId,
  assetId,
  manualMethod,
}: PaymentMethodLogoProps): PaymentLogoId {
  if (logoId) return logoId;
  if (assetId) return cryptoAssetLogoId(assetId);
  if (manualMethod) return manualPaymentLogoId(manualMethod);
  return resolvePaymentLogoId(method);
}

export function PaymentMethodLogo({
  method,
  logoId,
  assetId,
  manualMethod,
  size = 'sm',
  className = '',
}: PaymentMethodLogoProps) {
  const id = effectiveLogoId({ method, logoId, assetId, manualMethod });

  if (id === 'unknown') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md bg-white/[0.06] border border-[var(--border)] px-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] ${SIZE_CLASS[size]} ${className}`}
        title={method ?? 'Payment method'}
      >
        ?
      </span>
    );
  }

  const src = PAYMENT_LOGO_SRC[id];
  const alt = paymentLogoAccessibleName(method ?? manualMethod, id);
  const invert = paymentLogoNeedsInvert(id);
  const px = SIZE_PX[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title={alt}
    >
      <Image
        src={src}
        alt={alt}
        width={px * 2}
        height={px}
        className={`${SIZE_CLASS[size]} w-auto object-contain ${invert ? 'brightness-0 invert' : ''}`}
        unoptimized
      />
    </span>
  );
}
