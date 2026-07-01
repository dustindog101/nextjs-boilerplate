"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


// --- Payment Method Icons (inline SVGs) ---
function BitcoinIcon() {
    return (
        <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.88 14.54c-.42.42-.94.66-1.54.72v1.24h-1v-1.2c-.4-.02-.8-.1-1.18-.22-.38-.12-.64-.24-.78-.36l.42-1.4c.16.12.38.24.68.36.3.12.6.18.9.2v-2.38l-.32-.12c-.54-.2-.94-.44-1.2-.72-.28-.28-.42-.68-.42-1.2 0-.56.16-1.02.48-1.4.32-.38.78-.6 1.38-.68V8.5h1v1.06c.6.06 1.12.22 1.56.48l-.38 1.36c-.36-.2-.78-.34-1.24-.42v2.2l.34.12c.58.22 1 .46 1.28.74.28.28.42.68.42 1.2 0 .56-.14 1.04-.44 1.3zm-.88-4.56V10.1c-.26.06-.44.16-.56.3-.12.14-.18.3-.18.5 0 .18.06.32.16.42.1.1.3.22.58.34v.32zm.32 2.1c.14-.14.2-.32.2-.54 0-.18-.06-.34-.18-.44-.12-.12-.3-.22-.56-.34v2c.26-.08.42-.2.54-.34z" />
        </svg>
    );
}

function VenmoIcon() {
    return (
        <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm14.27 5.22c.26.43.38.87.38 1.43 0 1.78-1.52 4.09-2.75 5.72H10.7L9.4 6.5l3.1-.29.72 5.78c.67-1.09 1.49-2.81 1.49-3.99 0-.53-.09-.89-.24-1.18l2.8-.6z" />
        </svg>
    );
}

function CashAppIcon() {
    return (
        <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.64 8.76l-.68.7c-.38-.36-.82-.56-1.3-.56-.36 0-.6.14-.6.4 0 .28.22.38.76.56l.3.1c1.02.36 1.56.82 1.56 1.64 0 1.14-.88 1.86-2.1 1.96v.94h-1.16v-.96c-.72-.1-1.4-.42-1.88-.86l.72-.76c.42.36.88.6 1.4.6.4 0 .68-.16.68-.46s-.2-.42-.78-.6l-.3-.1c-.92-.32-1.54-.74-1.54-1.62 0-1.04.82-1.74 2-1.86V9.5h1.16v.88c.58.08 1.06.28 1.46.58l-.6.8z" />
        </svg>
    );
}

function ShieldCheckIcon() {
    return (
        <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}

interface FooterProps {
    className?: string;
}

export function Footer({ className = '' }: FooterProps) {
    const pathname = usePathname();
    // Hide all branding on white-label reseller checkout routes
    if (pathname.startsWith('/r/')) return null;

    return (
        <footer className={`border-t border-[var(--border)] bg-[var(--bg-secondary)] ${className}`}>

            {/* Main footer content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Column 1: Brand */}
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-display">
                            <span className="text-[var(--accent)]">ID</span> PIRATE
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            The premium choice for novelty IDs. Fast turnaround, discreet shipping, and
                            all security features included on every order.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide mb-3 font-display">Quick Links</h4>
                        <nav className="flex flex-col gap-2">
                            <Link href="/order" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Browse IDs</Link>
                            <Link href="/track" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Track Order</Link>
                            <Link href="/news" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">News & Updates</Link>
                            <Link href="/account" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">My Account</Link>
                            <Link href="/terms" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Terms of Service</Link>
                            <Link href="/privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Privacy Policy</Link>
                        </nav>
                    </div>

                    {/* Column 3: Payment & Security */}
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide mb-3 font-display">We Accept</h4>
                        <div className="flex items-center gap-3 mb-4">
                            <BitcoinIcon />
                            <VenmoIcon />
                            <CashAppIcon />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <ShieldCheckIcon />
                            <span>Secure & Encrypted Checkout</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[var(--border)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-[var(--text-tertiary)]">
                        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                        All transactions are encrypted and secure.
                    </p>
                </div>
            </div>
        </footer>
    );
}
