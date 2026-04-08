"use client";
import React from 'react';
import Link from 'next/link';
import { Footer } from '../components/ui';
import { newsItems } from '../../lib/news';

const tagColors: Record<string, string> = {
    Product: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Update: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Promo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function NewsPage() {
    const published = newsItems.filter(n => n.published);

    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                <header className="mb-10 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight animate-fade-up">
                        News & Updates
                    </h1>
                    <p className="mt-3 text-sm text-[var(--text-secondary)] animate-fade-up delay-1">
                        Latest product updates, new states, and announcements.
                    </p>
                </header>

                <div className="space-y-4">
                    {published.map((item, i) => (
                        <article
                            key={item.id}
                            className={`glass p-5 sm:p-6 animate-fade-up`}
                            style={{ animationDelay: `${75 * (i + 1)}ms` }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${tagColors[item.tag] || tagColors.Update}`}>
                                    {item.tag}
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)]">{item.date}</span>
                            </div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">{item.title}</h2>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.body}</p>
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
