'use client';

import React from 'react';
import type { Product } from '@/lib/productCatalog';
import { effectivePerIdPrice, type PricingMode } from '@/lib/pricing';

interface ProductVariantPickerProps {
    products: Product[];
    selectedId: string;
    onChange: (productId: string) => void;
    compact?: boolean;
    name?: string;
    /** When set, prices match checkout / order form (volume + wholesale tiers). */
    pricingMode?: PricingMode;
    idCount?: number;
}

function variantDisplayPrice(
    product: Product,
    pricingMode?: PricingMode,
    idCount?: number,
): number {
    if (pricingMode != null && idCount != null) {
        return effectivePerIdPrice(product.id, idCount, pricingMode);
    }
    return product.price;
}

export function ProductVariantPicker({
    products,
    selectedId,
    onChange,
    compact = false,
    name = 'product',
    pricingMode,
    idCount,
}: ProductVariantPickerProps) {
    if (products.length <= 1) return null;

    return (
        <fieldset className={compact ? 'space-y-1.5' : 'space-y-2'}>
            <legend className="sr-only">Select ID type</legend>
            {products.map((product) => {
                const checked = selectedId === product.id;
                const price = variantDisplayPrice(product, pricingMode, idCount);
                return (
                    <label
                        key={product.id}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all
                            ${checked
                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.14]'
                            }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={product.id}
                            checked={checked}
                            onChange={() => onChange(product.id)}
                            className="mt-0.5 accent-indigo-500"
                        />
                        <span className="flex-1 min-w-0">
                            <span className={`block text-sm font-medium ${checked ? 'text-white' : 'text-zinc-300'}`}>
                                {product.label}
                            </span>
                            {!compact && product.productionCode && (
                                <span className="block text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">
                                    {product.productionCode} · {product.material}
                                </span>
                            )}
                        </span>
                        <span className="text-price text-sm font-bold tabular-nums flex-shrink-0">
                            ${price.toFixed(2)}
                        </span>
                    </label>
                );
            })}
        </fieldset>
    );
}
