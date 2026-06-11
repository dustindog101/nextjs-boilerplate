"use client";

import React from 'react';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import type { CryptoMethodPublic } from '@/lib/paymentTypes';
import { CRYPTO_PAYMENT_PARENT_ID } from '@/lib/payments';

interface CryptoPaymentSectionProps {
  methods: CryptoMethodPublic[];
  isActive: boolean;
  expanded: boolean;
  selectedAsset: CryptoAssetId | null;
  onSelectParent: () => void;
  onSelectAsset: (id: CryptoAssetId) => void;
}

/**
 * Isolated crypto payment picker — only rendered when methods.length > 0.
 */
export function CryptoPaymentSection({
  methods,
  isActive,
  expanded,
  selectedAsset,
  onSelectParent,
  onSelectAsset,
}: CryptoPaymentSectionProps) {
  if (methods.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={onSelectParent}
        className={`w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
          isActive
            ? 'border-[var(--accent)] bg-[var(--accent)]/10'
            : 'border-[var(--border)] hover:border-[var(--border-hover)]'
        }`}
      >
        <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/[0.06] border border-[var(--border)] mr-3 text-sm font-bold text-[var(--text-secondary)]">
          ₿
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)]">Crypto</span>
      </button>
      {isActive && expanded && (
        <div className="ml-2 pl-3 border-l border-[var(--border)] space-y-2 animate-fade-up">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectAsset(method.id)}
              className={`w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                selectedAsset === method.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}
            >
              <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/[0.06] border border-[var(--border)] mr-3 text-sm font-bold text-[var(--text-secondary)]">
                {method.icon}
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{method.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export { CRYPTO_PAYMENT_PARENT_ID };
