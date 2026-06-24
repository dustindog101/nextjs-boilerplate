"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Payment methods shown in the footer "We Accept" row.
// Uses the branded SVG logos from /public/payment-logos (official paths,
// correct brand colors) so they render crisp at any size and stay tiny (~1KB each).
const FOOTER_PAYMENT_LOGOS: { src: string; alt: string; h: number; invert?: boolean }[] = [
    { src: '/payment-logos/bitcoin.svg', alt: 'Bitcoin', h: 26 },
    { src: '/payment-logos/litecoin.svg', alt: 'Litecoin', h: 26 },
    { src: '/payment-logos/solana.svg', alt: 'Solana', h: 26 },
    { src: '/payment-logos/usdc.svg', alt: 'USDC', h: 26 },
    { src: '/payment-logos/venmo.svg', alt: 'Venmo', h: 22 },
    { src: '/payment-logos/zelle.svg', alt: 'Zelle', h: 22 },
    { src: '/payment-logos/cash-app.svg', alt: 'Cash App', h: 26 },
    { src: '/payment-logos/apple-pay.svg', alt: 'Apple Pay', h: 24, invert: true },
];

function ShieldCheckIcon() {
    return (
        <svg className="h-4 w-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c-1.1 0-2 .9-2 2v2h4v-2c0-1.1-.9-2-2-2zm6 3h-1v-2c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1z" />
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
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 font-display">
                            <span className="text-[var(--accent)]">ID</span> PIRATE
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            The premium choice for novelty IDs. Fast turnaround, discreet shipping, and
                            all security features included on every order.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 font-display">Quick Links</h4>
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
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 font-display">We Accept</h4>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {FOOTER_PAYMENT_LOGOS.map((logo) => (
                                <span
                                    key={logo.src}
                                    className="inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg bg-white/[0.04] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-white/[0.07] transition-colors"
                                    title={logo.alt}
                                >
                                    <Image
                                        src={logo.src}
                                        alt={logo.alt}
                                        width={logo.h * 2}
                                        height={logo.h * 2}
                                        className={`w-auto object-contain ${logo.invert ? 'brightness-0 invert' : ''}`}
                                        style={{ height: `${logo.h}px` }}
                                        unoptimized
                                    />
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <ShieldCheckIcon />
                            <span>Secure &amp; Encrypted Checkout</span>
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
                    <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
                        <LockIcon />
                        All transactions are encrypted and secure.
                    </p>
                </div>
            </div>
        </footer>
    );
}
