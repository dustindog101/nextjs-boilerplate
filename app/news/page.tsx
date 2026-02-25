"use client";
import React from 'react';
import Link from 'next/link';
import { Footer } from '../components/ui';
import { newsItems } from '../../lib/news';

const tagColors: Record<string, string> = {
    Product: 'bg-blue-50 text-blue-600 border-blue-200',
    Update: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Promo: 'bg-amber-50 text-amber-600 border-amber-200',
};

export default function NewsPage() {
    const published = newsItems.filter(n => n.published);

    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                <header className="mb-10 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight animate-fade-up">
                        News & Updates
                    </h1>
                    <p className="mt-3 text-sm text-slate-500 animate-fade-up delay-1">
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
                                <span className="text-xs text-zinc-500">{item.date}</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
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
