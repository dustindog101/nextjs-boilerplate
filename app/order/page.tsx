"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Footer } from '../components/ui';
import {
    buildRegionGallery,
    lowestPriceForRegion,
    regionHasPremium,
    STATE_GRADIENTS,
    type GallerySection,
    type RegionGalleryEntry,
} from '@/lib/productCatalog';
import { retailEffectiveAtCount, RESELLER_WHOLESALE_TIERS } from '@/lib/pricing';
import { ProductVariantPicker } from '@/app/components/ProductVariantPicker';
import { defaultIdPrice } from '@/lib/constants';

const GALLERY = buildRegionGallery();
const EXAMPLE_LIST_PRICE = lowestPriceForRegion('Pennsylvania') || defaultIdPrice;

type FilterTab = 'all' | 'popular' | 'new' | 'premium' | GallerySection;

function CheckIcon() {
    return (
        <svg className="h-4 w-4 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg className="h-4 w-4 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

function IdCardMockup({ region, className = '' }: { region: string; className?: string }) {
    const gradient = STATE_GRADIENTS[region] || 'from-slate-600 to-slate-800';
    return (
        <div className={`id-card-mockup w-full max-w-[280px] h-[175px] mx-auto bg-gradient-to-br ${gradient} ${className} group-hover:scale-105 transition-transform duration-500`}>
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div>
                    <div className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Driver License</div>
                    <div className="text-xl font-bold text-white mt-1 font-display tracking-tight line-clamp-2">{region}</div>
                </div>
                <div className="flex items-end justify-between">
                    <div className="space-y-1.5">
                        <div className="h-2 w-20 bg-white/20 rounded-full" />
                        <div className="h-1.5 w-28 bg-white/15 rounded-full" />
                        <div className="h-1.5 w-24 bg-white/10 rounded-full" />
                    </div>
                    <div className="w-14 h-16 rounded bg-white/20 border border-white/10 shadow-sm" />
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
        </div>
    );
}

function RegionCard({ entry, index }: { entry: RegionGalleryEntry; index: number }) {
    const defaultId = entry.products[0]?.id ?? '';
    const [selectedId, setSelectedId] = useState(defaultId);
    const selected = entry.products.find((p) => p.id === selectedId) ?? entry.products[0];
    const fromPrice = lowestPriceForRegion(entry.region, entry.section);
    const showFrom = entry.products.length > 1;
    const price = selected?.price ?? fromPrice;
    const hasPremium = entry.section === 'us' && regionHasPremium(entry.region);

    return (
        <div
            className="card group flex flex-col relative overflow-hidden animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 75, 600)}ms` }}
        >
            {entry.popular && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="badge badge-gold text-[10px] uppercase shadow-md">Best Seller</span>
                </div>
            )}
            {entry.new && !entry.popular && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="badge badge-cyan text-[10px] uppercase shadow-md">New Updates</span>
                </div>
            )}
            {hasPremium && !entry.popular && !entry.new && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="badge badge-cyan text-[10px] uppercase shadow-md">Premium</span>
                </div>
            )}
            {entry.section === 'cdl' && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="badge badge-gold text-[10px] uppercase shadow-md">CDL</span>
                </div>
            )}
            {entry.section === 'international' && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="badge badge-cyan text-[10px] uppercase shadow-md">International</span>
                </div>
            )}

            <div className="p-5 pb-2 bg-gradient-to-b from-transparent to-[var(--bg-hover)]/30 w-full flex items-center justify-center min-h-[220px]">
                <IdCardMockup region={entry.region} />
            </div>

            <div className="p-5 pt-4 flex flex-col flex-grow border-t border-[var(--border)] group-hover:border-[var(--border-hover)] transition-colors">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-display">{entry.region}</h3>
                    <div className="flex items-center gap-1 bg-[var(--bg-secondary)] px-2 py-1 rounded-md">
                        <StarIcon />
                        <span className="text-xs font-bold text-[var(--text-primary)]">4.9</span>
                    </div>
                </div>

                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                    {entry.section === 'cdl' ? 'Commercial driver license' : entry.section === 'international' ? 'UK polycarbonate IDs' : '2026 design · Free duplicate'}
                </p>

                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 mb-3 border border-[var(--border)]">
                    <div className="flex items-end gap-1.5 mb-1.5">
                        {showFrom && entry.products.length > 1 && selectedId === defaultId ? (
                            <>
                                <span className="text-xs text-[var(--text-tertiary)]">from</span>
                                <span className="text-price text-xl leading-none">${fromPrice}</span>
                            </>
                        ) : (
                            <span className="text-price text-xl leading-none">${price}</span>
                        )}
                        <span className="text-xs text-[var(--text-secondary)] font-medium">/ 1 ID</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-1.5 border-t border-[var(--border)]/50 mt-1.5">
                        <span>2–3 IDs: <strong className="text-[var(--price)]">${retailEffectiveAtCount(price, 2)}</strong></span>
                        <span>4+ IDs: <strong className="text-[var(--price)]">${retailEffectiveAtCount(price, 4)}</strong></span>
                    </div>
                </div>

                {entry.products.length > 1 && (
                    <div className="mb-4">
                        <p className="text-label mb-2">ID type</p>
                        <ProductVariantPicker
                            products={entry.products}
                            selectedId={selectedId}
                            onChange={setSelectedId}
                            compact
                            name={`variant-${entry.region}-${entry.section}`}
                        />
                    </div>
                )}

                <ul className="space-y-1.5 flex-grow mb-5">
                    {['Scannable Barcodes', 'Microprint', 'UV & OVI Holo'].map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                            <CheckIcon /> {feat}
                        </li>
                    ))}
                    <li className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                        <CheckIcon /> Includes Free Duplicate
                    </li>
                </ul>

                <Link
                    href={`/order/new?product=${encodeURIComponent(selected?.id ?? defaultId)}`}
                    className="btn btn-primary w-full shadow-md"
                >
                    Customize & Order
                </Link>
            </div>
        </div>
    );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-6 mt-4 first:mt-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">{title}</h2>
            {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
        </div>
    );
}

