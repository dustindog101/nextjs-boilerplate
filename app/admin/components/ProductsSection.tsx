"use client";
import React from 'react';
import { VISIBLE_PRODUCTS } from '@/lib/productCatalog';
import { Package } from 'lucide-react';

export const ProductsSection = () => {
    const products = [...VISIBLE_PRODUCTS].sort((a, b) => {
        const region = a.region.localeCompare(b.region);
        if (region !== 0) return region;
        return a.label.localeCompare(b.label);
    });

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        Products <span className="text-[var(--text-tertiary)] font-normal text-sm">({products.length} variants)</span>
                    </h2>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Catalog managed in <code className="text-[var(--text-secondary)] bg-white/[0.04] px-1.5 py-0.5 rounded text-xs">lib/productCatalog.ts</code>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="glass p-4"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                                <Package size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">{product.region}</h3>
                                    <p className="text-xs text-[var(--text-tertiary)] truncate">{product.label}</p>
                                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-1">{product.id}</p>
                                </div>
                            </div>
                            <span className="text-price font-bold flex-shrink-0">
                                ${product.price.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
