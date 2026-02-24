"use client";
import React, { useState, useEffect } from 'react';
import { adminListDiscounts, adminCreateDiscount, adminUpdateDiscount, adminDeleteDiscount, Discount } from '../../../lib/apiClient';
import { Plus, X, Tag, Trash2 } from 'lucide-react';
import { Spinner } from '../../components/ui';

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all";

/* ── Create Discount Modal ── */
interface CreateModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const CreateDiscountModal: React.FC<CreateModalProps> = ({ onClose, onCreated }) => {
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState(10);
    const [minOrder, setMinOrder] = useState(0);
    const [maxUses, setMaxUses] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!code.trim()) { setError('Code is required.'); return; }
        if (value <= 0) { setError('Value must be greater than 0.'); return; }
        setSaving(true);
        setError(null);
        try {
            await adminCreateDiscount({
                code: code.trim().toUpperCase(),
                discountType,
                value,
                minOrder,
                maxUses: maxUses ? parseInt(maxUses) : undefined,
                expiresAt: expiresAt || undefined,
            });
            onCreated();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass p-6 w-full max-w-md relative animate-fade-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"><X size={20} /></button>
                <h3 className="text-lg font-bold text-white mb-5">Create Discount Code</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-label mb-1 block">Code</label>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} placeholder="e.g. SAVE20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Type</label>
                            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')} className={inputCls}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Value</label>
                            <input type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className={inputCls} min={0} step={discountType === 'percentage' ? 1 : 0.01} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Min Order ($)</label>
                            <input type="number" value={minOrder} onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)} className={inputCls} min={0} step={0.01} />
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Max Uses <span className="text-zinc-600">(blank=∞)</span></label>
                            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputCls} min={1} placeholder="Unlimited" />
                        </div>
                    </div>
                    <div>
                        <label className="text-label mb-1 block">Expires <span className="text-zinc-600">(optional)</span></label>
                        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
                    </div>
                    {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition" disabled={saving}>Cancel</button>
                        <button onClick={handleCreate} className="btn btn-primary px-4 py-2 text-sm" disabled={saving}>
                            {saving ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Section ── */
export const DiscountsSection = () => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const loadDiscounts = async () => {
        setIsLoading(true);
        try {
            const data = await adminListDiscounts();
            setDiscounts(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadDiscounts(); }, []);

    const toggleActive = async (code: string, isActive: boolean) => {
        await adminUpdateDiscount(code, { isActive: !isActive });
        await loadDiscounts();
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`Delete discount code "${code}"?`)) return;
        await adminDeleteDiscount(code);
        await loadDiscounts();
    };

    if (isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (error) return <div className="p-6 text-center text-red-400">Error: {error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {showCreate && <CreateDiscountModal onClose={() => setShowCreate(false)} onCreated={loadDiscounts} />}

            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                    Discount Codes <span className="text-zinc-500 font-normal text-sm">({discounts.length})</span>
                </h2>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary px-3 py-2 text-sm flex items-center gap-1.5">
                    <Plus size={14} /> New Code
                </button>
            </div>

            {discounts.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Tag size={32} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 mb-1">No discount codes yet.</p>
                    <p className="text-zinc-600 text-sm">Create one to offer promotions.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/[0.06]">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Value</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Uses</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Expires</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {discounts.map(d => (
                                    <tr key={d.code} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-white font-mono">{d.code}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400 capitalize">{d.discountType}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white font-medium">
                                            {d.discountType === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-zinc-400">
                                            {d.usedCount}{d.maxUses !== undefined ? `/${d.maxUses}` : '/∞'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleActive(d.code, d.isActive)}
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${d.isActive ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08]'}`}
                                            >
                                                {d.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400">
                                            {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button onClick={() => handleDelete(d.code)} className="text-red-400/60 hover:text-red-400 p-1 transition-colors"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
