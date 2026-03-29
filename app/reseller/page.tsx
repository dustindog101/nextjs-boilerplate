"use client";
import React, { useState } from 'react';
import { withResellerAuth } from '../components/withResellerAuth';
import { ResellerDataProvider } from './ResellerDataContext';
import { ResellerLayout, ResellerSection } from './ResellerLayout';
import { AnalyticsSection } from './components/AnalyticsSection';
import { ResellerOrdersSection } from './components/ResellerOrdersSection';
import { LinkSection } from './components/LinkSection';
import { SettingsSection } from './components/SettingsSection';
import { useAuth } from '../hooks/useAuth';

// ─── Top bar (mirrors admin) ──────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
    const { user } = useAuth();
    return (
        <header
            className="sticky top-0 z-30 h-[65px] flex items-center px-4 sm:px-6 gap-4 justify-between flex-shrink-0"
            style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
        >
            {/* hamburger — mobile only */}
            <button
                onClick={onMenuClick}
                className="p-2 rounded-lg transition-colors lg:hidden"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Toggle sidebar"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
                <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                    {user?.username}
                </span>
                <span
                    className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)', background: 'var(--accent-subtle)' }}
                >
                    Reseller
                </span>
            </div>
        </header>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function ResellerDashboard() {
    const [activeSection, setActiveSection] = useState<ResellerSection>('analytics');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderSection = () => {
        switch (activeSection) {
            case 'analytics': return <AnalyticsSection />;
            case 'orders': return <ResellerOrdersSection />;
            case 'link': return <LinkSection />;
            case 'settings': return <SettingsSection />;
            default: return <AnalyticsSection />;
        }
    };

    return (
        <ResellerDataProvider>
            <div className="font-inter flex flex-col h-screen admin-dark">
                <TopBar onMenuClick={() => setSidebarOpen(v => !v)} />
                <ResellerLayout
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isSidebarOpen={isSidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                >
                    {renderSection()}
                </ResellerLayout>
            </div>
        </ResellerDataProvider>
    );
}

export default withResellerAuth(ResellerDashboard);
