"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminUpdateOrder, adminPresignGetUrl } from '../../../lib/apiClient';
import { adminSetOrderPaymentExpiry } from '@/lib/payments';
import { OrderR2ImageStrip } from '../../components/order/OrderR2ImageStrip';
import {
    AdminOrderPaymentPanel,
    type AdminOrderPaymentFields,
} from './AdminOrderPaymentPanel';
import { AdminOrderDetailsPanel } from './AdminOrderDetailsPanel';
import { Search, X, ChevronDown, ChevronUp, Package, CreditCard, FileText } from 'lucide-react';
import { OrderExportPanel } from './OrderExportPanel';
import { OrderCustomerNoticePanel } from './OrderCustomerNoticePanel';
import { PaymentMethodBadge } from '@/app/components/payments/PaymentMethodBadge';
import { Spinner, SortableTh } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';
import { sortRows } from '@/lib/tableSort';
import { useTableSortState } from '@/app/hooks/useTableSort';
import { toDatetimeLocalInputValue } from '@/lib/datetimeLocal';
import { parseCryptoAssetFromMethod } from '@/lib/payments/orderHelpers';
import { ADMIN_HIGHLIGHT_ORDER_KEY } from './PaymentActivitySection';
import { getStorageItem, removeStorageItem } from '@/lib/storage';

const statusOptions = ['pending', 'processing', 'shipped', 'delivered'] as const;

type EditTab = 'details' | 'order' | 'payment';

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    pending: { label: 'Pending', color: '#F59E0B', dotColor: '#F59E0B' },
    processing: { label: 'Processing', color: '#06B6D4', dotColor: '#06B6D4' },
    shipped: { label: 'Shipped', color: '#38BDF8', dotColor: '#38BDF8' },
    delivered: { label: 'Delivered', color: '#10B981', dotColor: '#10B981' },
};

/* ── Edit Order Modal ── */
interface EditModalProps {
    order: any;
    initialTab?: EditTab;
    onClose: () => void;
    onSave: (orderId: string, data: Record<string, any>) => Promise<void>;
    onRefresh: () => Promise<void>;
}

