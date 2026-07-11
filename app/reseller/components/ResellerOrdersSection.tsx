"use client";
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Search, MoreVertical, Check, Loader2, Eye, PanelBottom, Wallet } from 'lucide-react';
import { useResellerData } from '../ResellerDataContext';
import { resellerUpdateOrder, createResellerBatch } from '@/lib/apiClient';
import {
    customerTotalFromOrder,
    profitFromOrder,
    wholesaleFromOrder,
} from '@/lib/resellerMetrics';
import { sortRows } from '@/lib/tableSort';
import { useTableSortState } from '@/app/hooks/useTableSort';
import { SortableTh } from '../../components/ui';
import { OrderPayModalHost } from '@/app/components/payments/OrderPayModalHost';
import { PaymentMethodBadge } from '@/app/components/payments/PaymentMethodBadge';
import { useOrderPayModal } from '@/app/hooks/useOrderPayModal';
import {
    cryptoAssetFromOrder,
    isCryptoOrder,
    isOrderUnpaid,
} from '@/lib/payments/orderHelpers';
import type { OrderDetails } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed', 'cancelled'];
const PAYMENT_OPTIONS = ['Unpaid', 'Paid', 'Partial'];

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'in-progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const PAYMENT_COLORS: Record<string, string> = {
    Unpaid: 'bg-red-500/10 text-red-400 border-red-500/20',
    Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const pill = (val: string, map: Record<string, string>) =>
    `inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${map[val] ?? 'bg-white/[0.06] text-zinc-400 border-[var(--border)]'}`;

// ─── Inline select ─────────────────────────────────────────────────────────────

interface EditSelectProps {
    value: string;
    options: string[];
    colorMap: Record<string, string>;
    onChange: (v: string) => void;
    saving: boolean;
}

const EditSelect: React.FC<EditSelectProps> = ({ value, options, colorMap, onChange, saving }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={saving}
        className={`text-xs font-medium rounded-full border px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35 focus:ring-offset-0 cursor-pointer disabled:opacity-50 transition-all ${colorMap[value] ?? 'bg-white/[0.06] text-zinc-400 border-[var(--border)]'}`}
    >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
);

// ─── Main Component ────────────────────────────────────────────────────────────

