"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  X,
  Copy,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  adminGetPaymentActivitySummary,
  adminListPaymentIntents,
  effectiveIntentStatus,
  intentStatusLabel,
  orderOriginLabel,
} from '@/lib/payments';
import { CRYPTO_ASSETS } from '@/lib/paymentConstants';
import type {
  AdminPaymentIntentRow,
  PaymentActivitySummary,
  PaymentIntentStatus,
} from '@/lib/paymentTypes';
import { Spinner } from '../../components/ui/Spinner';

/** Background refresh while Activity tab is open — slower when idle. */
const POLL_MS_ACTIVE = 60_000;
const POLL_MS_IDLE = 120_000;
export const ADMIN_HIGHLIGHT_ORDER_KEY = 'adminHighlightOrderId';

type StatusFilter = 'all' | 'active' | PaymentIntentStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active (pending + detected)' },
  { value: 'pending', label: 'Pending' },
  { value: 'detected', label: 'Detected' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const intentStatusStyle: Record<PaymentIntentStatus, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  detected: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
  confirmed: { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  expired: { bg: 'rgba(113,113,122,0.15)', color: '#A1A1AA' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
};

function truncateHash(hash?: string | null, len = 10): string {
  if (!hash) return '—';
  if (hash.length <= len * 2 + 2) return hash;
  return `${hash.slice(0, len)}…${hash.slice(-6)}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

interface PaymentActivitySectionProps {
  onOpenOrder?: (orderId: string) => void;
  isVisible?: boolean;
}

export const PaymentActivitySection: React.FC<PaymentActivitySectionProps> = ({
  onOpenOrder,
  isVisible = true,
}) => {
  const [summary, setSummary] = useState<PaymentActivitySummary | null>(null);
  const [intents, setIntents] = useState<AdminPaymentIntentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayUnavailable, setGatewayUnavailable] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assetFilter, setAssetFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selected, setSelected] = useState<AdminPaymentIntentRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [sum, list] = await Promise.all([
        adminGetPaymentActivitySummary(),
        adminListPaymentIntents({
          status: statusFilter,
          asset: assetFilter || undefined,
          search: searchDebounced || undefined,
          limit: 50,
        }),
      ]);
      setSummary(sum);
      setIntents(list.intents);
      setGatewayUnavailable(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load activity';
      if (/not deployed|503/i.test(msg)) {
        setGatewayUnavailable(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, assetFilter, searchDebounced]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isVisible) return;
    const poll = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      load(true);
    };
    const intervalMs =
      summary && summary.active > 0 ? POLL_MS_ACTIVE : POLL_MS_IDLE;
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [isVisible, load, summary?.active]);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Active', value: summary.active, hint: `${summary.pending} pending · ${summary.detected} detecting` },
      { label: 'Confirmed (7d)', value: summary.confirmedLast7Days, hint: `${summary.confirmed} all time` },
      { label: 'Expired', value: summary.expired, hint: 'Unpaid past expiry' },
      { label: 'Crypto assets', value: summary.enabledCryptoAssets, hint: 'Enabled in gateways' },
    ];
  }, [summary]);

  const copyTx = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const fieldStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  if (gatewayUnavailable) {
    return (
      <div className="glass p-6 text-sm text-[var(--text-secondary)]">
        <p className="mb-2">Payment activity is unavailable — crypto gateway not deployed.</p>
        <p className="text-xs text-[var(--text-tertiary)]">
          Deploy <code className="font-mono">admin_handler</code> with payment_shared to enable Activity.
        </p>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="glass p-4">
              <p className="text-label mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{card.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{card.hint}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Invoices{' '}
          <span className="font-normal text-sm text-[var(--text-tertiary)]">({intents.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Order ID or tx hash…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52 rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
              style={fieldStyle}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={fieldStyle}
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={fieldStyle}
          >
            <option value="">All assets</option>
            {CRYPTO_ASSETS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn btn-outline py-2 px-3"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Created', 'Status', 'Amount', 'Order', 'Origin', 'Customer', 'Order pay', 'Tx', 'Conf'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
                <th className="w-8" style={{ borderBottom: '1px solid var(--border)' }} aria-hidden />
              </tr>
            </thead>
            <tbody>
              {intents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]">
                    No payment intents match your filters.
                  </td>
                </tr>
              ) : (
                intents.map((row) => {
                  const status = effectiveIntentStatus(row);
                  const st = intentStatusStyle[status];
                  return (
                    <tr
                      key={row.intentId}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                      onClick={() => setSelected(row)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="badge text-xs"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {intentStatusLabel(status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="text-price font-semibold">{row.expectedAmount}</span>
                        <span className="text-[var(--text-tertiary)] ml-1 text-xs">
                          {row.assetSymbol || row.asset}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm text-[var(--text-primary)]">
                        #{row.orderId.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {orderOriginLabel(row.order)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-[var(--text-tertiary)]">
                        {row.order?.userId?.substring(0, 12) || row.userId?.substring(0, 12) || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="badge text-xs"
                          style={
                            row.order?.paymentStatus === 'Paid'
                              ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                              : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                          }
                        >
                          {row.order?.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-[var(--text-secondary)]">
                        {row.txHash ? truncateHash(row.txHash) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)] tabular-nums">
                        {(status === 'detected' || status === 'confirmed') && row.confirmations != null
                          ? row.confirmations
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-tertiary)]">
                        <ChevronRight size={14} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md h-full overflow-y-auto shadow-xl animate-fade-in"
            style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Payment intent details"
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)]" style={{ background: 'var(--bg-elevated)' }}>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Invoice details</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-[var(--text-tertiary)] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {(() => {
                const status = effectiveIntentStatus(selected);
                const st = intentStatusStyle[status];
                return (
                  <>
                    <div>
                      <p className="text-label mb-1">Status</p>
                      <span className="badge" style={{ background: st.bg, color: st.color }}>
                        {intentStatusLabel(status)}
                      </span>
                    </div>
                    <DetailRow label="Intent ID" value={selected.intentId} mono />
                    <DetailRow label="Order" value={`#${selected.orderId}`} mono />
                    <DetailRow label="Amount" value={`${selected.expectedAmount} ${selected.assetSymbol || selected.asset}`} />
                    <DetailRow label="Deposit address" value={selected.depositAddress} mono />
                    <DetailRow label="Expires" value={formatDate(selected.expiresAt)} />
                    <DetailRow label="Created" value={formatDate(selected.createdAt)} />
                    {selected.confirmedAt && (
                      <DetailRow label="Confirmed" value={formatDate(selected.confirmedAt)} />
                    )}
                    {selected.txHash && (
                      <div>
                        <p className="text-label mb-1">Transaction</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-[var(--text-secondary)] break-all">{selected.txHash}</code>
                          <button
                            type="button"
                            onClick={() => copyTx(selected.txHash!)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--text-tertiary)]"
                            aria-label="Copy transaction hash"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        {copied && <p className="text-xs text-emerald-400 mt-1">Copied</p>}
                        {selected.confirmations != null && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {selected.confirmations} confirmation(s)
                          </p>
                        )}
                      </div>
                    )}
                    {selected.order && (
                      <div className="glass p-4 space-y-2 mt-4">
                        <p className="text-label">Order</p>
                        <DetailRow label="Origin" value={orderOriginLabel(selected.order)} />
                        <DetailRow label="Customer" value={selected.order.userId || '—'} mono />
                        {selected.order.clientIp ? (
                          <DetailRow label="Client IP" value={selected.order.clientIp} mono />
                        ) : null}
                        <DetailRow label="Fulfillment" value={selected.order.status || '—'} />
                        <DetailRow
                          label="Order total"
                          value={
                            selected.order.orderTotal != null
                              ? `$${Number(selected.order.orderTotal).toFixed(2)}`
                              : '—'
                          }
                        />
                        <DetailRow label="Payment" value={selected.order.paymentStatus || 'Unpaid'} />
                      </div>
                    )}
                    {onOpenOrder && (
                      <button
                        type="button"
                        className="btn btn-primary w-full mt-4"
                        onClick={() => {
                          onOpenOrder(selected.orderId);
                          setSelected(null);
                        }}
                      >
                        <ExternalLink size={16} /> Open in Orders
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-label mb-1">{label}</p>
      <p className={`text-[var(--text-secondary)] ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</p>
    </div>
  );
}
