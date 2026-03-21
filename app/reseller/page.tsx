"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { withResellerAuth } from '../components/withResellerAuth';
import { ResellerDataProvider } from './ResellerDataContext';
import { ResellerOrdersSection } from './components/ResellerOrdersSection';
import { useResellerData } from './ResellerDataContext';
import { BarChart3, Package, Home, LogOut, Copy, Check, ShieldCheck } from 'lucide-react';
import { Footer } from '../components/ui';

// ─── Sidebar navigation sections ─────────────────────────────────────────────

type Section = 'overview' | 'orders';

// ─── Stat card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
    <div className={`bg-white rounded-xl border ${highlight ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'} p-5`}>
        <div className="flex items-center gap-2 text-slate-400 mb-3">
            {icon}
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p>
    </div>
);

// ─── Overview Section ─────────────────────────────────────────────────────────

const OverviewSection: React.FC<{ subdomain: string }> = ({ subdomain }) => {
    const { orders, loadOrders } = useResellerData();
    const [copied, setCopied] = useState(false);
    const resellerLink = `https://${subdomain}.idpirate.com`;

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const totalOrders = orders.data?.length ?? 0;
    const totalRevenue = orders.data?.reduce((s, o) => s + (o.price?.total ?? 0), 0) ?? 0;
    const pendingOrders = orders.data?.filter(o => o.status === 'pending').length ?? 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(resellerLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Reseller Link Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-blue-900">Your Reseller Link</h3>
                </div>
                <p className="text-xs text-blue-600 mb-3">Share this link with your customers to take orders.</p>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-700 truncate">{resellerLink}</code>
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Orders" value={totalOrders} icon={<Package size={16} />} />
                <StatCard label="Pending" value={pendingOrders} icon={<Package size={16} />} />
                <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<BarChart3 size={16} />} highlight />
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function ResellerDashboard() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Derive subdomain from username (same slug used in the URL)
    const subdomain = user?.username ?? '';

    const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={20} /> },
        { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    ];

    return (
        <ResellerDataProvider>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-[65px] flex items-center px-4 sm:px-6 gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(v => !v)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                        <span className="font-bold text-slate-900">Reseller Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="hidden sm:block">{user?.username}</span>
                        <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500" title="Back to site">
                            <Home size={16} />
                        </Link>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <aside className={`${isSidebarOpen ? 'w-56' : 'w-0 overflow-hidden'} lg:w-56 bg-white border-r border-slate-200 flex flex-col transition-[width] duration-200 ease-in-out flex-shrink-0`}>
                        <nav className="flex-1 p-3 space-y-1">
                            {nav.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="p-3 border-t border-slate-200">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            {/* Show Overview section */}
                            {activeSection === 'overview' && <OverviewSection subdomain={subdomain} />}
                            {/* Show Orders section */}
                            {activeSection === 'orders' && <ResellerOrdersSection />}
                        </div>
                        <Footer />
                    </main>
                </div>
            </div>
        </ResellerDataProvider>
    );
}

export default withResellerAuth(ResellerDashboard);
