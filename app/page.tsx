"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Footer } from './components/ui/Footer';

// --- Featured states (top 3 sellers, pulled from same data as /order) ---
const featuredStates = [
    { name: 'Pennsylvania', price: 90, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
    { name: 'New Jersey', price: 100, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
    { name: 'Old Maine', price: 85, features: ['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'], duplicateInfo: 'FREE Duplicate' },
];

// --- Feature badges ---
const features = [
    { icon: '📦', title: 'Discreet Shipping', desc: 'Arrives in unmarked packaging' },
    { icon: '🔒', title: 'Encrypted Checkout', desc: 'Your info stays private' },
    { icon: '✅', title: 'Scans & Swipes', desc: 'Works with all barcode scanners' },
    { icon: '⚡', title: '1-3 Day Turnaround', desc: 'Quick production on every order' },
    { icon: '💰', title: 'BTC / Venmo / CashApp', desc: 'Flexible payment options' },
    { icon: '👥', title: 'Group Discounts', desc: 'Better prices for larger orders' },
];

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

// --- FAQ Accordion Item ---
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-white/[0.06] last:border-b-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
            >
                <span className="text-sm sm:text-base font-medium text-zinc-200 group-hover:text-white transition-colors pr-4">{q}</span>
                <svg
                    className={`h-5 w-5 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-4' : 'max-h-0'}`}
            >
                <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

// --- Check icon ---
function Check() {
    return (
        <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// ================================
// HOMEPAGE
// ================================
export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* ---- HERO ---- */}
            <section className="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 sm:pb-20">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="font-pirate text-4xl sm:text-5xl md:text-6xl text-white mb-4 animate-fade-up">
                        ID Pirate
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-100 mb-2 animate-fade-up delay-1">
                        Premium Novelty IDs.
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-100 mb-6 animate-fade-up delay-2">
                        Fast. Private. Scannable.
                    </p>
                    <p className="text-sm sm:text-base text-zinc-400 mb-8 max-w-lg mx-auto animate-fade-up delay-3">
                        1:1 replicas with scannable barcodes, UV holograms, and microprint.
                        Discreet shipping on every order.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-4">
                        <Link href="/order" className="btn btn-primary w-full sm:w-auto text-base px-8 py-3">
                            Browse IDs
                        </Link>
                        <Link href="/track" className="btn btn-outline w-full sm:w-auto text-base px-8 py-3">
                            Track Order
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- FEATURE STRIP ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/[0.04]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {features.map((f, i) => (
                            <div
                                key={f.title}
                                className={`glass glass-hover p-4 sm:p-5 animate-fade-up delay-${i + 1}`}
                            >
                                <div className="text-2xl mb-2">{f.icon}</div>
                                <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                                <p className="text-xs text-zinc-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- POPULAR STATES ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/[0.04]">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center animate-fade-up">
                        Popular States
                    </h2>
                    <p className="text-sm text-zinc-400 mb-8 text-center animate-fade-up delay-1">
                        Our best sellers — all include scannable barcodes, UV holograms, and a free duplicate.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        {featuredStates.map((state, i) => (
                            <div
                                key={state.name}
                                className={`glass glass-hover p-5 sm:p-6 flex flex-col animate-fade-up delay-${i + 2}`}
                            >
                                <h3 className="text-lg font-bold text-white mb-1">{state.name}</h3>
                                <p className="text-price text-2xl mb-4">${state.price}</p>
                                <ul className="space-y-2 mb-5 flex-grow">
                                    {state.features.map((feat) => (
                                        <li key={feat} className="flex items-center gap-2 text-sm text-zinc-300">
                                            <Check /> {feat}
                                        </li>
                                    ))}
                                    <li className="flex items-center gap-2 text-sm text-zinc-300">
                                        <Check /> {state.duplicateInfo}
                                    </li>
                                </ul>
                                <Link href="/order" className="btn btn-primary w-full text-sm">
                                    Order
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
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/[0.04]">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center animate-fade-up">
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
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
                                    {item.step}
                                </div>
                                <p className="text-base text-zinc-300 pt-1">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- FAQ ---- */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-white/[0.04]">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center animate-fade-up">
                        Frequently Asked Questions
                    </h2>
                    <div className="glass p-4 sm:p-6 animate-fade-up delay-1">
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
