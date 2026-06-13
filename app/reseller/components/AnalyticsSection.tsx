"use client";
import React, { useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { Package, Clock, CheckCircle2, DollarSign, TrendingUp, AlertCircle, Wallet } from 'lucide-react';
import { useResellerData } from '../ResellerDataContext';
import {
    customerTotalFromOrder,
    summarizeResellerOrders,
    wholesaleFromOrder,
    downloadCsv,
    ordersToCsvRows,
} from '@/lib/resellerMetrics';

function weekLabel(iso: string) {
    const d = new Date(iso);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7);
    return `W${week}`;
}

const StatCard: React.FC<{
    label: string; value: string | number; icon: React.ReactNode;
    accent?: boolean; sub?: string; muted?: boolean;
}> = ({ label, value, icon, accent, sub, muted }) => (
    <div
        className="rounded-2xl p-5 border flex flex-col gap-3"
        style={{
            background: accent ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
            borderColor: accent ? 'var(--border-accent)' : 'var(--border)',
            opacity: muted ? 0.85 : 1,
        }}
    >
        <div className="flex items-center gap-2" style={{ color: accent ? 'var(--accent)' : 'var(--text-secondary)' }}>
            {icon}
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-3xl font-bold" style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div
        className="rounded-2xl p-5 border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
        {children}
    </div>
);

const tooltipStyle = {
    contentStyle: {
        backgroundColor: 'var(--bg-secondary, #1A2235)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: '#F1F5F9' },
    itemStyle: { color: '#06B6D4' },
};

export const AnalyticsSection: React.FC = () => {
    const { orders, loadOrders } = useResellerData();

    useEffect(() => { void loadOrders(); }, [loadOrders]);

    const data = useMemo(() => orders.data ?? [], [orders.data]);
    const summary = useMemo(() => summarizeResellerOrders(data), [data]);

    const totalOrders = data.length;
    const pendingOrders = data.filter((o) => o.status === 'pending').length;
    const completedOrders = data.filter((o) => o.status === 'completed').length;
    const cancelledOrders = data.filter((o) => o.status === 'cancelled').length;
    const conversionRate = totalOrders > 0
        ? Math.round((completedOrders / totalOrders) * 100)
        : 0;

    const statusData = [
        { name: 'Pending', orders: pendingOrders, fill: '#F59E0B' },
        { name: 'In Progress', orders: data.filter((o) => o.status === 'in-progress').length, fill: '#06B6D4' },
        { name: 'Completed', orders: completedOrders, fill: '#10B981' },
        { name: 'Cancelled', orders: cancelledOrders, fill: '#EF4444' },
    ];

    const weeklyMap: Record<string, { revenue: number; wholesale: number }> = {};
    data.forEach((o) => {
        if (!o.createdAt || o.paymentStatus !== 'Paid') return;
        const key = weekLabel(o.createdAt);
        if (!weeklyMap[key]) weeklyMap[key] = { revenue: 0, wholesale: 0 };
        const rev = customerTotalFromOrder(o);
        const cost = wholesaleFromOrder(o);
        if (rev !== null) weeklyMap[key].revenue += rev;
        if (cost !== null) weeklyMap[key].wholesale += cost;
    });
    const weeklyFinancial = Object.entries(weeklyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-8)
        .map(([week, v]) => ({
            week,
            revenue: Math.round(v.revenue * 100) / 100,
            wholesale: Math.round(v.wholesale * 100) / 100,
        }));

    const weeklyMapCount: Record<string, number> = {};
    data.forEach((o) => {
        if (!o.createdAt) return;
        const key = weekLabel(o.createdAt);
        weeklyMapCount[key] = (weeklyMapCount[key] ?? 0) + 1;
    });
    const weeklyData = Object.entries(weeklyMapCount)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-8)
        .map(([week, count]) => ({ week, orders: count }));

    if (orders.isLoading) return (
        <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
        </div>
    );

    if (orders.error) return (
        <div className="p-6 flex items-center gap-2 text-red-400">
            <AlertCircle size={16} /> {orders.error}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total Orders" value={totalOrders} icon={<Package size={16} />} />
                <StatCard
                    label="Pending"
                    value={pendingOrders}
                    icon={<Clock size={16} />}
                    sub={pendingOrders > 0 ? 'Action needed' : 'All clear'}
                />
                <StatCard
                    label="Revenue Collected"
                    value={`$${summary.revenueCollected.toFixed(2)}`}
                    icon={<DollarSign size={16} />}
                    accent
                    sub={`${summary.paidOrderCount} paid orders`}
                />
                <StatCard
                    label="Realized Profit"
                    value={`$${summary.realizedProfit.toFixed(2)}`}
                    icon={<TrendingUp size={16} />}
                    sub={summary.projectedProfit > 0 ? `+$${summary.projectedProfit.toFixed(2)} projected (unpaid)` : 'Paid orders only'}
                />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                    label="Wholesale Owed"
                    value={`$${summary.wholesaleOwed.toFixed(2)}`}
                    icon={<Wallet size={16} />}
                    sub="All non-cancelled portal orders"
                />
                <StatCard
                    label="Completed"
                    value={completedOrders}
                    icon={<CheckCircle2 size={16} />}
                    sub={`${conversionRate}% conversion`}
                />
                <StatCard
                    label="Projected Profit"
                    value={`$${summary.projectedProfit.toFixed(2)}`}
                    icon={<TrendingUp size={16} />}
                    muted
                    sub={`${summary.unpaidOrderCount} unpaid`}
                />
            </div>

            {totalOrders === 0 ? (
                <div
                    className="rounded-2xl border p-12 text-center"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                >
                    <TrendingUp size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        No orders yet. Share your reseller link to start collecting orders!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard title="Orders by Status">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={statusData} barCategoryGap="35%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                                <Tooltip {...tooltipStyle} />
                                <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <rect key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Revenue vs Wholesale (paid, by week)">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={weeklyFinancial}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                                <YAxis stroke="#64748B" fontSize={11} />
                                <Tooltip {...tooltipStyle} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="wholesale" name="Wholesale" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Orders Over Time (by week)">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                                <Tooltip {...tooltipStyle} />
                                <Line
                                    type="monotone" dataKey="orders"
                                    stroke="#06B6D4" strokeWidth={2.5}
                                    dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Export">
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Download order-level revenue, wholesale, and profit for your records.
                        </p>
                        <button
                            type="button"
                            onClick={() => downloadCsv(`reseller-analytics-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsvRows(data))}
                            className="btn btn-outline text-sm px-4 py-2 rounded-xl"
                        >
                            Download CSV
                        </button>
                    </ChartCard>
                </div>
            )}
        </div>
    );
};
