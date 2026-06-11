"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Copy, Wallet, AlertTriangle } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { CryptoAssetPicker } from '../../components/payments/CryptoAssetPicker';
import { useCryptoPaymentMethods } from '../../hooks/useCryptoPaymentMethods';
import {
  adminCancelOrderPaymentIntent,
  adminCreateOrderPaymentIntent,
  adminGetOrderPaymentIntent,
  adminGetPaymentSettings,
  adminSetOrderPaymentExpiry,
} from '@/lib/payments';
import {
  CRYPTO_ASSETS,
  cryptoPaymentMethodLabel,
  MANUAL_PAYMENT_METHODS,
} from '@/lib/paymentConstants';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import type { PaymentGateways, PaymentIntent } from '@/lib/paymentTypes';
import { cryptoAssetFromOrder } from '@/lib/payments/orderHelpers';
import { effectiveIntentStatus, intentStatusLabel } from '@/lib/payments/intentStatus';
import { toDatetimeLocalInputValue } from '@/lib/datetimeLocal';

const paymentStatusOptions = ['Unpaid', 'Partial', 'Paid'] as const;

const fieldStyle = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

function defaultGateways(): PaymentGateways {
  return Object.fromEntries(
    CRYPTO_ASSETS.map((a) => [
      a.id,
      { enabled: false, address: '', minConfirmations: a.id.startsWith('usdc') ? 12 : 1 },
    ])
  ) as PaymentGateways;
}

function isCryptoGatewayEnabled(gateways: PaymentGateways, assetId: CryptoAssetId): boolean {
  const gw = gateways[assetId];
  return Boolean(gw?.enabled && gw.address?.trim());
}

export interface AdminOrderPaymentFields {
  paymentStatus: string;
  paymentMethod: string;
  cryptoTxHash: string;
  paymentExpiresAt: string;
}

interface AdminOrderPaymentPanelProps {
  order: Record<string, unknown>;
  fields: AdminOrderPaymentFields;
  onChange: (patch: Partial<AdminOrderPaymentFields>) => void;
  onInvoiceChange?: () => void;
}

function intentStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return '#10B981';
    case 'detected':
      return '#3B82F6';
    case 'expired':
      return '#EF4444';
    case 'cancelled':
      return '#F59E0B';
    default:
      return 'var(--text-secondary)';
  }
}

