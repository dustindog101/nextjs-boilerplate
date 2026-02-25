"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from './components/ui/Footer';
import { getStorageItem, setStorageItem } from '@/lib/storage';

// ================================
// DATA
// ================================

// --- Featured states ---
const featuredStates = [
    { name: 'Pennsylvania', price: 90, reviews: 127, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
    { name: 'New Jersey', price: 100, reviews: 203, bestSeller: true, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
    { name: 'Old Maine', price: 85, reviews: 94, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
];

// --- Feature badges (SVG icons) ---
const features = [
    { icon: 'package', title: 'Discreet Shipping', desc: 'Arrives in unmarked packaging' },
    { icon: 'shield', title: 'Encrypted Checkout', desc: 'Your info stays private' },
    { icon: 'scan', title: 'Scans & Swipes', desc: 'Works with all barcode scanners' },
    { icon: 'bolt', title: '1-3 Day Turnaround', desc: 'Quick production on every order' },
    { icon: 'wallet', title: 'BTC / Venmo / CashApp', desc: 'Flexible payment options' },
    { icon: 'users', title: 'Group Discounts', desc: 'Better prices for larger orders' },
];

// --- Testimonials ---
const testimonials = [
    { name: 'Jake M.', rating: 5, text: 'Incredible quality and detail. Exceeded my expectations. The holograms and microprint look perfect.' },
    { name: 'Sarah L.', rating: 5, text: 'Fast shipping and professional service. Highly recommend ID Pirate to anyone looking for quality.' },
    { name: 'David K.', rating: 5, text: 'A seamless experience from start to finish. The best in the business, hands down.' },
];

// --- Latest news ---
const latestNews = [
    { date: 'Feb 2026', title: 'New States Added', body: 'Florida and Texas now available with the latest security features.', tag: 'Product' },
    { date: 'Jan 2026', title: 'Faster Turnaround Times', body: 'Most orders now ship within 1-3 business days.', tag: 'Update' },
];

const newsTagColors: Record<string, string> = {
    Product: 'badge-blue',
    Update: 'badge-green',
    Promo: 'badge-amber',
};

// --- FAQ data ---
const faqs = [
    {
        q: 'What security features are included?',
        a: 'Every ID includes scannable barcodes, microprint, UV & OVI holograms, and passes the bend test. Our IDs are crafted to replicate all security features found on real state-issued IDs.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept Bitcoin, Venmo, and CashApp. A small processing fee may apply to non-crypto payments.',
    },
    {
        q: 'How long does shipping take?',
        a: 'Production takes 1-3 business days. Shipping typically adds 7-14 days depending on your location. All orders ship in discreet, unmarked packaging.',
    },
    {
        q: 'Do you offer group discounts?',
        a: 'Yes! The more IDs in your order, the better the price per ID. Group orders are our specialty — reach out or start an order to see pricing.',
    },
    {
        q: 'Do duplicates cost extra?',
        a: 'No — every order comes with a FREE duplicate copy at no additional charge.',
    },
];

// ================================
// ICONS (inline SVGs)
// ================================

function FeatureIcon({ type }: { type: string }) {
    const cls = "h-6 w-6 text-blue-600";
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
                <svg key={i} className={`${starSize} ${i <= rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function CheckIcon() {
    return (
        <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// ================================
// FAQ ACCORDION
// ================================
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 last:border-b-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
            >
                <span className="text-sm sm:text-base font-medium text-slate-800 group-hover:text-slate-900 transition-colors pr-4">{q}</span>
                <svg
                    className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-4' : 'max-h-0'}`}
            >
                <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

// ================================
// STATUS BANNER
// ================================
function StatusBanner() {
    const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
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
        <div className="bg-emerald-50 border-b border-emerald-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                    <span className="font-medium">Accepting orders</span>
                    <span className="hidden sm:inline text-emerald-600">— shipping in 1–3 business days</span>
                </div>
                <button onClick={handleDismiss} className="text-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer p-1" aria-label="Dismiss">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ================================
// HOMEPAGE
// ================================
export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* ---- STATUS BANNER ---- */}
            <StatusBanner />

            {/* ---- HERO ---- */}
            <section className="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 badge badge-blue mb-6 animate-fade-up">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Trusted by 2,000+ customers since 2024
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 animate-fade-up delay-1 tracking-tight">
                        Premium Novelty IDs
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-500 mb-8 max-w-lg mx-auto animate-fade-up delay-2">
                        1:1 replicas with scannable barcodes, UV holograms, and microprint.
                        Discreet shipping on every order.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-3">
                        <Link href="/order" className="btn btn-primary w-full sm:w-auto text-base px-8 py-3">
                            Browse IDs
                        </Link>
                        <Link href="/track" className="btn btn-outline w-full sm:w-auto text-base px-8 py-3">
                            Track Order
                        </Link>
                    </div>

                    {/* Stat counters */}
                    <div className="flex items-center justify-center gap-6 sm:gap-10 mt-10 animate-fade-up delay-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">2,000+</div>
                            <div className="text-xs text-slate-400 mt-0.5">Orders Completed</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">12</div>
                            <div className="text-xs text-slate-400 mt-0.5">States Available</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200" />
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl font-bold text-slate-900">4.9</span>
                                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">Average Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- LATEST UPDATES ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 border-y border-slate-200">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Latest Updates</h2>
                        <Link href="/news" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            View all →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {latestNews.map((item, i) => (
                            <div
                                key={i}
                                className={`card p-4 flex items-start gap-3 animate-fade-up delay-${i + 1}`}
                            >
                                <span className={`badge ${newsTagColors[item.tag] || 'badge-blue'} text-xs mt-0.5`}>{item.tag}</span>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- FEATURE STRIP ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {features.map((f, i) => (
                            <div
                                key={f.title}
                                className={`card card-hover p-4 sm:p-5 animate-fade-up delay-${i + 1}`}
                            >
                                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 mb-3">
                                    <FeatureIcon type={f.icon} />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800 mb-1">{f.title}</h3>
                                <p className="text-xs text-slate-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- TESTIMONIALS ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-slate-50 border-y border-slate-200">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 animate-fade-up">
                            What Our Customers Say
                        </h2>
                        <div className="flex items-center justify-center gap-2 animate-fade-up delay-1">
                            <StarRating rating={5} size="md" />
                            <span className="text-sm text-slate-500">4.9/5 from 500+ reviews</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {testimonials.map((t, i) => (
                            <div key={t.name} className={`card p-5 sm:p-6 animate-fade-up delay-${i + 2}`}>
                                <StarRating rating={t.rating} />
                                <p className="text-sm text-slate-600 mt-3 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                                <div className="text-sm font-semibold text-slate-800">— {t.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- POPULAR STATES ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center animate-fade-up">
                        Popular States
                    </h2>
                    <p className="text-sm text-slate-500 mb-8 text-center animate-fade-up delay-1">
                        Our best sellers — all include scannable barcodes, UV holograms, and a free duplicate.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        {featuredStates.map((state, i) => (
                            <div
                                key={state.name}
                                className={`card card-hover p-5 sm:p-6 flex flex-col relative animate-fade-up delay-${i + 2}`}
                            >
                                {state.bestSeller && (
                                    <span className="absolute top-3 right-3 badge badge-amber text-xs">
                                        ★ Best Seller
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{state.name}</h3>
                                <p className="text-price text-2xl mb-2">${state.price}</p>
                                <div className="flex items-center gap-2 mb-4">
                                    <StarRating rating={5} />
                                    <span className="text-xs text-slate-400">({state.reviews} reviews)</span>
                                </div>
                                <ul className="space-y-2 mb-5 flex-grow">
                                    {state.features.map((feat) => (
                                        <li key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                                            <CheckIcon /> {feat}
                                        </li>
                                    ))}
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> {state.duplicateInfo}
                                    </li>
                                </ul>
                                <Link href="/order" className="btn btn-primary w-full text-sm">
                                    Order Now
                                </Link>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8 animate-fade-up delay-5">
                        <Link href="/order" className="btn btn-outline text-sm px-6">
                            View All States →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- HOW IT WORKS ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-slate-50 border-y border-slate-200">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center animate-fade-up">
                        How It Works
                    </h2>
                    <div className="space-y-6">
                        {[
                            { step: '1', text: 'Pick your state from our collection' },
                            { step: '2', text: 'Upload your photo and enter your details' },
                            { step: '3', text: 'Pay securely with crypto, Venmo, or CashApp' },
                            { step: '4', text: 'Receive your order discreetly in ~2 weeks' },
                        ].map((item, i) => (
                            <div key={item.step} className={`flex items-start gap-4 animate-fade-up delay-${i + 1}`}>
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                    {item.step}
                                </div>
                                <p className="text-base text-slate-600 pt-1">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- FAQ ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 text-center animate-fade-up">
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
            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
