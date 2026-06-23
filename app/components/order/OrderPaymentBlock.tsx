"use client";

import React from 'react';
import type { OrderDetails } from '@/lib/types';
import {
  isCryptoOrder,
  isOrderUnpaid,
  normalizePaymentStatus,
} from '@/lib/payments/orderHelpers';
import { PaymentMethodBadge } from '../payments/PaymentMethodBadge';

interface OrderPaymentBlockProps {
  order: OrderDetails;
  onOpenPayment?: () => void;
  /** Shorter label on list cards; descriptive on order view */
  paymentActionLabel?: string;
}

export function OrderPaymentBlock({
  order,
  onOpenPayment,
  paymentActionLabel = 'View payment',
}: OrderPaymentBlockProps) {
  const isPaid = normalizePaymentStatus(order.paymentStatus) === 'Paid';
  const canManageCrypto = isOrderUnpaid(order) && isCryptoOrder(order);
  const crypto = isCryptoOrder(order);

  return (
    <div className="glass p-5 sm:p-6 animate-fade-up delay-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-label">Payment</p>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isPaid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {normalizePaymentStatus(order.paymentStatus)}
            </span>
            {order.paymentMethod && (
              <span className="inline-flex items-center">
                <span className="text-[var(--text-tertiary)] mr-1.5">·</span>
                <PaymentMethodBadge method={order.paymentMethod} size="sm" showLabel="auto" />
              </span>
            )}
          </div>
          {canManageCrypto && (
            <p className="text-sm text-[var(--text-secondary)]">
              Open payment to pay, change crypto asset, or cancel your invoice.
            </p>
          )}
          {isOrderUnpaid(order) && !canManageCrypto && !crypto && (
            <p className="text-sm text-[var(--text-secondary)]">
              Payment pending — follow the instructions from checkout.
            </p>
          )}
          {order.paymentExpiresAt && canManageCrypto && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Invoice expires {new Date(order.paymentExpiresAt).toLocaleString()}
            </p>
          )}
          {order.cryptoTxHash && isPaid && (
            <p className="text-xs font-mono text-[var(--text-tertiary)] mt-2 break-all">
              Tx: {order.cryptoTxHash}
            </p>
          )}
        </div>

        {canManageCrypto && onOpenPayment && (
          <button
            type="button"
            onClick={onOpenPayment}
            className="btn btn-primary shrink-0 px-6 py-2.5 text-sm w-full sm:w-auto"
          >
            {paymentActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
