"use client";

import React from 'react';
import { InfoIcon } from '../icons';

export interface OrderCustomerNoticeBannerProps {
  message: string;
  /** Compact strip for order list cards */
  variant?: 'banner' | 'compact';
  className?: string;
}

export function OrderCustomerNoticeBanner({
  message,
  variant = 'banner',
  className = '',
}: OrderCustomerNoticeBannerProps) {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-start gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 ${className}`}
        role="status"
      >
        <InfoIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">{trimmed}</p>
      </div>
    );
  }

  return (
    <article
      className={`glass p-5 sm:p-6 border border-indigo-500/25 bg-indigo-500/[0.08] animate-fade-up ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
          <InfoIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              Update from ID Pirate
            </span>
          </div>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{trimmed}</p>
        </div>
      </div>
    </article>
  );
}