export default function OrderGalleryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<FilterTab>('all');
    const [sort, setSort] = useState<'alpha' | 'price-low' | 'price-high'>('alpha');

    const filteredEntries = useMemo(() => {
        let result = [...GALLERY];

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(
                (e) =>
                    e.region.toLowerCase().includes(q) ||
                    e.products.some((p) => p.label.toLowerCase().includes(q)),
            );
        }

        if (filter === 'popular') result = result.filter((e) => e.popular);
        if (filter === 'new') result = result.filter((e) => e.new);
        if (filter === 'premium') {
            result = result.filter((e) => e.section === 'us' && regionHasPremium(e.region));
        }
        if (filter === 'us' || filter === 'cdl' || filter === 'international') {
            result = result.filter((e) => e.section === filter);
        }

        switch (sort) {
            case 'alpha':
                result.sort((a, b) => a.region.localeCompare(b.region));
                break;
            case 'price-low':
                result.sort(
                    (a, b) =>
                        lowestPriceForRegion(a.region, a.section) - lowestPriceForRegion(b.region, b.section),
                );
                break;
            case 'price-high':
                result.sort(
                    (a, b) =>
                        lowestPriceForRegion(b.region, b.section) - lowestPriceForRegion(a.region, a.section),
                );
                break;
        }

        return result;
    }, [searchTerm, filter, sort]);

    const usEntries = filteredEntries.filter((e) => e.section === 'us');
    const cdlEntries = filteredEntries.filter((e) => e.section === 'cdl');
    const intlEntries = filteredEntries.filter((e) => e.section === 'international');
    const showSections = filter === 'all' && !searchTerm;

    const renderGrid = (entries: RegionGalleryEntry[], offset = 0) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {entries.map((entry, i) => (
                <RegionCard key={`${entry.section}-${entry.region}`} entry={entry} index={offset + i} />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow w-full">
            <div className="text-center mb-10 max-w-3xl mx-auto animate-fade-up">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4 font-display">
                    Select Your ID
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-secondary)]">
                    All &apos;{new Date().getFullYear()}&apos; designs pass in-state. Free duplicate included with every order.
                </p>
            </div>

            <div className="glass p-5 sm:p-6 mb-10 max-w-3xl mx-auto animate-fade-up delay-1">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Order more, save more</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Volume discounts apply automatically at checkout — add more IDs to one order to unlock lower per-ID pricing.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-sm">
                    {[
                        { label: '1 ID', count: 1 },
                        { label: '2–3 IDs', count: 2 },
                        { label: '4+ IDs', count: 4 },
                    ].map((col) => (
                        <div
                            key={col.label}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-3 sm:px-3"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{col.label}</p>
                            <p className="text-price text-lg sm:text-xl font-bold">
                                ${retailEffectiveAtCount(EXAMPLE_LIST_PRICE, col.count)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] mt-0.5">per ID · PA example</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-10 p-2 sm:p-0 bg-[var(--bg-elevated)] sm:bg-transparent rounded-2xl animate-fade-up delay-1">
                <div className="relative w-full lg:w-72">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search states or ID types..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] sm:bg-[var(--bg-elevated)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative flex items-center gap-2 p-1.5 bg-[var(--bg-secondary)] sm:bg-[var(--bg-elevated)] rounded-xl w-full lg:w-auto overflow-x-auto scroll-fade-x">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'us', label: 'US States' },
                        { id: 'premium', label: 'Premium' },
                        { id: 'cdl', label: 'CDL' },
                        { id: 'international', label: 'International' },
                        { id: 'popular', label: '★ Popular' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as FilterTab)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === tab.id
                                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full lg:w-48 relative">
                    <select
                        className="w-full appearance-none pl-4 pr-10 py-2.5 bg-[var(--bg-secondary)] sm:bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm font-medium"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as typeof sort)}
                    >
                        <option value="alpha">Sort: A-Z</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)] pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </div>
            </div>

            {filteredEntries.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)]">
                    <div className="text-[var(--text-tertiary)] mb-3">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No results found</h3>
                    <p className="text-[var(--text-secondary)] mt-1">Try adjusting your search or filters.</p>
                    <button
                        onClick={() => { setSearchTerm(''); setFilter('all'); }}
                        className="btn btn-outline mt-6"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : showSections ? (
                <div className="space-y-10">
                    {usEntries.length > 0 && (
                        <section>
                            <SectionHeading title="United States" subtitle="Standard and polycarbonate variants where available" />
                            {renderGrid(usEntries)}
                        </section>
                    )}
                    {cdlEntries.length > 0 && (
                        <section>
                            <SectionHeading title="Commercial (CDL)" subtitle="Polycarbonate commercial driver licenses" />
                            {renderGrid(cdlEntries, usEntries.length)}
                        </section>
                    )}
                    {intlEntries.length > 0 && (
                        <section>
                            <SectionHeading title="International" subtitle="UK polycarbonate IDs" />
                            {renderGrid(intlEntries, usEntries.length + cdlEntries.length)}
                        </section>
                    )}
                </div>
            ) : (
                renderGrid(filteredEntries)
            )}

            <div className="mt-16 sm:mt-20 card p-6 sm:p-8 bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-secondary)] relative overflow-hidden animate-fade-up border-[var(--border-accent)]">
                <div className="absolute right-0 bottom-0 opacity-10 blur-xl pointer-events-none transform translate-x-1/4 translate-y-1/4">
                    <svg className="w-64 h-64 text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.64 8.76l-.68.7c-.38-.36-.82-.56-1.3-.56-.36 0-.6.14-.6.4 0 .28.22.38.76.56l.3.1c1.02.36 1.56.82 1.56 1.64 0 1.14-.88 1.86-2.1 1.96v.94h-1.16v-.96c-.72-.1-1.4-.42-1.88-.86l.72-.76c.42.36.88.6 1.4.6.4 0 .68-.16.68-.46s-.2-.42-.78-.6l-.3-.1c-.92-.32-1.54-.74-1.54-1.62 0-1.04.82-1.74 2-1.86V9.5h1.16v.88c.58.08 1.06.28 1.46.58l-.6.8z" /></svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex badge badge-gold mb-3 text-xs">Reseller Program</div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] font-display mb-2">Need 10+ IDs?</h2>
                        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
                            Join our reseller program for wholesale pricing from ${RESELLER_WHOLESALE_TIERS[0].perId}/ID (up to ${RESELLER_WHOLESALE_TIERS[RESELLER_WHOLESALE_TIERS.length - 1].perId}/ID at 20+), priority production, and dedicated Telegram support.
                        </p>
                    </div>
                    <a href="https://t.me/idpirate" target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-shrink-0 w-full md:w-auto">
                        Contact Sales on Telegram
                    </a>
                </div>
            </div>
        </div>
        <Footer />
        </div>
    );
}
