"use client";
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useResellerData } from '../ResellerDataContext';
import { User, ShieldCheck, Package, TrendingUp, Info } from 'lucide-react';

// ─── Info row ─────────────────────────────────────────────────────────────────

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

// ─── Section card ─────────────────────────────────────────────────────────────

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
        <div className="px-5 pb-5">
            {children}
        </div>
    </div>
);

// ─── Coming Soon badge ────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export const SettingsSection: React.FC = () => {
    const { user } = useAuth();
    const { orders } = useResellerData();

    const totalOrders = orders.data?.length ?? 0;
    const completedOrders = orders.data?.filter((o: any) => o.status === 'completed').length ?? 0;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
            {/* Account info */}
            <Card title="Account">
                <Row label="Username" value={`@${user?.username ?? '—'}`} icon={<User size={15} />} />
                <Row label="Role" value={
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                        style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)', background: 'var(--accent-subtle)' }}>
                        Reseller
                    </span>
                } icon={<ShieldCheck size={15} />} />
            </Card>

            {/* Performance summary */}
            <Card title="Your Performance">
                <Row label="Total Orders Received" value={totalOrders} icon={<Package size={15} />} />
                <Row label="Orders Completed" value={completedOrders} icon={<TrendingUp size={15} />} />
                <Row label="Conversion Rate"
                    value={totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : '—'}
                    icon={<TrendingUp size={15} />}
                />
            </Card>

            {/* Future settings */}
            <Card title="Notifications & Preferences">
                <Soon label="Email notification when a new order arrives" />
                <Soon label="SMS alert for pending orders older than 24h" />
                <Soon label="Weekly performance digest" />
            </Card>

            <Card title="Payout & Pricing">
                <Soon label="Set your own pricing per state" />
                <Soon label="Connect payout method (Cash App / Venmo / Zelle)" />
                <Soon label="Revenue summary download (CSV)" />
            </Card>

            {/* Info note */}
            <div
                className="flex items-start gap-3 rounded-xl p-4 border text-xs leading-relaxed"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
                <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <p>
                    Settings and pricing customization are actively being developed. Your feedback shapes what gets built next —
                    reach out to your account manager if you have specific requests.
                </p>
            </div>
        </div>
    );
};
