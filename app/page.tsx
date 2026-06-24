"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { ALL_REGION_COUNT, lowestPriceForRegion, US_REGION_NAMES } from '@/lib/productCatalog';

// ================================
// DATA
// ================================

const featuredStates = [
    { name: 'Pennsylvania', price: lowestPriceForRegion('Pennsylvania'), reviews: 127, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate', ordersThisWeek: 34 },
    { name: 'New Jersey', price: lowestPriceForRegion('New Jersey'), reviews: 203, bestSeller: true, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate', ordersThisWeek: 67 },
    { name: 'Maine', price: lowestPriceForRegion('Maine'), reviews: 94, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate', ordersThisWeek: 22 },
    { name: 'Florida', price: lowestPriceForRegion('Florida'), reviews: 156, newState: true, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate', ordersThisWeek: 48 },
];

const features = [
    { icon: 'package', title: 'Discreet Shipping', desc: 'Arrives in unmarked packaging' },
    { icon: 'shield', title: 'Encrypted Checkout', desc: 'Your info stays private' },
    { icon: 'scan', title: 'Scans & Swipes', desc: 'Works with all barcode scanners' },
    { icon: 'bolt', title: '1-3 Day Turnaround', desc: 'Quick production on every order' },
    { icon: 'wallet', title: 'BTC / Venmo / CashApp', desc: 'Flexible payment options' },
    { icon: 'users', title: 'Group Discounts', desc: 'Save more on bigger orders' },
];

const testimonials = [
    { name: 'Jake M.', rating: 5, text: 'Incredible quality and detail. The holograms and microprint are absolutely perfect. Exceeded every expectation.', tag: 'Verified Buyer' },
    { name: 'Sarah L.', rating: 5, text: 'Fast shipping and professional service. Received in discreet packaging within 2 weeks. Will order again.', tag: 'Repeat Customer' },
    { name: 'David K.', rating: 5, text: 'Best vendor I\'ve used. Scans perfectly every time. The quality difference is night and day compared to others.', tag: 'Verified Buyer' },
];

const latestNews = [
    { date: 'Feb 2026', title: 'Florida & Texas Now Available', body: 'New state designs with latest 2026 security features.', tag: 'New' },
    { date: 'Feb 2026', title: 'Faster Production', body: 'Most orders now completed in 1-3 business days.', tag: 'Update' },
    { date: 'Jan 2026', title: 'Group Discount Expanded', body: 'Order 4+ IDs and save $20+ per card.', tag: 'Promo' },
];

const newsTagColors: Record<string, string> = {
    New: 'badge-cyan',
    Update: 'badge-green',
    Promo: 'badge-gold',
};

const faqs = [
    { q: 'What security features are included?', a: 'Every ID includes scannable barcodes, microprint, UV & OVI holograms, and passes the bend test. Our IDs are crafted to replicate all security features found on real state-issued IDs.' },
    { q: 'What payment methods do you accept?', a: 'We accept Bitcoin, Venmo, and CashApp. A small processing fee may apply to non-crypto payments.' },
    { q: 'How long does shipping take?', a: 'Production takes 1-3 business days. Shipping typically adds 7-14 days depending on your location. All orders ship in discreet, unmarked packaging.' },
    { q: 'Do you offer group discounts?', a: 'Yes! Order 2+ IDs and save $10/each. Order 4+ and save $20/each. Group orders are our specialty.' },
    { q: 'Do duplicates cost extra?', a: 'No — every order comes with a FREE duplicate copy at no additional charge.' },
];

// State gradient colors for ID card mockups
const stateGradients: Record<string, string> = {
    'Pennsylvania': 'from-blue-600 to-blue-800',
    'New Jersey': 'from-amber-500 to-orange-600',
    'Maine': 'from-emerald-600 to-teal-700',
    'Florida': 'from-orange-500 to-red-500',
    'Texas': 'from-red-600 to-red-800',
    'Washington': 'from-green-600 to-green-800',
    'Oregon': 'from-cyan-600 to-blue-700',
    'South Carolina': 'from-indigo-500 to-indigo-700',
    'Missouri': 'from-sky-600 to-sky-800',
    'Illinois': 'from-blue-500 to-indigo-600',
    'Connecticut': 'from-slate-500 to-slate-700',
    'Arizona': 'from-red-500 to-orange-600',
};

// ================================
// ICONS
// ================================

function FeatureIcon({ type }: { type: string }) {
    const cls = "h-6 w-6 text-[var(--accent)]";
    switch (type) {
        case 'package':
            return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
        case 'shield':
            return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
        case 'scan':
            return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v6h3v-3.75h3v-2.25h-6z" /></svg>;
        case 'bolt':
            return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
        case 'wallet':
            return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110 6h3.75A2.25 2.25 0 0021 13.5v-1.5zm0 0V9.75a2.25 2.25 0 00-2.25-2.25h-13.5A2.25 2.25 0 003 9.75v4.5A2.25 2.25 0 005.25 16.5h13.5A2.25 2.25 0 0021 14.25V12z" /></svg>;
        case 'users':
            return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
        default:
            return null;
    }
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={`${starSize} ${i <= rating ? 'text-[var(--gold)]' : 'text-[var(--text-tertiary)]'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function CheckIcon() {
    return (
        <svg className="h-4 w-4 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// CSS-only ID card mockup
function IdCardMockup({ state, className = '', style }: { state: string; className?: string; style?: React.CSSProperties }) {
    const gradient = stateGradients[state] || 'from-slate-600 to-slate-800';
    return (
        <div className={`id-card-mockup bg-gradient-to-br ${gradient} ${className}`} style={style}>
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div>
                    <div className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Driver License</div>
                    <div className="text-lg font-bold text-white mt-0.5 font-display">{state}</div>
                </div>
                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <div className="h-1.5 w-16 bg-white/20 rounded-full" />
                        <div className="h-1.5 w-24 bg-white/15 rounded-full" />
                        <div className="h-1.5 w-20 bg-white/10 rounded-full" />
                    </div>
                    <div className="w-12 h-14 rounded bg-white/20 border border-white/10" />
                </div>
            </div>
        </div>
    );
}

// ================================
// FAQ ACCORDION
// ================================
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-[var(--border)] last:border-b-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
            >
                <span className="text-sm sm:text-base font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors pr-4">{q}</span>
                <svg
                    className={`h-5 w-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-4' : 'max-h-0'}`}>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

// ================================
// STATUS BANNER
// ================================
function StatusBanner() {
    const [dismissed, setDismissed] = useState(true);
    useEffect(() => {
        const wasDismissed = getStorageItem('idPirateStatusBannerDismissed');
        if (!wasDismissed) setDismissed(false);
    }, []);
    const handleDismiss = () => {
        setDismissed(true);
        setStorageItem('idPirateStatusBannerDismissed', 'true');
    };
    if (dismissed) return null;
    return (
        <div className="bg-gradient-to-r from-[var(--accent-subtle)] via-[var(--bg-secondary)] to-[var(--accent-subtle)] border-b border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
                    <span className="inline-block h-2 w-2 rounded-full bg-[var(--success)] animate-pulse-soft" />
                    <span className="font-medium">Accepting orders</span>
                    <span className="hidden sm:inline text-[var(--text-secondary)]">— shipping in 1–3 business days</span>
                </div>
                <button onClick={handleDismiss} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/[0.06]" aria-label="Dismiss">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ================================
// PAYMENT ICONS
// ================================
function PaymentIcons({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.88 14.54c-.42.42-.94.66-1.54.72v1.24h-1v-1.2c-.4-.02-.8-.1-1.18-.22-.38-.12-.64-.24-.78-.36l.42-1.4c.16.12.38.24.68.36.3.12.6.18.9.2v-2.38l-.32-.12c-.54-.2-.94-.44-1.2-.72-.28-.28-.42-.68-.42-1.2 0-.56.16-1.02.48-1.4.32-.38.78-.6 1.38-.68V8.5h1v1.06c.6.06 1.12.22 1.56.48l-.38 1.36c-.36-.2-.78-.34-1.24-.42v2.2l.34.12c.58.22 1 .46 1.28.74.28.28.42.68.42 1.2 0 .56-.14 1.04-.44 1.3z" /></svg>
                <span className="text-xs font-medium">BTC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm14.27 5.22c.26.43.38.87.38 1.43 0 1.78-1.52 4.09-2.75 5.72H10.7L9.4 6.5l3.1-.29.72 5.78c.67-1.09 1.49-2.81 1.49-3.99 0-.53-.09-.89-.24-1.18l2.8-.6z" /></svg>
                <span className="text-xs font-medium">Venmo</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.64 8.76l-.68.7c-.38-.36-.82-.56-1.3-.56-.36 0-.6.14-.6.4 0 .28.22.38.76.56l.3.1c1.02.36 1.56.82 1.56 1.64 0 1.14-.88 1.86-2.1 1.96v.94h-1.16v-.96c-.72-.1-1.4-.42-1.88-.86l.72-.76c.42.36.88.6 1.4.6.4 0 .68-.16.68-.46s-.2-.42-.78-.6l-.3-.1c-.92-.32-1.54-.74-1.54-1.62 0-1.04.82-1.74 2-1.86V9.5h1.16v.88c.58.08 1.06.28 1.46.58l-.6.8z" /></svg>
                <span className="text-xs font-medium">CashApp</span>
            </div>
        </div>
    );
}

// ================================
// FLOATING SUPPORT BUTTON
// ================================
function FloatingSupport() {
    return (
        <a
            href="https://t.me/idpirate"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed safe-bottom right-4 sm:right-6 z-50 flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all animate-fade-up delay-8"
            aria-label="Chat on Telegram"
        >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
            <span className="text-sm font-semibold hidden sm:inline">Chat on Telegram</span>
        </a>
    );
}

// ================================
// HOMEPAGE
// ================================
export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <StatusBanner />
            <FloatingSupport />

            {/* ---- HERO ---- */}
            <section className="hero-bg noise-overlay relative px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left: Text content */}
                        <div>
                            <div className="inline-flex items-center gap-2 badge badge-cyan mb-6 animate-fade-up">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                Rated 4.9/5 by 500+ customers
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-5 animate-fade-up delay-1 tracking-tight font-display leading-[1.1]">
                                Premium<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-cyan-300">Novelty IDs</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-lg animate-fade-up delay-2 leading-relaxed">
                                1:1 replicas with scannable barcodes, UV holograms, and microprint.
                                Discreet shipping on every order.
                            </p>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-up delay-3">
                                <Link href="/order" className="btn btn-primary w-full sm:w-auto text-base px-8 py-3.5 animate-glow-pulse">
                                    Browse IDs
                                </Link>
                                <Link href="/track" className="btn btn-outline w-full sm:w-auto text-base px-8 py-3.5">
                                    Track Order
                                </Link>
                            </div>

                            {/* Payment icons */}
                            <PaymentIcons className="mt-6 animate-fade-up delay-4" />

                            {/* Stat counters */}
                            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 sm:flex-nowrap sm:justify-start mt-8 animate-fade-up delay-5">
                                <div className="text-center min-w-[88px]">
                                    <div className="text-2xl font-bold text-[var(--text-primary)] font-display">2,000+</div>
                                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Orders Completed</div>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-[var(--border)]" />
                                <div className="text-center min-w-[88px]">
                                    <div className="text-2xl font-bold text-[var(--text-primary)] font-display">{ALL_REGION_COUNT}+</div>
                                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">States Available</div>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-[var(--border)]" />
                                <div className="text-center min-w-[88px]">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-2xl font-bold text-[var(--text-primary)] font-display">4.9</span>
                                        <svg className="h-5 w-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </div>
                                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Average Rating</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Stacked ID card mockups */}
                        <div className="relative hidden lg:flex items-center justify-center h-[400px]">
                            <IdCardMockup
                                state="Pennsylvania"
                                className="absolute animate-float"
                                style={{ transform: 'rotate(-8deg) translateX(-40px) translateY(30px)', zIndex: 1, width: '280px', height: '176px' }}
                            />
                            <IdCardMockup
                                state="New Jersey"
                                className="absolute"
                                style={{ transform: 'rotate(-3deg) translateX(10px) translateY(-10px)', zIndex: 2, width: '300px', height: '188px', boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(6, 182, 212, 0.1)' }}
                            />
                            <IdCardMockup
                                state="Maine"
                                className="absolute"
                                style={{ transform: 'rotate(4deg) translateX(60px) translateY(-50px)', zIndex: 3, width: '260px', height: '164px' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- LATEST UPDATES ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-secondary)] section-border">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider font-display">Latest Updates</h2>
                        <Link href="/news" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
                            View all →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {latestNews.map((item, i) => (
                            <div key={i} className={`card p-4 flex items-start gap-3 animate-fade-up delay-${i + 1}`}>
                                <span className={`badge ${newsTagColors[item.tag] || 'badge-cyan'} text-xs mt-0.5`}>{item.tag}</span>
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- FEATURE STRIP ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {features.map((f, i) => (
                            <div key={f.title} className={`card card-hover p-5 sm:p-6 animate-fade-up delay-${i + 1}`}>
                                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--accent-subtle)] mb-3">
                                    <FeatureIcon type={f.icon} />
                                </div>
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 font-display">{f.title}</h3>
                                <p className="text-xs text-[var(--text-secondary)]">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- POPULAR STATES ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-18 bg-[var(--bg-secondary)] section-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center animate-fade-up font-display">
                        Popular States
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-10 text-center animate-fade-up delay-1">
                        Our best sellers — all include scannable barcodes, UV holograms, and a free duplicate.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {featuredStates.map((state, i) => (
                            <div
                                key={state.name}
                                className={`card card-hover p-0 flex flex-col relative overflow-hidden animate-fade-up delay-${i + 2}`}
                            >
                                {/* Card header with ID mockup */}
                                <div className="relative p-5 pb-3">
                                    {state.bestSeller && (
                                        <span className="absolute top-3 right-3 badge badge-gold text-xs z-10">
                                            ★ Best Seller
                                        </span>
                                    )}
                                    {(state as typeof state & { newState?: boolean }).newState && (
                                        <span className="absolute top-3 right-3 badge badge-cyan text-xs z-10">
                                            ✦ New
                                        </span>
                                    )}
                                    <div className="flex justify-center mb-3">
                                        <IdCardMockup state={state.name} className="transform hover:scale-105 transition-transform" style={{ width: '200px', height: '126px' }} />
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="px-5 pb-5 flex flex-col flex-grow">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-display">{state.name}</h3>

                                    {/* Tiered pricing */}
                                    <div className="mb-3">
                                        <span className="text-price text-xl">${state.price}</span>
                                        <span className="text-xs text-[var(--text-tertiary)] ml-1">/each</span>
                                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                                            2+ IDs: <span className="text-[var(--price)]">${state.price - 10}/ea</span> · 4+ IDs: <span className="text-[var(--price)]">${state.price - 20}/ea</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <StarRating rating={5} />
                                        <span className="text-xs text-[var(--text-tertiary)]">({state.reviews})</span>
                                    </div>

                                    <ul className="space-y-1.5 mb-4 flex-grow">
                                        {state.features.map((feat) => (
                                            <li key={feat} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                <CheckIcon /> {feat}
                                            </li>
                                        ))}
                                        <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                            <CheckIcon /> {state.duplicateInfo}
                                        </li>
                                    </ul>

                                    {/* Social proof */}
                                    <p className="text-xs text-[var(--text-tertiary)] mb-3">
                                        <span className="text-[var(--success)]">●</span> {state.ordersThisWeek} ordered this week
                                    </p>

                                    <Link href="/order" className="btn btn-primary w-full text-sm">
                                        Order Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10 animate-fade-up delay-6">
                        <Link href="/order" className="btn btn-outline text-sm px-6">
                            View All {ALL_REGION_COUNT} States →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- TESTIMONIALS ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 animate-fade-up font-display">
                            What Our Customers Say
                        </h2>
                        <div className="flex items-center justify-center gap-2 animate-fade-up delay-1">
                            <StarRating rating={5} size="md" />
                            <span className="text-sm text-[var(--text-secondary)]">4.9/5 from 500+ reviews</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {testimonials.map((t, i) => (
                            <div key={t.name} className={`card p-5 sm:p-6 animate-fade-up delay-${i + 2}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <StarRating rating={t.rating} />
                                    <span className="badge badge-cyan text-xs">{t.tag}</span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mt-2 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                                <div className="text-sm font-semibold text-[var(--text-primary)] font-display">— {t.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- HOW IT WORKS ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-18 bg-[var(--bg-secondary)] section-border">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-10 text-center animate-fade-up font-display">
                        How It Works
                    </h2>
                    <div className="space-y-0">
                        {[
                            { step: '1', title: 'Choose Your State', text: 'Browse our gallery and pick from 50+ state designs', icon: '🗺️' },
                            { step: '2', title: 'Submit Your Details', text: 'Upload a photo and enter your info securely', icon: '📸' },
                            { step: '3', title: 'Pay Securely', text: 'Choose BTC, Venmo, or CashApp — fully encrypted', icon: '🔐' },
                            { step: '4', title: 'Receive Discreetly', text: 'Ships in unmarked packaging within ~2 weeks', icon: '📦' },
                        ].map((item, i) => (
                            <div key={item.step} className={`flex items-start gap-5 animate-fade-up delay-${i + 1} relative`}>
                                {/* Connector line */}
                                {i < 3 && <div className="absolute left-5 top-12 w-px h-8 bg-[var(--border)]" />}
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-accent)] text-[var(--accent)] flex items-center justify-center text-sm font-bold font-display">
                                    {item.step}
                                </div>
                                <div className="pb-8">
                                    <h3 className="text-base font-semibold text-[var(--text-primary)] font-display">{item.title}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- FAQ ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-8 text-center animate-fade-up font-display">
                        Frequently Asked Questions
                    </h2>
                    <div className="card p-4 sm:p-6 animate-fade-up delay-1">
                        {faqs.map((faq) => (
                            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- FOOTER ---- */}
            <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] pb-20 sm:pb-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {/* Brand */}
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 font-display">
                                <span className="text-[var(--accent)]">ID</span> PIRATE
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                                The premium choice for novelty IDs. Fast turnaround, discreet shipping, all security features included.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-[var(--success)]">
                                <span className="inline-block h-2 w-2 rounded-full bg-[var(--success)] animate-pulse-soft" />
                                Active since 2024
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4 font-display">Quick Links</h4>
                            <nav className="flex flex-col gap-2.5">
                                <Link href="/order" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Browse IDs</Link>
                                <Link href="/track" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Track Order</Link>
                                <Link href="/news" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">News & Updates</Link>
                                <Link href="/account" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">My Account</Link>
                            </nav>
                        </div>

                        {/* States */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4 font-display">Available States</h4>
                            <nav className="flex flex-col gap-1.5">
                                {US_REGION_NAMES.slice(0, 8).map(state => (
                                    <Link key={state} href="/order" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">{state}</Link>
                                ))}
                                {US_REGION_NAMES.length > 8 && (
                                    <Link href="/order" className="text-xs text-[var(--accent)] font-medium">+ {US_REGION_NAMES.length - 8} more</Link>
                                )}
                            </nav>
                        </div>

                        {/* Payment & Legal */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4 font-display">We Accept</h4>
                            <PaymentIcons className="mb-4" />
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-6">
                                <svg className="h-4 w-4 text-[var(--success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-xs">Encrypted Checkout</span>
                            </div>
                            <nav className="flex flex-col gap-2">
                                <Link href="/terms" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">Terms of Service</Link>
                                <Link href="/privacy" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">Privacy Policy</Link>
                            </nav>
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
        </div>
    );
}
