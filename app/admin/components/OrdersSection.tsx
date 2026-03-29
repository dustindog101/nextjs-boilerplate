"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminUpdateOrder } from '../../../lib/apiClient';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

const statusOptions = ['pending', 'processing', 'shipped', 'delivered'] as const;
const paymentStatusOptions = ['Unpaid', 'Paid'] as const;

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    pending: { label: 'Pending', color: '#F59E0B', dotColor: '#F59E0B' },
    processing: { label: 'Processing', color: '#06B6D4', dotColor: '#06B6D4' },
    shipped: { label: 'Shipped', color: '#38BDF8', dotColor: '#38BDF8' },
    delivered: { label: 'Delivered', color: '#10B981', dotColor: '#10B981' },
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

    const fieldStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-xl p-6 w-full max-w-lg relative animate-fade-up" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <button onClick={onClose} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}><X size={20} /></button>
                <h3 className="text-lg font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
                    Edit Order <span className="font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>#{order.orderId.substring(0, 8)}</span>
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle}>
                                {statusOptions.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Payment</label>
                            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle}>
                                {paymentStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-label mb-1 block">Tracking Number</label>
                        <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="text-label mb-1 block">Notes</label>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={fieldStyle} placeholder="Internal notes..." />
                    </div>
                    {error && <p className="text-red-400 text-sm p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>{error}</p>}
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
        if (statusFilter !== 'all') result = result.filter((o: any) => o.status === statusFilter);
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
    if (orders.error) return <div className="p-6 text-center text-red-400">Error: {orders.error}</div>;

    const fieldStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

    return (
        <div className="p-4 sm:p-6">
            {editingOrder && <EditOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleSaveOrder} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Orders <span className="font-normal text-sm" style={{ color: 'var(--text-tertiary)' }}>({filtered.length})</span>
                </h2>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-56 rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
                            style={fieldStyle}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={fieldStyle}
                    >
                        <option value="all">All Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{statusConfig[s]?.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                {['Order', 'Date', 'Status', 'Payment', 'Total', 'IDs', ''].map((h, i) => (
                                    <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i >= 4 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order: any) => {
                                const cfg = statusConfig[order.status] || statusConfig.pending;
                                const isExpanded = expandedId === order.orderId;
                                return (
                                    <React.Fragment key={order.orderId}>
                                        <tr
                                            className="transition-colors cursor-pointer"
                                            style={{ borderBottom: '1px solid var(--border)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                                            onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>#{order.orderId.substring(0, 8)}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{order.userId?.substring(0, 8)}</p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
                                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dotColor }} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="badge" style={order.paymentStatus === 'Paid'
                                                    ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                                                    : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                                                }>
                                                    {order.paymentStatus || 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-price text-sm font-bold">
                                                ${order.price?.total?.toFixed(2) || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{order.numberOfIds || 0}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right" style={{ color: 'var(--text-tertiary)' }}>
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-4" style={{ background: 'var(--bg-secondary)' }}>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                                                        <div><span className="text-label block mb-1">Payment Method</span><span style={{ color: 'var(--text-primary)' }}>{order.paymentMethod || 'N/A'}</span></div>
                                                        <div><span className="text-label block mb-1">Shipping</span><span className="text-xs" style={{ color: 'var(--text-primary)' }}>{order.shipping || 'N/A'}</span></div>
                                                        <div><span className="text-label block mb-1">Tracking #</span><span style={{ color: 'var(--text-primary)' }}>{order.trackingNumber || '—'}</span></div>
                                                        <div><span className="text-label block mb-1">Notes</span><span className="text-xs" style={{ color: 'var(--text-primary)' }}>{order.notes || '—'}</span></div>
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
                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No orders found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
