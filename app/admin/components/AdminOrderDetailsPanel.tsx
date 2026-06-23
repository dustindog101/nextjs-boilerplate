"use client";

import React, { useCallback } from 'react';
import { OrderR2ImageStrip } from '../../components/order/OrderR2ImageStrip';
import { PaymentMethodBadge } from '@/app/components/payments/PaymentMethodBadge';
import { adminPresignGetUrl } from '@/lib/apiClient';
import { effectivePerIdPrice } from '@/lib/pricing';

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  const display = value === undefined || value === null || value === '' ? '—' : String(value);
  return (
    <div>
      <span className="text-label block mb-0.5">{label}</span>
      <p
        className={`text-sm break-words ${mono ? 'font-mono text-xs' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {display}
      </p>
    </div>
  );
}

function formatPersonName(row: Record<string, unknown>): string {
  const parts = [row.firstName, row.middleName, row.lastName].filter(
    (p) => typeof p === 'string' && p.trim()
  );
  return parts.length > 0 ? parts.join(' ') : '—';
}

function formatDateField(row: Record<string, unknown>, kind: 'dob' | 'issue'): string {
  const combined = kind === 'dob' ? row.dob : row.issueDate;
  if (typeof combined === 'string' && combined.trim()) {
    return combined;
  }
  const month = row[`${kind === 'dob' ? 'dob' : 'issue'}Month`];
  const day = row[`${kind === 'dob' ? 'dob' : 'issue'}Day`];
  const year = row[`${kind === 'dob' ? 'dob' : 'issue'}Year`];
  if (month && day && year) {
    return `${month}/${day}/${year}`;
  }
  return '—';
}

function formatHeight(row: Record<string, unknown>): string {
  const ft = row.heightFeet;
  const inch = row.heightInches;
  if (ft && inch) return `${ft}'${inch}"`;
  if (ft) return `${ft} ft`;
  return '—';
}

function idLinePrice(state: unknown, order: Record<string, unknown>, index: number): string {
  if (typeof state !== 'string' || !state) return '—';
  const price = order.price as { perIdEffective?: number; pricingMode?: string; idCount?: number } | undefined;
  if (price?.perIdEffective != null) {
    return `$${Number(price.perIdEffective).toFixed(2)}`;
  }
  const ids = (order.ids as unknown[] | undefined) ?? [];
  const idCount = price?.idCount ?? ids.length;
  const mode = price?.pricingMode === 'reseller_wholesale' ? 'reseller_wholesale' : 'retail';
  if (idCount > 0) {
    return `$${effectivePerIdPrice(state, idCount, mode as 'retail' | 'reseller_wholesale').toFixed(2)}`;
  }
  return '—';
}

interface AdminOrderDetailsPanelProps {
  order: Record<string, unknown>;
}

export function AdminOrderDetailsPanel({ order }: AdminOrderDetailsPanelProps) {
  const resolveAssetUrl = useCallback((key: string) => adminPresignGetUrl(key), []);

  const price = order.price as {
    subtotal?: number;
    total?: number;
    discountAmount?: number;
    listSubtotal?: number;
    volumeSavings?: number;
    pricingMode?: string;
    perIdEffective?: number;
    idCount?: number;
    handling?: number;
    shipping?: number;
  } | undefined;
  const ids = (order.ids as Record<string, unknown>[] | undefined) ?? [];
  const createdAt = order.createdAt as string | undefined;
  const updatedAt = order.updatedAt as string | undefined;

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-4 grid sm:grid-cols-2 gap-4"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
      >
        <DetailField label="Order ID" value={String(order.orderId ?? '')} mono />
        <DetailField label="Customer / user ID" value={String(order.userId ?? '')} mono />
        <DetailField
          label="Placed"
          value={createdAt ? new Date(createdAt).toLocaleString() : undefined}
        />
        <DetailField
          label="Last updated"
          value={updatedAt ? new Date(updatedAt).toLocaleString() : undefined}
        />
        <DetailField label="Fulfillment status" value={String(order.status ?? 'pending')} />
        <DetailField label="Payment status" value={String(order.paymentStatus ?? 'Unpaid')} />
        <div>
          <span className="text-label block mb-0.5">Payment method</span>
          {order.paymentMethod ? (
            <PaymentMethodBadge method={String(order.paymentMethod)} size="xs" showLabel="auto" />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>—</p>
          )}
        </div>
        <DetailField label="Shipping" value={String(order.shipping ?? '')} />
        {order.discountCode ? (
          <DetailField label="Discount code" value={String(order.discountCode)} />
        ) : null}
        {order.resellerId ? (
          <DetailField label="Reseller" value={String(order.resellerId)} />
        ) : null}
        {order.source ? (
          <DetailField label="Source" value={String(order.source)} />
        ) : null}
        {order.trackingNumber ? (
          <DetailField label="Tracking #" value={String(order.trackingNumber)} />
        ) : null}
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
      >
        <p className="text-label mb-3">Pricing</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {price?.listSubtotal != null && price.volumeSavings != null && Number(price.volumeSavings) > 0 ? (
            <DetailField label="List subtotal" value={`$${Number(price.listSubtotal).toFixed(2)}`} />
          ) : null}
          <DetailField
            label="ID subtotal"
            value={price?.subtotal != null ? `$${Number(price.subtotal).toFixed(2)}` : undefined}
          />
          {price?.volumeSavings != null && Number(price.volumeSavings) > 0 ? (
            <DetailField label="Volume savings" value={`−$${Number(price.volumeSavings).toFixed(2)}`} />
          ) : null}
          {price?.pricingMode ? (
            <DetailField
              label="Pricing mode"
              value={price.pricingMode === 'reseller_wholesale' ? 'Reseller wholesale' : 'Retail volume'}
            />
          ) : null}
          {price?.perIdEffective != null ? (
            <DetailField label="Effective $/ID" value={`$${Number(price.perIdEffective).toFixed(2)}`} />
          ) : null}
          {price?.discountAmount != null && Number(price.discountAmount) > 0 ? (
            <DetailField label="Discount" value={`-$${Number(price.discountAmount).toFixed(2)}`} />
          ) : null}
          <DetailField
            label="Order total"
            value={price?.total != null ? `$${Number(price.total).toFixed(2)}` : undefined}
          />
          <DetailField label="ID count" value={ids.length || Number(order.numberOfIds ?? 0)} />
        </div>
      </div>

      {order.notes ? (
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
        >
          <p className="text-label mb-2">Customer notes</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {String(order.notes)}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        <p className="text-label">ID line items ({ids.length})</p>
        {ids.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No ID details on this order.
          </p>
        ) : (
          ids.map((idRow, idx) => (
            <div
              key={idx}
              className="rounded-xl p-4 space-y-4"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ID #{idx + 1} · {formatPersonName(idRow)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {typeof idRow.state === 'string' ? idRow.state : '—'} ·{' '}
                    <span className="text-price">{idLinePrice(idRow.state, order, idx)}</span>
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailField label="State" value={String(idRow.state ?? '')} />
                <DetailField label="Full name" value={formatPersonName(idRow)} />
                <DetailField label="Date of birth" value={formatDateField(idRow, 'dob')} />
                <DetailField label="Issue date" value={formatDateField(idRow, 'issue')} />
                <DetailField label="Street" value={String(idRow.streetAddress ?? '')} />
                <DetailField label="City" value={String(idRow.city ?? '')} />
                <DetailField label="ZIP" value={String(idRow.zipCode ?? '')} />
                <DetailField label="ZIP+4" value={String(idRow.zipPlus4 ?? '')} />
                <DetailField label="Sex" value={String(idRow.sex ?? '')} />
                <DetailField label="Height" value={formatHeight(idRow)} />
                <DetailField label="Weight (lbs)" value={String(idRow.weight ?? '')} />
                <DetailField label="Eye color" value={String(idRow.eyeColor ?? '')} />
                <DetailField label="Hair color" value={String(idRow.hairColor ?? '')} />
              </div>

              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-label mb-2">Photo &amp; signature</p>
                <OrderR2ImageStrip
                  slots={[
                    {
                      label: 'Photo',
                      objectKey: typeof idRow.photoKey === 'string' ? idRow.photoKey : undefined,
                    },
                    {
                      label: 'Signature',
                      objectKey: typeof idRow.signatureKey === 'string' ? idRow.signatureKey : undefined,
                    },
                  ]}
                  resolveUrl={resolveAssetUrl}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
