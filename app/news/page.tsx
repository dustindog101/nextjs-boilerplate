"use client";
import React from 'react';
import Link from 'next/link';
import { Footer } from '../components/ui';

const updates = [
    {
        date: 'Feb 2026',
        title: 'New States Added',
        body: 'Florida and Texas are now available with the latest security features including UV & OVI holograms.',
        tag: 'Product',
    },
    {
        date: 'Jan 2026',
        title: 'Faster Turnaround Times',
        body: 'We\'ve upgraded our production pipeline. Most orders now ship within 1-3 business days.',
        tag: 'Update',
    },
    {
        date: 'Jan 2026',
        title: 'Group Order Discounts',
        body: 'Orders of 4+ IDs now receive automatic discounts at checkout. The more you order, the more you save.',
        tag: 'Promo',
    },
    {
        date: 'Dec 2025',
        title: 'Improved Security Features',
        body: 'All IDs now include enhanced microprint, updated holographic overlays, and improved barcode scanning.',
        tag: 'Product',
    },
];

const tagColors: Record<string, string> = {
    Product: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Update: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Promo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function NewsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                <header className="mb-10 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight animate-fade-up">
                        News & Updates
                    </h1>
                    <p className="mt-3 text-sm text-zinc-400 animate-fade-up delay-1">
                        Latest product updates, new states, and announcements.
                    </p>
                </header>

                <div className="space-y-4">
                    {updates.map((item, i) => (
                        <article
                            key={i}
                            className={`glass p-5 sm:p-6 animate-fade-up`}
                            style={{ animationDelay: `${75 * (i + 1)}ms` }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${tagColors[item.tag] || tagColors.Update}`}>
                                    {item.tag}
                                </span>
                                <span className="text-xs text-zinc-500">{item.date}</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">{item.title}</h2>
                            <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <Link href="/order" className="btn btn-primary px-6 py-2.5 text-sm">
                        Browse IDs
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