function ResellerOrdersSectionInner() {
    const { orders, loadOrders, refreshOrders } = useResellerData();
    const {
        payOrderId,
        payAsset,
        payOrder,
        openPayModal,
        closePayModal,
    } = useOrderPayModal({ resellerView: true });
    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (!menuOpenId) return;
            const el = document.querySelector(`[data-reseller-order-menu="${menuOpenId}"]`);
            if (el && !el.contains(e.target as Node)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [menuOpenId]);

    // Per-row edit state
    const [rowStatus, setRowStatus] = useState<Record<string, string>>({});
    const [rowPayment, setRowPayment] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    const [rowError, setRowError] = useState<Record<string, string>>({});
    const [batchFilter, setBatchFilter] = useState<'all' | 'unbatched' | 'in_batch'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchCreating, setBatchCreating] = useState(false);
    const [batchMsg, setBatchMsg] = useState<string | null>(null);

    const formatMoney = (n: number | null) => (n !== null ? `$${n.toFixed(2)}` : '—');

    const canSelectForBatch = (o: { batchStatus?: string; status?: string }) => {
        if (o.status === 'cancelled') return false;
        const bs = o.batchStatus || 'unbatched';
        return bs === 'unbatched' || bs === 'draft';
    };

    const filtered = useMemo(() => {
        let items = orders.data ?? [];
        if (batchFilter === 'unbatched') {
            items = items.filter((o) => !o.batchId || o.batchStatus === 'unbatched');
        } else if (batchFilter === 'in_batch') {
            items = items.filter((o) => o.batchId && o.batchStatus !== 'unbatched');
        }
        if (!search.trim()) return items;
        const q = search.toLowerCase();
        return items.filter((o: any) =>
            o.orderId?.toLowerCase().includes(q) ||
            o.status?.toLowerCase().includes(q) ||
            o.paymentStatus?.toLowerCase().includes(q)
        );
    }, [orders.data, search, batchFilter]);

    const toggleSelect = (orderId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const handleCreateBatch = async () => {
        if (selectedIds.size === 0) return;
        setBatchCreating(true);
        setBatchMsg(null);
        try {
            await createResellerBatch({
                name: `Batch ${new Date().toLocaleDateString()}`,
                orderIds: Array.from(selectedIds),
            });
            setSelectedIds(new Set());
            setBatchMsg('Draft batch created. Open Batches to review and submit.');
            await refreshOrders();
        } catch (err: unknown) {
            setBatchMsg(err instanceof Error ? err.message : 'Could not create batch.');
        } finally {
            setBatchCreating(false);
        }
    };

    const { sortKey, direction, toggleSort } = useTableSortState<
        'orderId' | 'createdAt' | 'status' | 'ids' | 'payment'
    >('createdAt', 'desc');

    const sorted = useMemo(() => {
        const tie = (a: any, b: any) => String(a.orderId ?? '').localeCompare(String(b.orderId ?? ''));
        return sortRows(
            filtered,
            sortKey,
            direction,
            {
                orderId: (o: any) => o.orderId ?? '',
                createdAt: (o: any) => (o.createdAt ? new Date(o.createdAt).getTime() : 0),
                status: (o: any) => rowStatus[o.orderId] ?? o.status ?? 'pending',
                ids: (o: any) => Number(o.ids?.length ?? o.numberOfIds ?? 0),
                payment: (o: any) => rowPayment[o.orderId] ?? o.paymentStatus ?? 'Unpaid',
            },
            tie
        );
    }, [filtered, sortKey, direction, rowStatus, rowPayment]);

    // Returns the *current edited* value or falls back to DB value
    const getStatus = (o: any) => rowStatus[o.orderId] ?? o.status ?? 'pending';
    const getPayment = (o: any) => rowPayment[o.orderId] ?? o.paymentStatus ?? 'Unpaid';

    const isDirty = (o: any) =>
        (rowStatus[o.orderId] !== undefined && rowStatus[o.orderId] !== o.status) ||
        (rowPayment[o.orderId] !== undefined && rowPayment[o.orderId] !== o.paymentStatus);

    const handleSave = async (o: any) => {
        setSaving(s => ({ ...s, [o.orderId]: true }));
        setRowError(e => ({ ...e, [o.orderId]: '' }));
        try {
            await resellerUpdateOrder(o.orderId, {
                ...(rowStatus[o.orderId] !== undefined ? { status: rowStatus[o.orderId] } : {}),
                ...(rowPayment[o.orderId] !== undefined ? { paymentStatus: rowPayment[o.orderId] } : {}),
            });
            await refreshOrders();
            // Clear local overrides so the refreshed DB values show
            setRowStatus(s => { const n = { ...s }; delete n[o.orderId]; return n; });
            setRowPayment(p => { const n = { ...p }; delete n[o.orderId]; return n; });
            setSaved(v => ({ ...v, [o.orderId]: true }));
            setTimeout(() => setSaved(v => ({ ...v, [o.orderId]: false })), 2000);
        } catch (err: any) {
            setRowError(e => ({ ...e, [o.orderId]: err.message ?? 'Save failed.' }));
        } finally {
            setSaving(s => ({ ...s, [o.orderId]: false }));
        }
    };

    if (orders.isLoading) return (
        <div className="p-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
        </div>
    );
    if (orders.error) return (
        <div className="p-6 text-center text-red-400">Error: {orders.error}</div>
    );

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    My Orders <span className="text-[var(--text-tertiary)] font-normal text-sm">({sorted.length})</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value as typeof batchFilter)}
                        className="bg-white/[0.04] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                    >
                        <option value="all">All orders</option>
                        <option value="unbatched">Unbatched</option>
                        <option value="in_batch">In batch</option>
                    </select>
                    <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full sm:w-52 bg-white/[0.04] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none transition-all"
                    />
                </div>
                </div>
            </div>

            {batchMsg && (
                <p className="mb-3 text-sm text-[var(--text-secondary)] bg-white/[0.04] border border-[var(--border)] rounded-lg px-3 py-2">{batchMsg}</p>
            )}

            {sorted.length === 0 ? (
                <div className="glass p-10 text-center">
                    <p className="text-[var(--text-secondary)] mb-1">No orders yet.</p>
                    <p className="text-[var(--text-tertiary)] text-sm">Orders placed through your link will appear here.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full reseller-orders-table">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-[var(--border)]">
                                    <th className="px-3 py-3 w-10" scope="col" aria-label="Select" />
                                    <SortableTh
                                        columnKey="orderId"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Order
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="createdAt"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Date
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="status"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Status
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="ids"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        IDs
                                    </SortableTh>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider" scope="col">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider" scope="col">
                                        Wholesale
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider" scope="col">
                                        Profit
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider" scope="col">
                                        Batch
                                    </th>
                                    <SortableTh
                                        columnKey="payment"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Payment
                                    </SortableTh>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider" scope="col">
                                        Save
                                    </th>
                                    <th className="px-4 py-3 w-12" scope="col" aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((o: any) => {
                                    const isExpanded = expanded === o.orderId;
                                    const isSaving = !!saving[o.orderId];
                                    const isSaved = !!saved[o.orderId];
                                    const dirty = isDirty(o);
                                    const errMsg = rowError[o.orderId];

                                    return (
                                        <React.Fragment key={o.orderId}>
                                            <tr className="hover:bg-white/[0.03] transition-colors">
                                                <td className="px-3 py-3">
                                                    {canSelectForBatch(o) ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(o.orderId)}
                                                            onChange={() => toggleSelect(o.orderId)}
                                                            className="rounded border-white/20 bg-white/[0.04] accent-indigo-500"
                                                            aria-label={`Select order ${o.orderId.slice(0, 8)}`}
                                                        />
                                                    ) : null}
                                                </td>
                                                {/* Order ID */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-mono text-[var(--text-primary)]">{o.orderId.substring(0, 8)}…</p>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-tertiary)]">
                                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                                                </td>

                                                {/* Status — editable */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <EditSelect
                                                        value={getStatus(o)}
                                                        options={STATUS_OPTIONS}
                                                        colorMap={STATUS_COLORS}
                                                        onChange={v => setRowStatus(s => ({ ...s, [o.orderId]: v }))}
                                                        saving={isSaving}
                                                    />
                                                </td>

                                                {/* ID count */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                    {o.ids?.length ?? o.numberOfIds ?? '—'}
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-400 font-medium">
                                                    {formatMoney(customerTotalFromOrder(o))}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                    {formatMoney(wholesaleFromOrder(o))}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-emerald-400">
                                                    {formatMoney(profitFromOrder(o))}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-tertiary)] max-w-[100px] truncate" title={o.batchId}>
                                                    {o.batchStatus && o.batchStatus !== 'unbatched'
                                                        ? o.batchStatus
                                                        : '—'}
                                                </td>

                                                {/* Payment — editable */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <EditSelect
                                                        value={getPayment(o)}
                                                        options={PAYMENT_OPTIONS}
                                                        colorMap={PAYMENT_COLORS}
                                                        onChange={v => setRowPayment(p => ({ ...p, [o.orderId]: v }))}
                                                        saving={isSaving}
                                                    />
                                                </td>

                                                {/* Save button */}
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    {isSaved ? (
                                                        <span className="flex items-center justify-end gap-1 text-xs text-emerald-400 font-medium">
                                                            <Check size={13} /> Saved
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSave(o)}
                                                            disabled={isSaving || !dirty}
                                                            className="btn btn-primary text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 ml-auto"
                                                        >
                                                            {isSaving ? <Loader2 size={11} className="animate-spin" /> : null}
                                                            {isSaving ? 'Saving…' : 'Save'}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Row actions */}
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <div
                                                        className="relative inline-flex"
                                                        data-reseller-order-menu={o.orderId}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setMenuOpenId(menuOpenId === o.orderId ? null : o.orderId)
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)] transition-colors"
                                                            aria-expanded={menuOpenId === o.orderId}
                                                            aria-haspopup="menu"
                                                            aria-label={`Actions for order ${o.orderId.slice(0, 8)}`}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        {menuOpenId === o.orderId && (
                                                            <div
                                                                className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-lg"
                                                                role="menu"
                                                            >
                                                                {isOrderUnpaid(o) && isCryptoOrder(o) && (
                                                                    <button
                                                                        type="button"
                                                                        role="menuitem"
                                                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-white/[0.06]"
                                                                        onClick={() => {
                                                                            void openPayModal(
                                                                                o.orderId,
                                                                                cryptoAssetFromOrder(o),
                                                                                o as OrderDetails
                                                                            );
                                                                            setMenuOpenId(null);
                                                                        }}
                                                                    >
                                                                        <Wallet size={16} className="text-[var(--text-tertiary)]" />
                                                                        View payment
                                                                    </button>
                                                                )}
                                                                <Link
                                                                    href={`/order/view?orderId=${encodeURIComponent(o.orderId)}&from=reseller&section=orders`}
                                                                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-white/[0.06]"
                                                                    role="menuitem"
                                                                    onClick={() => setMenuOpenId(null)}
                                                                >
                                                                    <Eye size={16} className="text-[var(--text-tertiary)]" />
                                                                    View full order
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-white/[0.06]"
                                                                    onClick={() => {
                                                                        setExpanded(isExpanded ? null : o.orderId);
                                                                        setMenuOpenId(null);
                                                                    }}
                                                                >
                                                                    <PanelBottom size={16} className="text-[var(--text-tertiary)]" />
                                                                    {isExpanded ? 'Hide quick summary' : 'Show quick summary'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded detail row */}
                                            {isExpanded && (
                                                <tr className="bg-white/[0.02]">
                                                    <td colSpan={12} className="px-4 py-4">
                                                        {errMsg && (
                                                            <p className="text-red-400 text-xs mb-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">{errMsg}</p>
                                                        )}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-[var(--text-secondary)]">
                                                            <div>
                                                                <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Full Order ID</p>
                                                                <p className="font-mono break-all">{o.orderId}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Shipping</p>
                                                                <p>{o.shipping ?? '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Source</p>
                                                                <p>{o.source ?? 'direct'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Notes</p>
                                                                <p>{o.notes || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Payment Method</p>
                                                                <PaymentMethodBadge method={o.paymentMethod} size="xs" showLabel="auto" fallback="—" />
                                                            </div>
                                                            {o.cryptoAsset && (
                                                                <div>
                                                                    <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Crypto asset</p>
                                                                    <p>{o.cryptoAsset}</p>
                                                                </div>
                                                            )}
                                                            {isOrderUnpaid(o) && isCryptoOrder(o) && (
                                                                <div className="sm:col-span-2 md:col-span-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            void openPayModal(
                                                                                o.orderId,
                                                                                cryptoAssetFromOrder(o),
                                                                                o as OrderDetails
                                                                            );
                                                                        }}
                                                                        className="btn btn-primary text-xs px-3 py-1.5 rounded-lg transition-all"
                                                                    >
                                                                        View payment
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wide mb-0.5">Last Updated</p>
                                                                <p>{o.updatedAt ? new Date(o.updatedAt).toLocaleString() : '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 glass px-4 py-3 rounded-xl shadow-lg border border-white/[0.08]">
                    <span className="text-sm text-white">{selectedIds.size} selected</span>
                    <button
                        type="button"
                        onClick={() => void handleCreateBatch()}
                        disabled={batchCreating}
                        className="btn btn-primary text-sm px-4 py-2 rounded-lg"
                    >
                        {batchCreating ? 'Creating…' : 'Add to batch'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="btn btn-outline text-sm px-3 py-2 rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            )}
            <OrderPayModalHost
                payOrderId={payOrderId}
                payAsset={payAsset}
                payOrder={payOrder}
                resellerView
                onClose={closePayModal}
                onPaid={() => void refreshOrders()}
            />
        </div>
    );
}

export const ResellerOrdersSection: React.FC = () => (
    <Suspense fallback={
        <div className="p-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
        </div>
    }>
        <ResellerOrdersSectionInner />
    </Suspense>
);
