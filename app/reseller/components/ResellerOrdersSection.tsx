"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useResellerData, ResellerOrder } from '../ResellerDataContext';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: 'Pending', color: 'text-amber-600', dot: 'bg-amber-500' },
    processing: { label: 'Processing', color: 'text-blue-600', dot: 'bg-blue-500' },
    shipped: { label: 'Shipped', color: 'text-sky-600', dot: 'bg-sky-500' },
    delivered: { label: 'Delivered', color: 'text-emerald-600', dot: 'bg-emerald-500' },
};

// ─── Order Row (expandable) ───────────────────────────────────────────────────

const OrderRow: React.FC<{ order: ResellerOrder }> = ({ order }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = statusConfig[order.status] || statusConfig.pending;

    return (
        <>
            <tr
                className="border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                <td className="px-4 py-3 text-sm font-mono text-slate-500">#{order.orderId.substring(0, 8)}…</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{order.numberOfIds} ID{order.numberOfIds !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">${order.price?.total?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50/60">
                    <td colSpan={7} className="px-6 py-4">
                        <div className="text-sm text-slate-500 space-y-1">
                            <p><span className="font-medium text-slate-700">Order ID:</span> {order.orderId}</p>
                            {order.shipping && <p><span className="font-medium text-slate-700">Ship To:</span> {order.shipping}</p>}
                            {order.source === 'reseller_portal' && (
                                <p><span className="font-medium text-slate-700">Source:</span> <span className="text-blue-600">Reseller Portal</span></p>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ResellerOrdersSection: React.FC = () => {
    const { orders, loadOrders } = useResellerData();
    const [search, setSearch] = useState('');

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return (orders.data ?? []).filter(o =>
            o.orderId.toLowerCase().includes(q) ||
            o.status.toLowerCase().includes(q) ||
            (o.paymentStatus ?? '').toLowerCase().includes(q)
        );
    }, [orders.data, search]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Your Orders</h2>
                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="bg-white border border-slate-200 rounded-lg pl-8 pr-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:outline-none w-52"
                    />
                </div>
            </div>

            {orders.isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Spinner size="lg" />
                </div>
            ) : orders.error ? (
                <p className="text-red-500 text-sm">{orders.error}</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <p className="font-medium">No orders yet</p>
                    <p className="text-sm mt-1">Orders from your portal will appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 bg-slate-50/60">
                                <tr>
                                    {['Order', 'Date', 'Status', 'IDs', 'Amount', 'Payment', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(order => <OrderRow key={order.orderId} order={order} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
