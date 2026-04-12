"use client";
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { useResellerData } from '../ResellerDataContext';
import { resellerUpdateOrder } from '@/lib/apiClient';
import { sortRows } from '@/lib/tableSort';
import { useTableSortState } from '@/app/hooks/useTableSort';
import { SortableTh } from '../../components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed', 'cancelled'];
const PAYMENT_OPTIONS = ['Unpaid', 'Paid', 'Partial'];

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};
const PAYMENT_COLORS: Record<string, string> = {
    Unpaid: 'bg-red-50 text-red-600 border-red-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Partial: 'bg-amber-50 text-amber-700 border-amber-200',
};

const pill = (val: string, map: Record<string, string>) =>
    `inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${map[val] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`;

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
        className={`text-xs font-medium rounded-full border px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer disabled:opacity-50 transition-all ${colorMap[value] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
    >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const ResellerOrdersSection: React.FC = () => {
    const { orders, loadOrders, refreshOrders } = useResellerData();
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    // Per-row edit state
    const [rowStatus, setRowStatus] = useState<Record<string, string>>({});
    const [rowPayment, setRowPayment] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    const [rowError, setRowError] = useState<Record<string, string>>({});

    const filtered = useMemo(() => {
        const items = orders.data ?? [];
        if (!search.trim()) return items;
        const q = search.toLowerCase();
        return items.filter((o: any) =>
            o.orderId?.toLowerCase().includes(q) ||
            o.status?.toLowerCase().includes(q) ||
            o.paymentStatus?.toLowerCase().includes(q)
        );
    }, [orders.data, search]);

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
            <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
    );
    if (orders.error) return (
        <div className="p-6 text-center text-red-500">Error: {orders.error}</div>
    );

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                    My Orders <span className="text-slate-400 font-normal text-sm">({sorted.length})</span>
                </h2>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full sm:w-52 bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {sorted.length === 0 ? (
                <div className="glass p-10 text-center">
                    <p className="text-slate-500 mb-1">No orders yet.</p>
                    <p className="text-slate-400 text-sm">Orders placed through your link will appear here.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr className="bg-slate-50">
                                    <SortableTh
                                        columnKey="orderId"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-slate-400"
                                    >
                                        Order
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="createdAt"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-slate-400"
                                    >
                                        Date
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="status"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-slate-400"
                                    >
                                        Status
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="ids"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-slate-400"
                                    >
                                        IDs
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="payment"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-slate-400"
                                    >
                                        Payment
                                    </SortableTh>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider" scope="col">
                                        Save
                                    </th>
                                    <th className="px-4 py-3 w-10" scope="col" aria-label="Expand row" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sorted.map((o: any) => {
                                    const isExpanded = expanded === o.orderId;
                                    const isSaving = !!saving[o.orderId];
                                    const isSaved = !!saved[o.orderId];
                                    const dirty = isDirty(o);
                                    const errMsg = rowError[o.orderId];

                                    return (
                                        <React.Fragment key={o.orderId}>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                {/* Order ID */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-mono text-slate-700">{o.orderId.substring(0, 8)}…</p>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
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
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                                    {o.ids?.length ?? o.numberOfIds ?? '—'}
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
                                                        <span className="flex items-center justify-end gap-1 text-xs text-emerald-600 font-medium">
                                                            <Check size={13} /> Saved
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSave(o)}
                                                            disabled={isSaving || !dirty}
                                                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 ml-auto"
                                                        >
                                                            {isSaving ? <Loader2 size={11} className="animate-spin" /> : null}
                                                            {isSaving ? 'Saving…' : 'Save'}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Expand toggle */}
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => setExpanded(isExpanded ? null : o.orderId)}
                                                        className="text-slate-400 hover:text-slate-700 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded detail row */}
                                            {isExpanded && (
                                                <tr className="bg-slate-50">
                                                    <td colSpan={7} className="px-4 py-4">
                                                        {errMsg && (
                                                            <p className="text-red-500 text-xs mb-2 bg-red-50 px-3 py-1.5 rounded-lg">{errMsg}</p>
                                                        )}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
                                                            <div>
                                                                <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Full Order ID</p>
                                                                <p className="font-mono break-all">{o.orderId}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Shipping</p>
                                                                <p>{o.shipping ?? '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Source</p>
                                                                <p>{o.source ?? 'direct'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Notes</p>
                                                                <p>{o.notes || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Payment Method</p>
                                                                <p>{o.paymentMethod ?? '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Last Updated</p>
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
        </div>
    );
};
