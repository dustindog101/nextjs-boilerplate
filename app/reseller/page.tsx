"use client";
import React, { useState, useLayoutEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { withResellerAuth } from '../components/withResellerAuth';
import { ResellerDataProvider } from './ResellerDataContext';
import { ResellerLayout, ResellerSection } from './ResellerLayout';
import { Spinner } from '../components/ui/Spinner';
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

const VALID_SECTIONS: ResellerSection[] = ['analytics', 'orders', 'link', 'settings'];

function isValidSection(s: string | null): s is ResellerSection {
    return s !== null && VALID_SECTIONS.includes(s as ResellerSection);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function ResellerDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [activeSection, setActiveSectionState] = useState<ResellerSection>('analytics');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useLayoutEffect(() => {
        const s = searchParams.get('section');
        if (isValidSection(s)) {
            setActiveSectionState(s);
        }
    }, [searchParams]);

    const setActiveSection = useCallback(
        (s: ResellerSection) => {
            setActiveSectionState(s);
            const q = new URLSearchParams();
            q.set('section', s);
            router.replace(`${pathname}?${q.toString()}`, { scroll: false });
        },
        [pathname, router]
    );

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

function ResellerPageWithSuspense() {
    return (
        <Suspense
            fallback={
                <div
                    className="min-h-screen flex items-center justify-center admin-dark"
                    style={{ background: 'var(--bg-primary)' }}
                >
                    <Spinner size="lg" />
                </div>
            }
        >
            <ResellerDashboard />
        </Suspense>
    );
}

export default withResellerAuth(ResellerPageWithSuspense);