const EditOrderModal: React.FC<EditModalProps> = ({
    order,
    initialTab = 'details',
    onClose,
    onSave,
    onRefresh,
}) => {
    const [tab, setTab] = useState<EditTab>(initialTab);
    const [status, setStatus] = useState(order.status || 'pending');
    const [notes, setNotes] = useState(order.notes || '');
    const [customerNotice, setCustomerNotice] = useState(order.customerNotice || '');
    const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
    const [paymentFields, setPaymentFields] = useState<AdminOrderPaymentFields>({
        paymentStatus: order.paymentStatus || 'Unpaid',
        paymentMethod: order.paymentMethod || '',
        cryptoTxHash: order.cryptoTxHash || '',
        paymentExpiresAt: toDatetimeLocalInputValue(
            (order.paymentExpiresAt as string | undefined) ?? undefined
        ),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const patchPayment = (patch: Partial<AdminOrderPaymentFields>) => {
        setPaymentFields((prev) => ({ ...prev, ...patch }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const asset = parseCryptoAssetFromMethod(paymentFields.paymentMethod);
            const updateData: Record<string, unknown> = {
                status,
                notes,
                customerNotice: customerNotice.trim() || '',
                trackingNumber,
                paymentStatus: paymentFields.paymentStatus,
                paymentMethod: paymentFields.paymentMethod || undefined,
                cryptoTxHash: paymentFields.cryptoTxHash.trim() || undefined,
            };
            if (asset) {
                updateData.cryptoAsset = asset;
            }
            await onSave(order.orderId, updateData);
            if (paymentFields.paymentExpiresAt) {
                await adminSetOrderPaymentExpiry(
                    order.orderId,
                    new Date(paymentFields.paymentExpiresAt).toISOString()
                );
            } else {
                await adminSetOrderPaymentExpiry(order.orderId, null);
            }
            await onRefresh();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const fieldStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose, saving]);

    const tabBtn = (id: EditTab, label: string, Icon: typeof Package) => (
        <button
            type="button"
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
                background: tab === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
                border: tab === id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            }}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-fade-up" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} role="dialog" aria-modal="true" aria-labelledby="edit-order-modal-title">
                <button onClick={onClose} aria-label="Close dialog" className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}><X size={20} /></button>
                <h3 id="edit-order-modal-title" className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Edit order <span className="font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>#{order.orderId.substring(0, 8)}</span>
                </h3>
                <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                    ${order.price?.total?.toFixed(2) ?? '—'} · {order.numberOfIds ?? 0} ID(s)
                </p>

                <div className="flex flex-wrap gap-2 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                    {tabBtn('details', 'Order details', FileText)}
                    {tabBtn('order', 'Fulfillment', Package)}
                    {tabBtn('payment', 'Payment & invoice', CreditCard)}
                </div>

                {tab === 'details' && (
                    <AdminOrderDetailsPanel order={order} />
                )}

                {tab === 'order' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-label mb-1 block">Fulfillment status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle}>
                                {statusOptions.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Tracking number</label>
                            <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle} placeholder="Optional" />
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Internal notes</label>
                            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={fieldStyle} placeholder="Internal notes..." />
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Customer message</label>
                            <textarea rows={3} value={customerNotice} onChange={(e) => setCustomerNotice(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={fieldStyle} placeholder="Shown to customers when they track or view this order…" />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                Displays as a banner on track and order pages. Leave blank to hide.
                            </p>
                        </div>

                        <p className="text-xs pt-2" style={{ color: 'var(--text-tertiary)' }}>
                            Full customer and ID fields are on the <strong className="font-medium" style={{ color: 'var(--text-secondary)' }}>Order details</strong> tab.
                        </p>
                    </div>
                )}

                {tab === 'payment' && (
                    <AdminOrderPaymentPanel
                        order={order}
                        fields={paymentFields}
                        onChange={patchPayment}
                        onInvoiceChange={onRefresh}
                    />
                )}

                {error && <p className="text-red-400 text-sm p-2 rounded-lg mt-4" style={{ background: 'rgba(239,68,68,0.1)' }}>{error}</p>}
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={onClose} className="btn btn-outline px-4 py-2 text-sm" disabled={saving}>Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm" disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
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
    const [editInitialTab, setEditInitialTab] = useState<EditTab>('details');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(() => new Set());

    const toggleOrderSelection = (orderId: string, checked: boolean) => {
        setSelectedOrderIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(orderId);
            else next.delete(orderId);
            return next;
        });
    };

    const openEdit = (order: any, tab: EditTab = 'order') => {
        setEditInitialTab(tab);
        setEditingOrder(order);
    };

    useEffect(() => { loadOrders(); }, [loadOrders]);

    useEffect(() => {
        const highlightId = getStorageItem(ADMIN_HIGHLIGHT_ORDER_KEY);
        if (!highlightId || !orders.data?.length) return;
        const match = orders.data.find((o: { orderId?: string }) => o.orderId === highlightId);
        if (match) {
            setExpandedId(highlightId);
            setSearch(highlightId);
        }
        removeStorageItem(ADMIN_HIGHLIGHT_ORDER_KEY);
    }, [orders.data]);

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

    const { sortKey, direction, toggleSort } = useTableSortState(
        'createdAt' as const,
        'desc'
    );

    const sorted = useMemo(() => {
        const tie = (a: any, b: any) => String(a.orderId ?? '').localeCompare(String(b.orderId ?? ''));
        return sortRows(
            filtered,
            sortKey,
            direction,
            {
                orderId: (o: any) => o.orderId ?? '',
                createdAt: (o: any) => (o.createdAt ? new Date(o.createdAt).getTime() : 0),
                status: (o: any) => o.status ?? '',
                payment: (o: any) => o.paymentStatus ?? '',
                total: (o: any) => Number(o.price?.total ?? 0),
                ids: (o: any) => Number(o.numberOfIds ?? 0),
            },
            tie
        );
    }, [filtered, sortKey, direction]);

    const visibleOrderIds = useMemo(
        () => sorted.map((order: { orderId?: string }) => String(order.orderId ?? '')).filter(Boolean),
        [sorted]
    );

    const allVisibleSelected =
        visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedOrderIds.has(id));

    const toggleSelectAllVisible = (checked: boolean) => {
        setSelectedOrderIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                visibleOrderIds.forEach((id) => next.add(id));
            } else {
                visibleOrderIds.forEach((id) => next.delete(id));
            }
            return next;
        });
    };

    const handleSaveOrder = async (orderId: string, data: Record<string, any>) => {
        await adminUpdateOrder(orderId, data);
        await refreshOrders();
    };

    const resolveAdminAsset = useCallback((key: string) => adminPresignGetUrl(key), []);

    if (orders.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (orders.error) return <div className="p-6 text-center text-red-400">Error: {orders.error}</div>;

    const fieldStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

    return (
        <div className="p-4 sm:p-6">
            {editingOrder && (
                <EditOrderModal
                    order={editingOrder}
                    initialTab={editInitialTab}
                    onClose={() => setEditingOrder(null)}
                    onSave={handleSaveOrder}
                    onRefresh={refreshOrders}
                />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Orders <span className="font-normal text-sm" style={{ color: 'var(--text-tertiary)' }}>({sorted.length})</span>
                </h2>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            aria-label="Search orders"
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-56 rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
                            style={fieldStyle}
                        />
                    </div>
                    <select
                        aria-label="Filter by status"
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

            <div className="mb-4">
                <OrderExportPanel
                    orders={sorted}
                    selectedOrderIds={selectedOrderIds}
                    onClearSelection={() => setSelectedOrderIds(new Set())}
                />
                <OrderCustomerNoticePanel
                    orders={sorted}
                    selectedOrderIds={selectedOrderIds}
                    onClearSelection={() => setSelectedOrderIds(new Set())}
                    onSaved={refreshOrders}
                />
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th className="px-4 py-3 w-10" style={{ borderBottom: '1px solid var(--border)' }} scope="col">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="Select all visible orders"
                                        className="h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-indigo-500"
                                    />
                                </th>
                                <SortableTh
                                    columnKey="orderId"
                                    sortKey={sortKey}
                                    direction={direction}
                                    onSort={toggleSort}
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                >
                                    Order
                                </SortableTh>
                                <SortableTh
                                    columnKey="createdAt"
                                    sortKey={sortKey}
                                    direction={direction}
                                    onSort={toggleSort}
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                >
                                    Date
                                </SortableTh>
                                <SortableTh
                                    columnKey="status"
                                    sortKey={sortKey}
                                    direction={direction}
                                    onSort={toggleSort}
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                >
                                    Status
                                </SortableTh>
                                <SortableTh
                                    columnKey="payment"
                                    sortKey={sortKey}
                                    direction={direction}
                                    onSort={toggleSort}
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                >
                                    Payment
                                </SortableTh>
                                <SortableTh
                                    columnKey="total"
                                    sortKey={sortKey}
                                    direction={direction}
                                    onSort={toggleSort}
                                    align="right"
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                >
                                    Total
                                </SortableTh>
                                <SortableTh
                                    columnKey="ids"
                                    sortKey={sortKey}
                                    direction={direction}
                                    onSort={toggleSort}
                                    align="right"
                                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                >
                                    IDs
                                </SortableTh>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-10" style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }} scope="col" aria-label="Expand" />
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((order: any) => {
                                const cfg = statusConfig[order.status] || statusConfig.pending;
                                const isExpanded = expandedId === order.orderId;
                                const isSelected = selectedOrderIds.has(order.orderId);
                                return (
                                    <React.Fragment key={order.orderId}>
                                        <tr
                                            className="transition-colors cursor-pointer"
                                            style={{
                                                borderBottom: '1px solid var(--border)',
                                                background: isSelected ? 'rgba(99,102,241,0.06)' : undefined,
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = isSelected ? 'rgba(99,102,241,0.06)' : '';
                                            }}
                                            onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => toggleOrderSelection(order.orderId, e.target.checked)}
                                                    aria-label={`Select order ${order.orderId.substring(0, 8)}`}
                                                    className="h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>#{order.orderId.substring(0, 8)}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{order.userId?.substring(0, 8)}</p>
                                                {order.customerNotice?.trim() ? (
                                                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#818CF8' }}>Has customer message</p>
                                                ) : null}
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
                                                <td colSpan={8} className="px-4 py-4" style={{ background: 'var(--bg-secondary)' }}>
                                                    {(() => {
                                                        const firstId = (order.ids || [])[0] as Record<string, unknown> | undefined;
                                                        const customerName = firstId
                                                            ? [firstId.firstName, firstId.lastName].filter(Boolean).join(' ')
                                                            : '';
                                                        const idState = firstId?.state ? String(firstId.state) : '';
                                                        return (customerName || idState) ? (
                                                            <div className="mb-4 text-sm">
                                                                <span className="text-label block mb-1">Customer / ID</span>
                                                                <p style={{ color: 'var(--text-primary)' }}>
                                                                    {customerName || '—'}
                                                                    {idState ? (
                                                                        <span style={{ color: 'var(--text-secondary)' }}> · {idState}</span>
                                                                    ) : null}
                                                                    {(order.ids || []).length > 1 ? (
                                                                        <span style={{ color: 'var(--text-tertiary)' }}> (+{(order.ids || []).length - 1} more)</span>
                                                                    ) : null}
                                                                </p>
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                                                        <div>
                                                            <span className="text-label block mb-1">Payment</span>
                                                            <span className="badge inline-block" style={order.paymentStatus === 'Paid'
                                                                ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                                                                : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                                                            }>
                                                                {order.paymentStatus || 'Unpaid'}
                                                            </span>
                                                            <div className="mt-1">
                                                                {order.paymentMethod ? (
                                                                    <PaymentMethodBadge method={order.paymentMethod} size="xs" showLabel="auto" />
                                                                ) : (
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-label block mb-1">Crypto / invoice</span>
                                                            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                                                                {order.cryptoAsset ? String(order.cryptoAsset) : '—'}
                                                            </p>
                                                            {order.paymentExpiresAt && (
                                                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                                    Exp {new Date(order.paymentExpiresAt).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div><span className="text-label block mb-1">Shipping</span><span className="text-xs" style={{ color: 'var(--text-primary)' }}>{order.shipping || 'N/A'}</span></div>
                                                        <div><span className="text-label block mb-1">Tracking #</span><span style={{ color: 'var(--text-primary)' }}>{order.trackingNumber || '—'}</span></div>
                                                    </div>
                                                    {order.cryptoTxHash && (
                                                        <p className="text-xs font-mono mb-4 break-all" style={{ color: 'var(--text-tertiary)' }}>
                                                            Tx: {order.cryptoTxHash}
                                                        </p>
                                                    )}

                                                    <div className="mb-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-label block mb-2">ID images</span>
                                                        {(order.ids || []).length === 0 ? (
                                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No ID rows.</p>
                                                        ) : (
                                                            (order.ids || []).map((idRow: Record<string, unknown>, idx: number) => (
                                                                <div key={idx}>
                                                                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ID #{idx + 1}</p>
                                                                    <OrderR2ImageStrip
                                                                        slots={[
                                                                            { label: 'Photo', objectKey: typeof idRow.photoKey === 'string' ? idRow.photoKey : undefined },
                                                                            { label: 'Signature', objectKey: typeof idRow.signatureKey === 'string' ? idRow.signatureKey : undefined },
                                                                        ]}
                                                                        resolveUrl={resolveAdminAsset}
                                                                    />
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(order, 'details'); }} className="btn btn-primary px-3 py-1.5 text-xs">View order</button>
                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(order, 'order'); }} className="btn btn-outline px-3 py-1.5 text-xs">Edit fulfillment</button>
                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(order, 'payment'); }} className="btn btn-outline px-3 py-1.5 text-xs">Payment &amp; invoice</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {sorted.length === 0 && (
                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No orders found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
