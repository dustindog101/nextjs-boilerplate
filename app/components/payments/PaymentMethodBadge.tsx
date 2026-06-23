'use client';

import React from 'react';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import {
  paymentMethodCompanionLabel,
  type PaymentLogoId,
} from '@/lib/paymentMethodDisplay';
import { PaymentMethodLogo, type PaymentLogoSize } from './PaymentMethodLogo';

export interface PaymentMethodBadgeProps {
  method?: string | null;
  logoId?: PaymentLogoId;
  assetId?: CryptoAssetId;
  manualMethod?: string;
  size?: PaymentLogoSize;
  /** auto hides text for wordmark brands (Apple Pay, Zelle, etc.) */
  showLabel?: boolean | 'auto';
  className?: string;
  labelClassName?: string;
  fallback?: string;
}

export function PaymentMethodBadge({
  method,
  logoId,
  assetId,
  manualMethod,
  size = 'sm',
  showLabel = 'auto',
  className = '',
  labelClassName = '',
  fallback = 'N/A',
}: PaymentMethodBadgeProps) {
  const displayMethod = method ?? manualMethod;
  const companion =
    showLabel === false
      ? null
      : showLabel === true
        ? displayMethod?.trim() || fallback
        : paymentMethodCompanionLabel(displayMethod);

  const showCompanion =
    showLabel === true
      ? !!displayMethod?.trim()
      : showLabel === 'auto'
        ? companion !== null
        : false;

  if (!displayMethod?.trim() && !logoId && !assetId) {
    return <span className={`text-sm text-[var(--text-tertiary)] ${labelClassName}`}>{fallback}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <PaymentMethodLogo
        method={method}
        logoId={logoId}
        assetId={assetId}
        manualMethod={manualMethod}
        size={size}
      />
      {showCompanion && (
        <span className={`text-sm font-medium text-[var(--text-primary)] truncate ${labelClassName}`}>
          {showLabel === true ? displayMethod : companion}
        </span>
      )}
    </span>
  );
}
