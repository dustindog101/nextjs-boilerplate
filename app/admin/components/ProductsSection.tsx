"use client";
import React, { useState } from 'react';
import { stateOptions, statePrices, defaultIdPrice } from '../../../lib/constants';
import { Package, Check, X as XIcon } from 'lucide-react';

interface ProductState {
    name: string;
    price: number;
    available: boolean;
}

export const ProductsSection = () => {
    const [products, setProducts] = useState<ProductState[]>(
        stateOptions.map(name => ({
            name,
            price: statePrices[name] ?? defaultIdPrice,
            available: true,
        }))
    );
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    const toggleAvailability = (idx: number) => {
        setProducts(prev => prev.map((p, i) =>
            i === idx ? { ...p, available: !p.available } : p
        ));
    };

    const startEdit = (idx: number) => {
        setEditingIdx(idx);
        setEditPrice(String(products[idx].price));
    };

    const savePrice = (idx: number) => {
        const newPrice = parseFloat(editPrice);
        if (!isNaN(newPrice) && newPrice > 0) {
            setProducts(prev => prev.map((p, i) =>
                i === idx ? { ...p, price: newPrice } : p
            ));
        }
        setEditingIdx(null);
    };

    const inputCls = "bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all w-20";

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                    Products <span className="text-zinc-500 font-normal text-sm">({products.length} states)</span>
                </h2>
                <p className="text-xs text-zinc-600">Managed via lib/constants.ts · In-page edits are preview only</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product, idx) => (
                    <div
                        key={product.name}
                        className={`glass p-4 transition-all ${!product.available ? 'opacity-50' : 'hover:border-indigo-500/20'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Package size={16} className={product.available ? 'text-indigo-400' : 'text-zinc-600'} />
                                <h3 className="font-bold text-white text-sm">{product.name}</h3>
                            </div>
                            <button
                                onClick={() => toggleAvailability(idx)}
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${product.available
                                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                    }`}
                            >
                                {product.available ? 'In Stock' : 'Out'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            {editingIdx === idx ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-zinc-500 text-sm">$</span>
                                    <input
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className={inputCls}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && savePrice(idx)}
                                    />
                                    <button onClick={() => savePrice(idx)} className="text-emerald-400 hover:text-emerald-300 transition"><Check size={14} /></button>
                                    <button onClick={() => setEditingIdx(null)} className="text-zinc-500 hover:text-zinc-300 transition"><XIcon size={14} /></button>
                                </div>
                            ) : (
                                <span
                                    className="text-price font-bold cursor-pointer hover:text-white transition-colors"
                                    onClick={() => startEdit(idx)}
                                    title="Click to edit"
                                >
                                    ${product.price.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
