"use client";
import React from 'react';
import { newsItems } from '../../../lib/news';
import { Newspaper, ExternalLink, Eye, EyeOff } from 'lucide-react';

const tagColors: Record<string, string> = {
    Product: 'bg-blue-50 text-blue-600 border-blue-200',
    Update: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Promo: 'bg-amber-50 text-amber-600 border-amber-200',
};

export const NewsSection = () => {
    const published = newsItems.filter(n => n.published).length;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        News & Updates{' '}
                        <span className="text-slate-400 font-normal text-sm">
                            ({published} published · {newsItems.length} total)
                        </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Managed in <code className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-xs">lib/news.ts</code> — edit the file to add/update articles
                    </p>
                </div>
                <a
                    href="/news"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline px-3 py-2 text-sm flex items-center gap-1.5 w-fit"
                >
                    <ExternalLink size={14} /> View Public Page
                </a>
            </div>

            {newsItems.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Newspaper size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 mb-1">No news items yet.</p>
                    <p className="text-slate-400 text-sm">Add items in <code>lib/news.ts</code>.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {newsItems.map((item) => {
                        const tag = tagColors[item.tag] || tagColors.Update;
                        return (
                            <div
                                key={item.id}
                                className={`glass p-4 sm:p-5 transition-all ${!item.published ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${tag}`}>
                                                {item.tag}
                                            </span>
                                            <span className="text-xs text-slate-400">{item.date}</span>
                                            {item.published ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                                    <Eye size={12} /> Published
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <EyeOff size={12} /> Draft
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit guide */}
            <div className="glass p-4 mt-6 border-dashed">
                <h4 className="text-sm font-bold text-slate-700 mb-2">How to edit news</h4>
                <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
                    <li>Open <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">lib/news.ts</code></li>
                    <li>Add, edit, or remove entries in the <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">newsItems</code> array</li>
                    <li>Set <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">published: false</code> to hide an item</li>
                    <li>Deploy — changes go live instantly</li>
                </ol>
            </div>
        </div>
    );
};
