"use client";

import React from 'react';
import Link from 'next/link';
import { CalendarIcon, DollarSignIcon, HashIcon } from '../icons';
import type { OrderDetails } from '@/lib/types';
import { isCryptoOrder, normalizePaymentStatus } from '@/lib/payments/orderHelpers';
import { PaymentMethodBadge } from '../payments/PaymentMethodBadge';
import { OrderCustomerNoticeBanner } from './OrderCustomerNoticeBanner';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Order Created', color: 'text-amber-400', dot: 'bg-amber-500' },
  processing: { label: 'Processing', color: 'text-blue-400', dot: 'bg-blue-500' },
  shipped: { label: 'Shipped', color: 'text-sky-400', dot: 'bg-sky-500' },
  delivered: { label: 'Delivered', color: 'text-emerald-400', dot: 'bg-emerald-500' },
};

const paymentStatusConfig = {
  Paid: { label: 'Paid', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  Unpaid: { label: 'Unpaid', color: 'text-amber-400', dot: 'bg-amber-500' },
};

export interface OrderListCardProps {
  order: OrderDetails;
  index?: number;
  viewHref: string;
}

function paymentSubtitle(order: OrderDetails): React.ReactNode | null {
  const paid = normalizePaymentStatus(order.paymentStatus) === 'Paid';
  if (paid && order.paymentMethod) {
    return <PaymentMethodBadge method={order.paymentMethod} size="xs" showLabel="auto" />;
  }
  if (isCryptoOrder(order)) {
    if (order.paymentMethod) {
      return <PaymentMethodBadge method={order.paymentMethod} size="xs" showLabel="auto" />;
    }
    return 'Crypto · unpaid';
  }
  if (order.paymentMethod) {
    return <PaymentMethodBadge method={order.paymentMethod} size="xs" showLabel="auto" />;
  }
  return 'Payment pending';
}

export function OrderListCard({ order, index = 0, viewHref }: OrderListCardProps) {
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const paymentKey = normalizePaymentStatus(order.paymentStatus);
  const payCfg = paymentStatusConfig[paymentKey];
  const subtitle = paymentSubtitle(order);
  const customerNotice = order.customerNotice?.trim();

  return (
    <div
      className="glass p-5 flex h-full flex-col hover:border-[var(--accent)]/30 transition-all animate-fade-up"
      style={{ animationDelay: `${50 * (index + 1)}ms` }}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 min-w-0">
            <HashIcon className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
            <span className="truncate">#{order.orderId.substring(0, 8)}…</span>
          </h3>
          <span className={`flex items-center gap-1.5 text-xs font-medium shrink-0 text-right ${cfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-xs">
          <span className={`flex items-center gap-1.5 font-medium ${payCfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${payCfg.dot}`} />
            {payCfg.label}
          </span>
          {subtitle && (
            <>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span className="text-[var(--text-secondary)]">{subtitle}</span>
            </>
          )}
        </div>

        {customerNotice ? (
          <div className="mb-3">
            <OrderCustomerNoticeBanner message={customerNotice} variant="compact" />
          </div>
        ) : null}

        <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
          <p className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p>
            {order.numberOfIds ?? order.ids?.length ?? 0} ID
            {(order.numberOfIds ?? order.ids?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-price font-bold flex items-center gap-1 shrink-0">
          <DollarSignIcon className="h-3.5 w-3.5" />
          ${order.price?.total ? order.price.total.toFixed(2) : 'N/A'}
        </span>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <Link href={viewHref} className="btn btn-outline text-xs px-3 py-1.5 w-full sm:w-auto">
            View order
          </Link>
        </div>
      </div>
    </div>
  );
}
