"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ShieldCheck, Search, ChevronLeft, CheckCircle2,
    Clock, Package, XCircle, Loader2, AlertCircle,
    CreditCard, Truck, Moon, Sun,
} from 'lucide-react';
import { trackOrder } from '@/lib/apiClient';

// ─── Styles (mirrors checkout page) ─────────────────────────────────────────

function useStyles(dark: boolean) {
    const bg = dark ? 'bg-[#0f0f13]' : 'bg-slate-50';
    const surface = dark ? 'bg-[#1a1a22] border-white/[0.06]' : 'bg-white border-slate-200';
    const text = dark ? 'text-white' : 'text-slate-900';
    const subtext = dark ? 'text-zinc-400' : 'text-slate-500';
    const input = dark
        ? 'w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none transition-all'
        : 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:outline-none transition-all shadow-sm';
    const header = dark ? 'bg-[#0f0f13]/80 border-white/[0.06]' : 'bg-white/80 border-slate-200';
    const card = `${surface} rounded-2xl border`;
    const divider = dark ? 'border-white/[0.06]' : 'border-slate-100';
    return { bg, text, subtext, input, header, card, divider };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    pending: { label: 'Pending', icon: <Clock size={18} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'in-progress': { label: 'In Progress', icon: <Package size={18} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    completed: { label: 'Completed', icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    cancelled: { label: 'Cancelled', icon: <XCircle size={18} />, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
    Unpaid: { label: 'Unpaid', color: 'text-red-400' },
    Paid: { label: 'Paid', color: 'text-emerald-400' },
    Partial: { label: 'Partial', color: 'text-amber-400' },
};

// ─── Progress steps ───────────────────────────────────────────────────────────

const STEPS = ['pending', 'in-progress', 'completed'];
const stepIndex = (status: string) => STEPS.indexOf(status);

function ProgressBar({ status, dark }: { status: string; dark: boolean }) {
    if (status === 'cancelled') return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <XCircle size={16} /> Order cancelled
        </div>
    );
    const current = Math.max(0, stepIndex(status));
    const labels = ['Received', 'In Progress', 'Completed'];
    return (
        <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
                const done = i <= current;
                const active = i === current;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${done ? 'bg-indigo-600 border-indigo-600 text-white' : dark ? 'border-white/[0.12] text-zinc-600' : 'border-slate-200 text-slate-400'}`}>
                                {done && !active ? <CheckCircle2 size={14} /> : i + 1}
                            </div>
                            <span className={`text-xs font-medium ${active ? (dark ? 'text-white' : 'text-slate-900') : (dark ? 'text-zinc-600' : 'text-slate-400')}`}>
                                {labels[i]}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${i < current ? 'bg-indigo-600' : dark ? 'bg-white/[0.1]' : 'bg-slate-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Detail row ────────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode; dark: boolean }> = ({ label, value, icon, dark }) => (
    <div className={`flex items-center justify-between py-3 border-b last:border-0 ${dark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <div className={`flex items-center gap-2 text-sm ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {icon && <span className="opacity-70">{icon}</span>}
            {label}
        </div>
        <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
    </div>
);

// ─── Inner component (uses search params) ─────────────────────────────────────

function TrackInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const resellerId = params?.resellerId as string;

    const [dark, setDark] = useState(false);
    const [orderId, setOrderId] = useState(searchParams?.get('orderId') ?? '');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }, []);

    // Auto-search if orderId is pre-filled via query param
    useEffect(() => {
        const id = searchParams?.get('orderId');
        if (id) {
            setOrderId(id);
            doTrack(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const doTrack = async (id?: string) => {
        const oid = (id ?? orderId).trim();
        if (!oid) { setError('Please enter your Order ID.'); return; }
        setLoading(true); setError(''); setResult(null);
        try {
            const data = await trackOrder(oid);
            if (!data || data.error) { setError('Order not found. Double-check your Order ID.'); }
            else { setResult(data); }
        } catch {
            setError('Could not find that order. Check the ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    const s = useStyles(dark);
    const statusCfg = result ? (STATUS_CONFIG[result.status] ?? STATUS_CONFIG['pending']) : null;
    const paymentCfg = result ? (PAYMENT_CONFIG[result.paymentStatus] ?? PAYMENT_CONFIG['Unpaid']) : null;

    return (
        <div className={`${s.bg} min-h-screen transition-colors duration-200`}>
            {/* Header */}
            <header className={`sticky top-0 z-30 ${s.header} backdrop-blur-xl border-b`}>
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-500 flex-shrink-0" />
                        <span className={`${s.text} text-sm font-semibold`}>Order Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/`}
                            className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${dark ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                            <ChevronLeft size={13} /> Place Order
                        </Link>
                        <button
                            onClick={() => setDark(d => !d)}
                            className={`p-2 rounded-lg transition-all ${dark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            {dark ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto px-4 pt-8 pb-20 space-y-5">
                {/* Search card */}
                <div className={s.card + ' p-5'}>
                    <h1 className={`${s.text} text-lg font-bold mb-1`}>Track Your Order</h1>
                    <p className={`${s.subtext} text-sm mb-4`}>Enter the Order ID you received after placing your order.</p>
                    <div className="flex gap-2">
                        <input
                            className={s.input}
                            placeholder="Order ID (e.g. ord_abc123…)"
                            value={orderId}
                            onChange={e => setOrderId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doTrack()}
                        />
                        <button
                            onClick={() => doTrack()}
                            disabled={loading}
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                            <span className="hidden sm:inline">{loading ? 'Searching…' : 'Track'}</span>
                        </button>
                    </div>
                    {error && (
                        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                            <AlertCircle size={14} className="flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {/* Result */}
                {result && statusCfg && (
                    <>
                        {/* Status badge */}
                        <div className={s.card + ' p-5'}>
                            <p className={`${s.subtext} text-xs mb-3 uppercase tracking-wider font-semibold`}>Current Status</p>
                            <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${statusCfg.bg} ${statusCfg.color} font-semibold text-sm mb-5`}>
                                {statusCfg.icon} {statusCfg.label}
                            </div>
                            <ProgressBar status={result.status} dark={dark} />
                        </div>

                        {/* Order details */}
                        <div className={s.card + ' p-5'}>
                            <p className={`${s.subtext} text-xs mb-3 uppercase tracking-wider font-semibold`}>Order Details</p>
                            <Row dark={dark} label="Order ID" value={<span className="font-mono text-xs">{result.orderId}</span>} />
                            <Row dark={dark} label="IDs" value={result.ids?.length ?? result.numberOfIds ?? '—'} icon={<Package size={14} />} />
                            <Row dark={dark} label="Shipping" value={result.shipping ?? 'Local Pickup'} icon={<Truck size={14} />} />
                            <Row dark={dark} label="Payment" value={
                                <span className={paymentCfg?.color ?? ''}>{paymentCfg?.label ?? result.paymentStatus ?? '—'}</span>
                            } icon={<CreditCard size={14} />} />
                            {result.createdAt && (
                                <Row dark={dark} label="Placed"
                                    value={new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                />
                            )}
                        </div>

                        {/* Notes from reseller */}
                        {result.notes && (
                            <div className={s.card + ' p-5'}>
                                <p className={`${s.subtext} text-xs mb-2 uppercase tracking-wider font-semibold`}>Notes</p>
                                <p className={`text-sm ${s.text} leading-relaxed`}>{result.notes}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Exported page (wrap in Suspense for useSearchParams) ─────────────────────

export default function ResellerTrackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#0f0f13]" />}>
            <TrackInner />
        </Suspense>
    );
}
