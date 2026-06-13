"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Package, Send, AlertTriangle, ChevronRight } from 'lucide-react';
import {
    fetchResellerBatches,
    fetchResellerBatch,
    submitResellerBatch,
    updateResellerBatch,
    type ResellerBatch,
} from '@/lib/apiClient';
import { wholesaleFromOrder } from '@/lib/resellerMetrics';
import { useResellerData } from '../ResellerDataContext';
import { Notification } from '../../components/ui/Notification';

export const BatchesSection: React.FC = () => {
    const { refreshOrders } = useResellerData();
    const [batches, setBatches] = useState<ResellerBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ResellerBatch | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchResellerBatches();
            setBatches(data.batches ?? []);
        } catch (err: unknown) {
            setToast({
                message: err instanceof Error ? err.message : 'Could not load batches.',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadList(); }, [loadList]);

    const openDetail = async (batchId: string) => {
        setSelectedId(batchId);
        setDetailLoading(true);
        try {
            const d = await fetchResellerBatch(batchId);
            setDetail(d);
        } catch (err: unknown) {
            setToast({
                message: err instanceof Error ? err.message : 'Could not load batch.',
                type: 'error',
            });
            setSelectedId(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRename = async (name: string) => {
        if (!selectedId) return;
        try {
            const d = await updateResellerBatch(selectedId, { name });
            setDetail(d);
            await loadList();
        } catch (err: unknown) {
            setToast({
                message: err instanceof Error ? err.message : 'Rename failed.',
                type: 'error',
            });
        }
    };

    const handleSubmit = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await submitResellerBatch(selectedId);
            setToast({ message: 'Batch submitted for production.', type: 'success' });
            await loadList();
            await refreshOrders();
            await openDetail(selectedId);
        } catch (err: unknown) {
            setToast({
                message: err instanceof Error ? err.message : 'Submit failed.',
                type: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const wholesaleSum = (detail?.orders ?? []).reduce<number>((s, o) => {
        const w = wholesaleFromOrder(o as Parameters<typeof wholesaleFromOrder>[0]);
        return s + (w ?? 0);
    }, 0);

    const idCount = (detail?.orders ?? []).reduce<number>(
        (s, o) => s + Number((o as { ids?: unknown[] }).ids?.length ?? 0),
        0
    );

    if (loading) {
        return (
            <div className="p-12 flex justify-center">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
            {toast && (
                <Notification
                    message={toast.message}
                    type={toast.type}
                    show
                    onDismiss={() => setToast(null)}
                />
            )}

            <header className="animate-fade-up">
                <h1 className="text-2xl font-bold text-white tracking-tight">Batches</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Group portal orders for production. Pricing is fixed per order — batching is for ops only.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass p-4 space-y-2 animate-fade-up delay-1">
                    <h2 className="text-label mb-3">Your batches</h2>
                    {batches.length === 0 ? (
                        <p className="text-sm text-zinc-500 py-6 text-center">
                            No batches yet. Select orders on My Orders and click &quot;Add to batch&quot;.
                        </p>
                    ) : (
                        batches.map((b) => (
                            <button
                                key={b.batchId}
                                type="button"
                                onClick={() => void openDetail(b.batchId)}
                                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                                    selectedId === b.batchId
                                        ? 'border-indigo-500/40 bg-indigo-500/10'
                                        : 'border-white/[0.08] hover:border-white/[0.16]'
                                }`}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{b.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {(b.orderIds?.length ?? 0)} orders · {b.status}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-zinc-500 shrink-0" />
                            </button>
                        ))
                    )}
                </div>

                <div className="glass p-4 animate-fade-up delay-2">
                    {!selectedId ? (
                        <div className="py-12 text-center text-zinc-500 text-sm">
                            <Package size={32} className="mx-auto mb-3 opacity-40" />
                            Select a batch to view details
                        </div>
                    ) : detailLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 size={22} className="animate-spin text-zinc-400" />
                        </div>
                    ) : detail ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-label block mb-1">Batch name</label>
                                <input
                                    type="text"
                                    defaultValue={detail.name}
                                    key={detail.batchId}
                                    onBlur={(e) => {
                                        if (detail.status === 'draft' && e.target.value.trim() !== detail.name) {
                                            void handleRename(e.target.value.trim());
                                        }
                                    }}
                                    disabled={detail.status !== 'draft'}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                    <span className="text-zinc-500">Status </span>
                                    <span className="text-white font-medium">{detail.status}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Type </span>
                                    <span className="text-white">{detail.batchType ?? '—'}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">IDs </span>
                                    <span className="text-white">{idCount}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Wholesale sum </span>
                                    <span className="text-price">${wholesaleSum.toFixed(2)}</span>
                                </div>
                            </div>

                            {detail.eligibilityErrors && detail.eligibilityErrors.length > 0 && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 space-y-1">
                                    <p className="font-semibold flex items-center gap-1.5">
                                        <AlertTriangle size={14} /> Eligibility warnings
                                    </p>
                                    {detail.eligibilityErrors.map((e) => (
                                        <p key={e}>{e}</p>
                                    ))}
                                </div>
                            )}

                            <div>
                                <p className="text-label mb-2">Orders</p>
                                <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                                    {(detail.orders ?? []).map((o) => {
                                        const order = o as { orderId?: string; paymentMethod?: string };
                                        return (
                                            <li key={order.orderId} className="font-mono text-zinc-400 text-xs">
                                                {order.orderId?.slice(0, 8)}… · {order.paymentMethod ?? '—'}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {detail.status === 'draft' && (
                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={
                                        submitting ||
                                        !detail.orderIds?.length ||
                                        (detail.eligibilityErrors?.length ?? 0) > 0
                                    }
                                    className="btn btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                    Submit batch
                                </button>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
