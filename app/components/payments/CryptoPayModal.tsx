"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Spinner } from '../ui/Spinner';
import { CryptoAssetPicker } from './CryptoAssetPicker';
import { useCryptoPaymentMethods } from '../../hooks/useCryptoPaymentMethods';
import {
  cancelPaymentIntent,
  createPaymentIntent,
  getPaymentIntent,
  resellerGetPaymentIntent,
  effectiveIntentStatus,
  intentStatusLabel,
  isActivePaymentIntent,
} from '@/lib/payments';
import { CRYPTO_ASSET_MAP } from '@/lib/paymentConstants';
import type { CryptoAssetId } from '@/lib/paymentConstants';
import { normalizePaymentStatus } from '@/lib/payments/orderHelpers';
import type { OrderDetails } from '@/lib/types';
import type { PaymentIntent, PaymentIntentStatus } from '@/lib/paymentTypes';
import { PaymentMethodBadge } from './PaymentMethodBadge';

type ModalView = 'invoice' | 'change';

type OrderPaymentContext = Pick<
  OrderDetails,
  'paymentStatus' | 'paymentMethod' | 'price' | 'cryptoTxHash'
>;

function PaymentContextSummary({
  order,
  intent,
  displayStatus,
  countdown,
}: {
  order?: OrderPaymentContext | null;
  intent: PaymentIntent | null;
  displayStatus: PaymentIntentStatus | null;
  countdown: string;
}) {
  const orderPaid = order ? normalizePaymentStatus(order.paymentStatus) === 'Paid' : false;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-label">Payment status</p>
          <span
            className={`inline-flex mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              orderPaid
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {order ? normalizePaymentStatus(order.paymentStatus) : 'Unpaid'}
          </span>
        </div>
        {order?.price?.total != null && (
          <div className="text-left sm:text-right shrink-0">
            <p className="text-label">Order total</p>
            <p className="text-price font-bold text-lg mt-0.5">
              ${order.price.total.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {order?.paymentMethod && (
        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 flex-wrap">
          <span>Method:</span>
          <PaymentMethodBadge method={order.paymentMethod} size="sm" showLabel="auto" />
        </p>
      )}

      {orderPaid && order?.cryptoTxHash && (
        <p className="text-xs font-mono text-[var(--text-tertiary)] break-all">
          Tx: <span className="text-[var(--text-secondary)]">{order.cryptoTxHash}</span>
        </p>
      )}

      {intent && displayStatus && (
        <div className="pt-3 border-t border-[var(--border)] space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-label">Crypto invoice</p>
              <p
                className={`text-sm font-semibold mt-1 ${
                  displayStatus === 'confirmed'
                    ? 'text-emerald-400'
                    : displayStatus === 'detected'
                      ? 'text-blue-400'
                      : displayStatus === 'expired'
                        ? 'text-red-400'
                        : displayStatus === 'cancelled'
                          ? 'text-amber-400'
                          : 'text-zinc-300'
                }`}
              >
                {intentStatusLabel(displayStatus)}
              </p>
              {intent.assetLabel && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{intent.assetLabel}</p>
              )}
            </div>
            {displayStatus !== 'confirmed' && displayStatus !== 'cancelled' && (
              <div className="text-right">
                <p className="text-label">
                  {displayStatus === 'expired' ? 'Expired' : 'Expires in'}
                </p>
                <p
                  className={`text-sm font-mono mt-1 ${
                    displayStatus === 'expired' ? 'text-red-400' : 'text-zinc-300'
                  }`}
                >
                  {displayStatus === 'expired'
                    ? new Date(intent.expiresAt).toLocaleString()
                    : countdown}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!intent && !orderPaid && (
        <p className="text-sm text-[var(--text-secondary)] pt-1">
          No active crypto invoice yet. Choose an asset below to generate one.
        </p>
      )}
    </div>
  );
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export interface CryptoPayModalProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
  defaultAsset?: CryptoAssetId | null;
  order?: OrderPaymentContext | null;
  /** Guest / white-label HMAC token — used when user is not logged in. */
  payToken?: string | null;
  /** Reseller dashboard: read-only invoice view via reseller API. */
  resellerView?: boolean;
}

export function CryptoPayModal({
  orderId,
  open,
  onClose,
  onPaid,
  defaultAsset,
  order,
  payToken,
  resellerView = false,
}: CryptoPayModalProps) {
  const { methods } = useCryptoPaymentMethods();
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [view, setView] = useState<ModalView>('invoice');
  const [selectedAsset, setSelectedAsset] = useState<CryptoAssetId | null>(defaultAsset ?? null);
  const [switching, setSwitching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState<'amount' | 'address' | null>(null);
  const [qrSize, setQrSize] = useState(180);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setQrSize(mq.matches ? 156 : 180);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const loadIntent = useCallback(async () => {
    if (!orderId) return;
    const opts = payToken ? { payToken } : undefined;
    try {
      const data = resellerView
        ? await resellerGetPaymentIntent(orderId)
        : await getPaymentIntent(orderId, opts);
      setIntent(data.intent);
      setError(data.intent ? null : 'No payment invoice found for this order.');
      if (data.intent?.asset) {
        setSelectedAsset(data.intent.asset);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [orderId, payToken, resellerView]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setIntent(null);
    setView('invoice');
    setSelectedAsset(defaultAsset ?? null);
    loadIntent();
  }, [open, orderId, defaultAsset, loadIntent]);

  useEffect(() => {
    if (!open || !intent?.expiresAt) return;
    const tick = () => {
      const ms = new Date(intent.expiresAt).getTime() - Date.now();
      setCountdown(formatCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, intent?.expiresAt]);

  const resolvedStatus = intent ? effectiveIntentStatus(intent) : null;

  useEffect(() => {
    if (
      !open ||
      !intent ||
      !resolvedStatus ||
      ['confirmed', 'expired', 'cancelled'].includes(resolvedStatus)
    ) {
      return;
    }
    const id = setInterval(loadIntent, 15000);
    return () => clearInterval(id);
  }, [open, intent, resolvedStatus, loadIntent]);

  useEffect(() => {
    if (intent?.status === 'confirmed') {
      onPaid?.();
      const t = setTimeout(onClose, 2000);
      return () => clearTimeout(t);
    }
  }, [intent?.status, onPaid, onClose]);

  const copyText = async (text: string, field: 'amount' | 'address') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const displayStatus: PaymentIntentStatus | null = intent
    ? effectiveIntentStatus(intent)
    : null;

  const needsNewInvoice =
    !intent ||
    displayStatus === 'expired' ||
    displayStatus === 'cancelled';

  const createOrSwitchInvoice = async (asset: CryptoAssetId) => {
    if (resellerView) return;
    const opts = payToken ? { payToken } : undefined;
    setSwitching(true);
    setError(null);
    try {
      if (isActivePaymentIntent(intent)) {
        await cancelPaymentIntent(orderId, opts);
      }
      const created = await createPaymentIntent(orderId, asset, opts);
      setIntent(created);
      setSelectedAsset(asset);
      setView('invoice');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update payment method');
    } finally {
      setSwitching(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (resellerView) return;
    const asset = selectedAsset ?? defaultAsset;
    if (!asset) {
      setError('Select a crypto asset to continue.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const opts = payToken ? { payToken } : undefined;
      const created = await createPaymentIntent(orderId, asset, opts);
      setIntent(created);
      setView('invoice');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (resellerView) return;
    setCancelling(true);
    const opts = payToken ? { payToken } : undefined;
    try {
      if (isActivePaymentIntent(intent)) {
        await cancelPaymentIntent(orderId, opts);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  const qrValue = intent
    ? `${intent.assetSymbol}:${intent.depositAddress}?amount=${intent.expectedAmount}`
    : '';

  const currentAsset = intent?.asset ?? selectedAsset ?? defaultAsset;
  const selectedLabel = selectedAsset ? CRYPTO_ASSET_MAP[selectedAsset]?.label : null;
  const sameAssetAsInvoice =
    !!intent && !!selectedAsset && intent.asset === selectedAsset && isActivePaymentIntent(intent);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border)] border-b-0 sm:border-b animate-fade-up overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crypto-pay-modal-title"
      >
        <div className="sticky top-0 z-10 flex justify-center pt-2 pb-0 sm:hidden bg-[var(--surface)]/95 backdrop-blur-sm rounded-t-2xl">
          <span className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
        </div>
        <div className="p-4 sm:p-8 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pb-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                id="crypto-pay-modal-title"
                className="text-lg sm:text-xl font-bold text-[var(--text-primary)]"
              >
                {view === 'change' ? 'Change crypto asset' : 'View payment'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {view === 'change'
                  ? 'Pick a different crypto. Your current invoice will be replaced with a new address and amount.'
                  : needsNewInvoice && displayStatus === 'expired'
                    ? 'This invoice expired. Generate a new one or switch crypto below.'
                    : needsNewInvoice && displayStatus === 'cancelled'
                      ? 'This invoice was cancelled. Generate a new one when you are ready to pay.'
                      : 'Review your payment status and send crypto before the invoice expires.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 flex items-center justify-center min-h-11 min-w-11 -mr-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] text-2xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {view === 'invoice' && !loading && (
            <div className="mb-4">
              <PaymentContextSummary
                order={order}
                intent={intent}
                displayStatus={displayStatus}
                countdown={countdown}
              />
            </div>
          )}

          {view === 'change' && (
            <div className="space-y-5">
              <CryptoAssetPicker
                methods={methods}
                selected={selectedAsset}
                onSelect={setSelectedAsset}
                disabled={switching}
              />
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setView('invoice');
                    setError(null);
                  }}
                  className="btn btn-outline flex-1"
                  disabled={switching}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => selectedAsset && createOrSwitchInvoice(selectedAsset)}
                  disabled={!selectedAsset || switching || sameAssetAsInvoice}
                  className="btn btn-primary flex-1"
                >
                  {switching ? (
                    <Spinner size="sm" />
                  ) : selectedLabel ? (
                    `Use ${selectedLabel}`
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleCancelInvoice}
                disabled={cancelling || switching}
                className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
              >
                {cancelling ? 'Cancelling…' : 'Cancel invoice and close'}
              </button>
            </div>
          )}

          {view === 'invoice' && loading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" className="text-[var(--accent)]" />
            </div>
          )}

          {view === 'invoice' && !loading && !intent && resellerView && (
            <p className="text-sm text-[var(--text-secondary)] mt-4">
              No active crypto invoice for this order. The customer can pay from their track link.
            </p>
          )}

          {view === 'invoice' && !loading && !intent && !resellerView && (
            <div className="space-y-4 mt-4">
              {error && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                  {error}
                </div>
              )}
              <CryptoAssetPicker
                methods={methods}
                selected={selectedAsset ?? defaultAsset ?? null}
                onSelect={setSelectedAsset}
                disabled={generating}
              />
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={generating || !(selectedAsset ?? defaultAsset)}
                className="btn btn-primary w-full"
              >
                {generating ? <Spinner size="sm" /> : 'Generate crypto invoice'}
              </button>
            </div>
          )}

          {view === 'invoice' && !loading && intent && (
            <div className="space-y-6 mt-4">
              {needsNewInvoice && displayStatus === 'expired' && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  This payment invoice has expired. The amount and address below are no longer valid.
                </div>
              )}

              {needsNewInvoice && displayStatus === 'cancelled' && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                  This invoice was cancelled. Generate a new invoice to pay with crypto.
                </div>
              )}

              {needsNewInvoice && !resellerView && (
                <div className="space-y-3">
                  <CryptoAssetPicker
                    methods={methods}
                    selected={selectedAsset ?? currentAsset ?? null}
                    onSelect={setSelectedAsset}
                    disabled={generating}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    disabled={generating || !(selectedAsset ?? defaultAsset)}
                    className="btn btn-primary w-full"
                  >
                    {generating ? <Spinner size="sm" /> : 'Generate new invoice'}
                  </button>
                </div>
              )}

              {!needsNewInvoice && (
                <>
                  <div>
                    <p className="text-label mb-2">Amount</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <p className="text-price text-xl sm:text-2xl font-bold break-all min-w-0">
                        {intent.expectedAmount}{' '}
                        <span className="text-base sm:text-lg">{intent.assetSymbol}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyText(intent.expectedAmount, 'amount')}
                        className="btn btn-outline text-xs px-3 py-2.5 sm:py-1.5 w-full sm:w-auto shrink-0 min-h-[44px] sm:min-h-0"
                      >
                        {copied === 'amount' ? 'Copied' : 'Copy amount'}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                      Send exactly this amount — the unique suffix identifies your order.
                      On-chain confirmation usually takes about 2 minutes after your transfer is seen.
                    </p>
                  </div>

                  <div>
                    <p className="text-label mb-2">Deposit address</p>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <p className="text-xs sm:text-sm font-mono text-[var(--text-secondary)] break-all flex-1 min-w-0">
                        {intent.depositAddress}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyText(intent.depositAddress, 'address')}
                        className="btn btn-outline text-xs px-3 py-2.5 sm:py-1.5 w-full sm:w-auto shrink-0 min-h-[44px] sm:min-h-0"
                      >
                        {copied === 'address' ? 'Copied' : 'Copy address'}
                      </button>
                    </div>
                  </div>

                  {qrValue && intent.status !== 'confirmed' && (
                    <div className="flex justify-center py-2">
                      <div className="bg-white p-3 sm:p-4 rounded-xl max-w-[min(100%,13rem)]">
                        <QRCodeSVG value={qrValue} size={qrSize} />
                      </div>
                    </div>
                  )}

                  {intent.txHash && (
                    <p className="text-xs text-[var(--text-tertiary)] break-all">
                      Transaction:{' '}
                      <span className="font-mono text-[var(--text-secondary)]">{intent.txHash}</span>
                    </p>
                  )}
                </>
              )}

              {intent.status === 'confirmed' && (
                <p className="text-center text-emerald-400 text-sm">Payment confirmed!</p>
              )}

              {displayStatus !== 'confirmed' && !resellerView && (
                <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset(intent?.asset ?? currentAsset ?? methods[0]?.id ?? null);
                      setView('change');
                      setError(null);
                    }}
                    className="btn btn-outline flex-1 text-sm"
                  >
                    Change crypto asset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
