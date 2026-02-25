"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminUpdateOrder } from '../../../lib/apiClient';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

const statusOptions = ['pending', 'processing', 'shipped', 'delivered'] as const;
const paymentStatusOptions = ['Unpaid', 'Paid'] as const;

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: 'Pending', color: 'text-amber-600', dot: 'bg-amber-500' },
    processing: { label: 'Processing', color: 'text-blue-600', dot: 'bg-blue-500' },
    shipped: { label: 'Shipped', color: 'text-sky-600', dot: 'bg-sky-500' },
    delivered: { label: 'Delivered', color: 'text-emerald-600', dot: 'bg-emerald-500' },
};

/* ── Edit Order Modal ── */
interface EditModalProps {
    order: any;
    onClose: () => void;
    onSave: (orderId: string, data: Record<string, any>) => Promise<void>;
}

const EditOrderModal: React.FC<EditModalProps> = ({ order, onClose, onSave }) => {
    const [status, setStatus] = useState(order.status || 'pending');
    const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'Unpaid');
    const [notes, setNotes] = useState(order.notes || '');
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await onSave(order.orderId, { status, paymentStatus, notes, trackingNumber });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-lg relative animate-fade-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
                <h3 className="text-lg font-bold text-slate-900 mb-5">Edit Order <span className="text-slate-400 font-mono text-sm">#{order.orderId.substring(0, 8)}</span></h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                                {statusOptions.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Payment</label>
                            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}>
                                {paymentStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-label mb-1 block">Tracking Number</label>
                        <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={inputCls} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="text-label mb-1 block">Notes</label>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} placeholder="Internal notes..." />
                    </div>
                    {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="btn btn-outline px-4 py-2 text-sm" disabled={saving}>Cancel</button>
                        <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Orders Section ── */
export const OrdersSection = () => {
    const { orders, loadOrders, refreshOrders } = useAdminData();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [editingOrder, setEditingOrder] = useState<any | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const filtered = useMemo(() => {
        let result = orders.data || [];
        if (statusFilter !== 'all') {
            result = result.filter((o: any) => o.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((o: any) =>
                o.orderId?.toLowerCase().includes(q) ||
                o.userId?.toLowerCase().includes(q) ||
                o.shipping?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [orders.data, search, statusFilter]);

    const handleSaveOrder = async (orderId: string, data: Record<string, any>) => {
        await adminUpdateOrder(orderId, data);
        await refreshOrders();
    };

    if (orders.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (orders.error) return <div className="p-6 text-center text-red-500">Error: {orders.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {editingOrder && <EditOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleSaveOrder} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                    Orders <span className="text-slate-400 font-normal text-sm">({filtered.length})</span>
                </h2>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-56 bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all"
                    >
                        <option value="all">All Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{statusConfig[s]?.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">IDs</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((order: any) => {
                                const cfg = statusConfig[order.status] || statusConfig.pending;
                                const isExpanded = expandedId === order.orderId;
                                return (
                                    <React.Fragment key={order.orderId}>
                                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.orderId)}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium text-slate-900 font-mono">#{order.orderId.substring(0, 8)}</p>
                                                <p className="text-xs text-slate-400">{order.userId?.substring(0, 8)}</p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {order.paymentStatus || 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-price text-sm font-bold">
                                                ${order.price?.total?.toFixed(2) || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500">{order.numberOfIds || 0}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-4 bg-slate-50/50">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                                                        <div><span className="text-label block mb-1">Payment Method</span><span className="text-slate-900">{order.paymentMethod || 'N/A'}</span></div>
                                                        <div><span className="text-label block mb-1">Shipping</span><span className="text-slate-900 text-xs">{order.shipping || 'N/A'}</span></div>
                                                        <div><span className="text-label block mb-1">Tracking #</span><span className="text-slate-900">{order.trackingNumber || '—'}</span></div>
                                                        <div><span className="text-label block mb-1">Notes</span><span className="text-slate-900 text-xs">{order.notes || '—'}</span></div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }} className="btn btn-outline px-3 py-1.5 text-xs">Edit Order</button>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">No orders found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
