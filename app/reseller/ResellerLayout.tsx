"use client";
import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import {
    BarChart3, Package, Link2, Settings, Home, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

export type ResellerSection = 'analytics' | 'orders' | 'link' | 'settings';

interface ResellerLayoutProps {
    children: ReactNode;
    activeSection: ResellerSection;
    setActiveSection: (s: ResellerSection) => void;
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

const NAV: { id: ResellerSection; label: string; icon: React.ReactElement }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    { id: 'link', label: 'My Link', icon: <Link2 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const ResellerLayout: React.FC<ResellerLayoutProps> = ({
    children, activeSection, setActiveSection, isSidebarOpen, setSidebarOpen,
}) => {
    const { logout } = useAuth();

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Mobile backdrop */}
            <div
                onClick={() => setSidebarOpen(false)}
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
            />

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full z-30 flex flex-col
                    transition-all duration-300 ease-in-out
                    lg:relative lg:translate-x-0
                    ${isSidebarOpen ? 'w-60 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
                `}
                style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
            >
                {/* Logo area */}
                <div
                    className={`h-[65px] flex items-center flex-shrink-0 px-4 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    {isSidebarOpen && (
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Reseller Portal
                        </span>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg transition-colors hidden lg:flex items-center justify-center"
                        style={{ color: 'var(--text-secondary)' }}
                        title={isSidebarOpen ? 'Collapse' : 'Expand'}
                    >
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto pt-4">
                    {NAV.map(link => {
                        const active = activeSection === link.id;
                        return (
                            <button
                                key={link.id}
                                onClick={() => {
                                    setActiveSection(link.id);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 border ${!isSidebarOpen && 'justify-center'}`}
                                style={active
                                    ? { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--border-accent)' }
                                    : { color: 'var(--text-secondary)', borderColor: 'transparent' }
                                }
                                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; } }}
                                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = ''; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; } }}
                                title={link.label}
                            >
                                {link.icon}
                                {isSidebarOpen && <span className="ml-3 font-medium text-sm truncate">{link.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom actions */}
                <div className="p-2 flex-shrink-0 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <Link
                        href="/"
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${!isSidebarOpen && 'justify-center'}`}
                        style={{ color: 'var(--text-secondary)' }}
                        title="Back to site"
                    >
                        <Home size={20} />
                        {isSidebarOpen && <span className="ml-3 font-medium text-sm">Back to Site</span>}
                    </Link>
                    <button
                        onClick={logout}
                        className={`w-full flex items-center p-3 rounded-xl transition-colors ${!isSidebarOpen && 'justify-center'}`}
                        style={{ color: 'var(--error)' }}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3 font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
                {children}
            </main>
        </div>
    );
};
