"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useResellerData } from '../ResellerDataContext';
import {
    fetchResellerSettings,
    updateResellerSettings,
} from '@/lib/apiClient';
import { handlingFee, shippingFee } from '@/lib/constants';
import { wholesalePerId } from '@/lib/pricing';
import {
    downloadCsv,
    ordersToCsvRows,
} from '@/lib/resellerMetrics';
import { User, ShieldCheck, Package, TrendingUp, Info, DollarSign, Download } from 'lucide-react';
import { Notification } from '../../components/ui/Notification';

const Row: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div
        className="flex items-center justify-between py-3.5 border-b last:border-0"
        style={{ borderColor: 'var(--border)' }}
    >
        <div className="flex items-center gap-2.5">
            {icon && <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
        <div className="px-5 pt-5 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {title}
            </h3>
        </div>
        <div className="px-5 pb-5">{children}</div>
    </div>
);

const Soon: React.FC<{ label: string }> = ({ label }) => (
    <div
        className="flex items-center justify-between py-3.5 border-b last:border-0 opacity-50"
        style={{ borderColor: 'var(--border)' }}
    >
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span
            className="text-xs font-medium px-2 py-0.5 rounded-full border"
            style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)', background: 'var(--accent-subtle)' }}
        >
            Coming Soon
        </span>
    </div>
);

export const SettingsSection: React.FC = () => {
    const { user } = useAuth();
    const { orders, loadOrders } = useResellerData();
    const [defaultPerId, setDefaultPerId] = useState('95');
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => { void loadOrders(); }, [loadOrders]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchResellerSettings();
                if (!cancelled) {
                    setDefaultPerId(String(data.resellerPricing?.defaultPerId ?? 95));
                }
            } catch {
                if (!cancelled) {
                    setToast({ message: 'Could not load pricing settings.', type: 'error' });
                }
            } finally {
                if (!cancelled) setSettingsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const retailNum = parseFloat(defaultPerId) || 0;
    const marginPreview = useMemo(() => {
        const counts = [1, 5, 10];
        return counts.map((n) => {
            const wholesale = wholesalePerId(n);
            const margin = retailNum - wholesale;
            return { n, wholesale, margin };
        });
    }, [retailNum]);

    const totalOrders = orders.data?.length ?? 0;
    const completedOrders = orders.data?.filter((o) => o.status === 'completed').length ?? 0;

    const handleSavePricing = async () => {
        const val = parseFloat(defaultPerId);
        if (!Number.isFinite(val) || val <= 0) {
            setToast({ message: 'Enter a valid per-ID price.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            await updateResellerSettings({ defaultPerId: val });
            setToast({ message: 'Retail pricing saved.', type: 'success' });
        } catch (err: unknown) {
            setToast({
                message: err instanceof Error ? err.message : 'Save failed.',
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCsvExport = useCallback(() => {
        const rows = ordersToCsvRows(orders.data ?? []);
        const slug = user?.username ?? 'reseller';
        downloadCsv(`${slug}-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    }, [orders.data, user?.username]);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
            {toast && (
                <Notification
                    message={toast.message}
                    type={toast.type}
                    show
                    onDismiss={() => setToast(null)}
                />
            )}

            <Card title="Account">
                <Row label="Username" value={`@${user?.username ?? '—'}`} icon={<User size={15} />} />
                <Row
                    label="Role"
                    value={
                        <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                            style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)', background: 'var(--accent-subtle)' }}
                        >
                            Reseller
                        </span>
                    }
                    icon={<ShieldCheck size={15} />}
                />
            </Card>

            <Card title="Retail Pricing">
                <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Set the per-ID price customers see on your white-label portal. Your wholesale cost uses volume tiers at order time.
                </p>
                <label className="text-label block mb-2">Default price per ID (USD)</label>
                <div className="flex gap-2 mb-4">
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={defaultPerId}
                        onChange={(e) => setDefaultPerId(e.target.value)}
                        disabled={settingsLoading || saving}
                        className="flex-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => void handleSavePricing()}
                        disabled={settingsLoading || saving}
                        className="btn btn-primary px-5 py-3 rounded-xl text-sm shrink-0"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
                <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Margin preview (retail − wholesale)
                    </p>
                    {marginPreview.map(({ n, wholesale, margin }) => (
                        <div key={n} className="flex justify-between text-sm">
                            <span style={{ color: 'var(--text-secondary)' }}>{n} ID{n > 1 ? 's' : ''}</span>
                            <span style={{ color: 'var(--text-primary)' }}>
                                wholesale <span className="text-price">${wholesale}</span>
                                {' · '}
                                margin <span className={margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>${margin.toFixed(0)}</span>/ID
                            </span>
                        </div>
                    ))}
                    <p className="text-xs pt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Example customer total (1 ID, pickup):{' '}
                        <span className="text-price">${(retailNum + handlingFee).toFixed(2)}</span>
                        {' '}(+ ${shippingFee} if shipped)
                    </p>
                </div>
            </Card>

            <Card title="Your Performance">
                <Row label="Total Orders Received" value={totalOrders} icon={<Package size={15} />} />
                <Row label="Orders Completed" value={completedOrders} icon={<TrendingUp size={15} />} />
                <Row
                    label="Conversion Rate"
                    value={totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : '—'}
                    icon={<TrendingUp size={15} />}
                />
            </Card>

            <Card title="Reports">
                <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-2.5">
                        <DollarSign size={15} style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Revenue summary (CSV)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCsvExport}
                        disabled={!orders.data?.length}
                        className="btn btn-outline text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                    >
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </Card>

            <Card title="Notifications & Preferences">
                <Soon label="Email notification when a new order arrives" />
                <Soon label="SMS alert for pending orders older than 24h" />
                <Soon label="Weekly performance digest" />
            </Card>

            <Card title="Payout">
                <Soon label="Connect payout method (Cash App / Venmo / Zelle)" />
            </Card>

            <div
                className="flex items-start gap-3 rounded-xl p-4 border text-xs leading-relaxed"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
                <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <p>
                    Customer totals on your portal use the retail price above. Wholesale owed to ID Pirate is calculated per order at checkout.
                </p>
            </div>
        </div>
    );
};
