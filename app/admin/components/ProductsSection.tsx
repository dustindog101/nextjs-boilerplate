"use client";
import React from 'react';
import { stateOptions, statePrices, defaultIdPrice } from '../../../lib/constants';
import { Package } from 'lucide-react';

export const ProductsSection = () => {
    const products = stateOptions.map(name => ({
        name,
        price: statePrices[name] ?? defaultIdPrice,
    }));

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Products <span className="text-slate-400 font-normal text-sm">({products.length} states)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Prices managed in <code className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-xs">lib/constants.ts</code>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product) => (
                    <div
                        key={product.name}
                        className="glass p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package size={16} className="text-blue-500" />
                                <h3 className="font-bold text-slate-900 text-sm">{product.name}</h3>
                            </div>
                            <span className="text-price font-bold">
                                ${product.price.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