export function AdminOrderPaymentPanel({
  order,
  fields,
  onChange,
  onInvoiceChange,
}: AdminOrderPaymentPanelProps) {
  const orderId = String(order.orderId ?? '');
  const orderTotal = (order.price as { total?: number } | undefined)?.total;
  const { methods } = useCryptoPaymentMethods();
  const [gateways, setGateways] = useState<PaymentGateways>(defaultGateways);

  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [intentLoading, setIntentLoading] = useState(true);
  const [invoiceAsset, setInvoiceAsset] = useState<CryptoAssetId | null>(
    cryptoAssetFromOrder(order as Parameters<typeof cryptoAssetFromOrder>[0])
  );
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'amount' | 'address' | null>(null);

  const loadIntent = useCallback(async () => {
    if (!orderId) return;
    setIntentLoading(true);
    setInvoiceError(null);
    try {
      const data = await adminGetOrderPaymentIntent(orderId);
      setIntent(data.intent);
      if (data.intent?.asset) {
        setInvoiceAsset(data.intent.asset);
      }
    } catch (e: unknown) {
      setIntent(null);
      setInvoiceError(e instanceof Error ? e.message : 'Could not load invoice');
    } finally {
      setIntentLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadIntent();
  }, [loadIntent]);

  useEffect(() => {
    let cancelled = false;
    adminGetPaymentSettings()
      .then((data) => {
        if (cancelled || !data.paymentGateways) return;
        const merged = defaultGateways();
        for (const a of CRYPTO_ASSETS) {
          if (data.paymentGateways[a.id]) {
            merged[a.id] = { ...merged[a.id], ...data.paymentGateways[a.id] };
          }
        }
        setGateways(merged);
      })
      .catch(() => {
        if (!cancelled) setGateways(defaultGateways());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (fields.paymentExpiresAt) return;
    const orderExpiry = order.paymentExpiresAt as string | undefined;
    if (orderExpiry) {
      onChange({ paymentExpiresAt: toDatetimeLocalInputValue(orderExpiry) });
      return;
    }
    if (intent?.expiresAt) {
      onChange({ paymentExpiresAt: toDatetimeLocalInputValue(intent.expiresAt) });
    }
  }, [fields.paymentExpiresAt, intent?.expiresAt, order.paymentExpiresAt, onChange]);

  const handleAssetSelect = (asset: CryptoAssetId) => {
    setInvoiceAsset(asset);
    onChange({ paymentMethod: cryptoPaymentMethodLabel(asset) });
  };

  const copyText = async (text: string, field: 'amount' | 'address') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceAsset) {
      setInvoiceError('Select a crypto asset first.');
      return;
    }
    setInvoiceBusy(true);
    setInvoiceMsg(null);
    setInvoiceError(null);
    try {
      const created = await adminCreateOrderPaymentIntent(orderId, invoiceAsset);
      setIntent(created);
      onChange({
        paymentMethod: cryptoPaymentMethodLabel(invoiceAsset),
        paymentExpiresAt: toDatetimeLocalInputValue(created.expiresAt),
      });
      setInvoiceMsg('Invoice created. Customer can pay from their order or track link.');
      onInvoiceChange?.();
    } catch (e: unknown) {
      setInvoiceError(e instanceof Error ? e.message : 'Failed to create invoice');
    } finally {
      setInvoiceBusy(false);
    }
  };

  const handleCancelInvoice = async () => {
    setInvoiceBusy(true);
    setInvoiceMsg(null);
    setInvoiceError(null);
    try {
      await adminCancelOrderPaymentIntent(orderId);
      setIntent(null);
      setInvoiceMsg('Invoice cancelled.');
      onInvoiceChange?.();
    } catch (e: unknown) {
      setInvoiceError(e instanceof Error ? e.message : 'Failed to cancel invoice');
    } finally {
      setInvoiceBusy(false);
    }
  };

  const handleSaveExpiryOnly = async () => {
    setInvoiceBusy(true);
    setInvoiceMsg(null);
    setInvoiceError(null);
    try {
      await adminSetOrderPaymentExpiry(
        orderId,
        fields.paymentExpiresAt ? new Date(fields.paymentExpiresAt).toISOString() : null
      );
      setInvoiceMsg('Invoice expiry saved.');
      onInvoiceChange?.();
    } catch (e: unknown) {
      setInvoiceError(e instanceof Error ? e.message : 'Failed to save expiry');
    } finally {
      setInvoiceBusy(false);
    }
  };

  const resolvedStatus = intent ? effectiveIntentStatus(intent) : null;
  const activeIntent = intent && ['pending', 'detected'].includes(resolvedStatus ?? '');
  const expiredOrCancelled =
    intent && (resolvedStatus === 'expired' || resolvedStatus === 'cancelled');

  const pickerMethods = methods;

  const showPaidWithOpenInvoiceWarning =
    fields.paymentStatus === 'Paid' && !!activeIntent;

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Wallet size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Payment &amp; invoice
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Order total{' '}
              <span className="text-price font-semibold">
                {orderTotal != null ? `$${Number(orderTotal).toFixed(2)}` : '—'}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadIntent}
          disabled={intentLoading}
          className="btn btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1"
        >
          <RefreshCw size={14} className={intentLoading ? 'animate-spin' : ''} />
          Refresh invoice
        </button>
      </div>

      {showPaidWithOpenInvoiceWarning && (
        <div
          className="flex gap-2 rounded-xl p-3 text-xs"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#FBBF24' }}
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>
            This order has an open crypto invoice. Cancel the invoice before marking Paid manually,
            or let the watcher confirm on-chain payment.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-label mb-1 block">Payment status</label>
          <select
            value={fields.paymentStatus}
            onChange={(e) => onChange({ paymentStatus: e.target.value })}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
            style={fieldStyle}
          >
            {paymentStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-label mb-1 block">Payment method</label>
          <select
            value={fields.paymentMethod}
            onChange={(e) => onChange({ paymentMethod: e.target.value })}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
            style={fieldStyle}
          >
            <option value="">— Select —</option>
            <optgroup label="Manual">
              {MANUAL_PAYMENT_METHODS.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Crypto">
              {CRYPTO_ASSETS.map((a) => {
                const label = cryptoPaymentMethodLabel(a.id);
                const enabled = isCryptoGatewayEnabled(gateways, a.id);
                const isSelected = fields.paymentMethod === label;
                return (
                  <option
                    key={a.id}
                    value={label}
                    disabled={!enabled && !isSelected}
                  >
                    {label}
                    {!enabled ? ' (not enabled)' : ''}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>
      </div>

      <div>
        <label className="text-label mb-1 block">On-chain transaction hash</label>
        <input
          type="text"
          value={fields.cryptoTxHash}
          onChange={(e) => onChange({ cryptoTxHash: e.target.value })}
          placeholder="Optional — paste tx hash after manual confirmation"
          className="w-full rounded-lg px-4 py-2.5 text-sm font-mono outline-none"
          style={fieldStyle}
        />
      </div>

      <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
        <p className="text-label">Crypto invoice</p>

        {intentLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" />
          </div>
        ) : intent ? (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  color: intentStatusColor(resolvedStatus ?? intent.status),
                }}
              >
                {resolvedStatus ? intentStatusLabel(resolvedStatus) : intent.status}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {intent.expectedAmount} {intent.assetSymbol}
              </span>
              {intent.expiresAt && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  · expires {new Date(intent.expiresAt).toLocaleString()}
                </span>
              )}
            </div>
            <p className="font-mono text-xs break-all" style={{ color: 'var(--text-secondary)' }}>
              {intent.depositAddress}
            </p>
            {intent.txHash && (
              <p className="font-mono text-xs break-all" style={{ color: 'var(--text-tertiary)' }}>
                Tx: {intent.txHash}
              </p>
            )}
            {activeIntent && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(intent.expectedAmount, 'amount')}
                  className="btn btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1"
                >
                  <Copy size={12} />
                  {copied === 'amount' ? 'Copied' : 'Copy amount'}
                </button>
                <button
                  type="button"
                  onClick={() => copyText(intent.depositAddress, 'address')}
                  className="btn btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1"
                >
                  <Copy size={12} />
                  {copied === 'address' ? 'Copied' : 'Copy address'}
                </button>
              </div>
            )}
            {expiredOrCancelled && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                This invoice is no longer valid. Generate a new one below if the customer still needs to pay.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No invoice on file. Generate one for crypto checkout or send the customer their track link.
          </p>
        )}

        <div>
          <p className="text-label mb-2">Asset for new invoice</p>
          {pickerMethods.length > 0 ? (
            <CryptoAssetPicker
              methods={pickerMethods}
              selected={invoiceAsset}
              onSelect={handleAssetSelect}
              disabled={invoiceBusy}
            />
          ) : (
            <p className="text-xs rounded-lg p-3" style={{ color: 'var(--text-tertiary)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              No crypto assets enabled. Open <strong>Crypto Pay</strong> in the admin sidebar and enable at least one asset with a deposit address.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={invoiceBusy || !invoiceAsset || !!activeIntent}
            className="btn btn-primary text-xs px-4 py-2"
            title={activeIntent ? 'Cancel the current invoice first' : undefined}
          >
            {invoiceBusy ? <Spinner size="sm" /> : expiredOrCancelled ? 'Generate new invoice' : 'Generate invoice'}
          </button>
          {activeIntent && (
            <button
              type="button"
              onClick={handleCancelInvoice}
              disabled={invoiceBusy}
              className="btn btn-outline text-xs px-4 py-2"
            >
              Cancel invoice
            </button>
          )}
        </div>

        <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <label className="text-label mb-1 block">Invoice expiry override</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="datetime-local"
              value={fields.paymentExpiresAt}
              onChange={(e) => onChange({ paymentExpiresAt: e.target.value })}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none [color-scheme:dark]"
              style={fieldStyle}
            />
            <button
              type="button"
              onClick={handleSaveExpiryOnly}
              disabled={invoiceBusy}
              className="btn btn-outline text-xs px-4 py-2.5 shrink-0"
            >
              Save expiry
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Applies to the next invoice created for this order. Clear and save to use the global TTL from Crypto Pay.
          </p>
        </div>

        {invoiceMsg && (
          <p className="text-xs text-emerald-400">{invoiceMsg}</p>
        )}
        {invoiceError && (
          <p className="text-xs text-red-400">{invoiceError}</p>
        )}
      </div>
    </div>
  );
};
