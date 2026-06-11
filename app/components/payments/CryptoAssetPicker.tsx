"use client";

import React from 'react';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import type { CryptoMethodPublic } from '@/lib/paymentTypes';

interface CryptoAssetPickerProps {
  methods: CryptoMethodPublic[];
  selected: CryptoAssetId | null;
  onSelect: (id: CryptoAssetId) => void;
  disabled?: boolean;
}

export function CryptoAssetPicker({
  methods,
  selected,
  onSelect,
  disabled = false,
}: CryptoAssetPickerProps) {
  if (methods.length === 0) {
    return (
      <p className="text-sm text-[var(--text-tertiary)]">No crypto payment methods available.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {methods.map((method) => {
        const isSelected = selected === method.id;
        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(method.id)}
            className={`flex items-center gap-3 p-3.5 sm:p-3 min-h-[52px] rounded-xl border text-left transition-all active:scale-[0.99] ${
              isSelected
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-white/[0.02]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.06] border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] shrink-0">
              {method.icon}
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{method.label}</span>
          </button>
        );
      })}
    </div>
  );
}
