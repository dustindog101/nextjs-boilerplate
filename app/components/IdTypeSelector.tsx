'use client';

import React from 'react';
import { ChevronDownIcon } from './icons';
import { ProductVariantPicker } from './ProductVariantPicker';
import {
    defaultProductForRegion,
    getProduct,
    productsForRegion,
    regionSelectGroups,
    type GallerySection,
} from '@/lib/productCatalog';
import type { PricingMode } from '@/lib/pricing';

function sectionForCategory(category?: string): GallerySection {
    if (category === 'cdl') return 'cdl';
    if (category === 'international') return 'international';
    return 'us';
}

function regionOptionValue(section: GallerySection, region: string) {
    return `${section}::${region}`;
}

function parseRegionOptionValue(value: string): { section: GallerySection; region: string } | null {
    const idx = value.indexOf('::');
    if (idx < 0) return null;
    const section = value.slice(0, idx) as GallerySection;
    const region = value.slice(idx + 2);
    if (!region) return null;
    return { section, region };
}

interface IdTypeSelectorProps {
    productId: string;
    onProductChange: (productId: string) => void;
    variantPickerName?: string;
    pricingMode?: PricingMode;
    idCount?: number;
}

export function IdTypeSelector({
    productId,
    onProductChange,
    variantPickerName,
    pricingMode,
    idCount,
}: IdTypeSelectorProps) {
    const product = getProduct(productId);
    const region = product?.region ?? '';
    const section = sectionForCategory(product?.category);
    const selectValue = region ? regionOptionValue(section, region) : '';
    const variantProducts = region ? productsForRegion(region, section) : [];
    const groups = regionSelectGroups();

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const parsed = parseRegionOptionValue(e.target.value);
        if (!parsed) return;
        onProductChange(defaultProductForRegion(parsed.region, parsed.section));
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <select
                    value={selectValue}
                    onChange={handleRegionChange}
                    aria-label="Select state or region"
                    className="w-full rounded-xl px-4 py-3 text-sm appearance-none [color-scheme:dark]
                        bg-white/[0.06] border border-[var(--border)] text-[var(--text-primary)]
                        focus:ring-2 focus:ring-[var(--accent)]/35 focus:border-[var(--accent)]/50 focus:outline-none transition"
                >
                    {groups.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                            {group.options.map((opt) => (
                                <option
                                    key={regionOptionValue(opt.section, opt.region)}
                                    value={regionOptionValue(opt.section, opt.region)}
                                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                >
                                    {opt.region}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {variantProducts.length > 1 && (
                <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Variant
                    </p>
                    <ProductVariantPicker
                        products={variantProducts}
                        selectedId={productId}
                        onChange={onProductChange}
                        name={variantPickerName}
                        pricingMode={pricingMode}
                        idCount={idCount}
                    />
                </div>
            )}
        </div>
    );
}
