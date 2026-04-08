"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminCreateDiscount, adminUpdateDiscount, adminDeleteDiscount, Discount } from '../../../lib/apiClient';
import { Plus, X, Tag, Trash2, Edit, Search, Users, Calendar, Clock } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all";

/* ── Discount Form Modal (shared for create + edit) ── */
interface DiscountFormProps {
    existing?: Discount;
    onClose: () => void;
    onDone: () => void;
}

const DiscountFormModal: React.FC<DiscountFormProps> = ({ existing, onClose, onDone }) => {
    const isEdit = !!existing;
    const [code, setCode] = useState(existing?.code || '');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(existing?.discountType || 'percentage');
    const [value, setValue] = useState(existing?.value || 10);
    const [minOrder, setMinOrder] = useState(existing?.minOrder || 0);
    const [maxUses, setMaxUses] = useState<string>(existing?.maxUses !== undefined ? String(existing.maxUses) : '');
    const [startsAt, setStartsAt] = useState(existing?.startsAt || '');
    const [expiresAt, setExpiresAt] = useState(existing?.expiresAt || '');
    const [allowedUsernames, setAllowedUsernames] = useState(existing?.allowedUsernames?.join(', ') || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!code.trim()) { setError('Code is required.'); return; }
        if (value <= 0) { setError('Value must be greater than 0.'); return; }
        if (startsAt && expiresAt && new Date(startsAt) >= new Date(expiresAt)) {
            setError('Start date must be before expiration date.'); return;
        }
        setSaving(true);
        setError(null);

        const parsedUsernames = allowedUsernames.trim()
            ? allowedUsernames.split(',').map(u => u.trim().toLowerCase()).filter(Boolean)
            : undefined;

        try {
            if (isEdit) {
                await adminUpdateDiscount(existing!.code, {
                    discountType,
                    value,
                    minOrder,
                    maxUses: maxUses ? parseInt(maxUses) : undefined,
                    startsAt: startsAt || undefined,
                    expiresAt: expiresAt || undefined,
                    allowedUsernames: parsedUsernames,
                });
            } else {
                await adminCreateDiscount({
                    code: code.trim().toUpperCase(),
                    discountType,
                    value,
                    minOrder,
                    maxUses: maxUses ? parseInt(maxUses) : undefined,
                    startsAt: startsAt || undefined,
                    expiresAt: expiresAt || undefined,
                    allowedUsernames: parsedUsernames,
                });
            }
            onDone();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-lg relative animate-fade-up max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
                <h3 className="text-lg font-bold text-slate-900 mb-5">{isEdit ? 'Edit Discount' : 'Create Discount Code'}</h3>
                <div className="space-y-4">
                    {/* Code */}
                    <div>
                        <label className="text-label mb-1 block">Code</label>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} placeholder="e.g. SAVE20" disabled={isEdit} />
                    </div>

                    {/* Type + Value */}
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

                    {/* Min Order + Max Uses */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Min Order ($)</label>
                            <input type="number" value={minOrder} onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)} className={inputCls} min={0} step={0.01} />
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Max Uses <span className="text-slate-400">(blank=∞)</span></label>
                            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputCls} min={1} placeholder="Unlimited" />
                        </div>
                    </div>

                    {/* Validity Period */}
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validity Period</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-label mb-1 block">Starts <span className="text-slate-400">(optional)</span></label>
                                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="text-label mb-1 block">Expires <span className="text-slate-400">(optional)</span></label>
                                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Allowed Usernames */}
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={14} className="text-slate-400" />
                            <label className="text-label">Restrict to Users <span className="text-slate-400">(optional)</span></label>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">Comma-separated usernames. Leave blank for anyone.</p>
                        <input
                            type="text"
                            value={allowedUsernames}
                            onChange={(e) => setAllowedUsernames(e.target.value)}
                            className={inputCls}
                            placeholder="e.g. john, jane, vip_customer"
                        />
                        {allowedUsernames.trim() && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {allowedUsernames.split(',').map(u => u.trim()).filter(Boolean).map(u => (
                                    <span key={u} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{u}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="btn btn-outline px-4 py-2 text-sm" disabled={saving}>Cancel</button>
                        <button onClick={handleSubmit} className="btn btn-primary px-4 py-2 text-sm" disabled={saving}>
                            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Section ── */
export const DiscountsSection = () => {
    const { discounts, loadDiscounts, refreshDiscounts } = useAdminData();
    const [showForm, setShowForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => { loadDiscounts(); }, [loadDiscounts]);

    const filtered = useMemo(() => {
        let result = discounts.data || [];
        if (statusFilter === 'active') result = result.filter(d => d.isActive);
        if (statusFilter === 'inactive') result = result.filter(d => !d.isActive);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(d => d.code.toLowerCase().includes(q));
        }
        return result;
    }, [discounts.data, search, statusFilter]);

    const toggleActive = async (code: string, isActive: boolean) => {
        await adminUpdateDiscount(code, { isActive: !isActive });
        await refreshDiscounts();
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`Delete discount code "${code}"?`)) return;
        await adminDeleteDiscount(code);
        await refreshDiscounts();
    };

    const openEdit = (d: Discount) => { setEditingDiscount(d); setShowForm(true); };
    const openCreate = () => { setEditingDiscount(undefined); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditingDiscount(undefined); };

    // Check if a discount is currently in its valid time window
    const getTimeStatus = (d: Discount): { label: string; color: string } | null => {
        const now = new Date();
        if (d.startsAt && new Date(d.startsAt) > now) {
            return { label: 'Scheduled', color: 'bg-amber-50 text-amber-600' };
        }
        if (d.expiresAt && new Date(d.expiresAt) < now) {
            return { label: 'Expired', color: 'bg-red-50 text-red-500' };
        }
        return null;
    };

    if (discounts.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (discounts.error) return <div className="p-6 text-center text-red-500">Error: {discounts.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {showForm && <DiscountFormModal existing={editingDiscount} onClose={closeForm} onDone={refreshDiscounts} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                    Discount Codes <span className="text-slate-400 font-normal text-sm">({filtered.length})</span>
                </h2>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                            type="text"
                            placeholder="Search codes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-44 bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button onClick={openCreate} className="btn btn-primary px-3 py-2 text-sm flex items-center gap-1.5">
                        <Plus size={14} /> New Code
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Tag size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 mb-1">No discount codes found.</p>
                    <p className="text-slate-400 text-sm">Create one to offer promotions.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Value</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Uses</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Window</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(d => {
                                    const timeStatus = getTimeStatus(d);
                                    return (
                                        <tr key={d.code} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 font-mono">{d.code}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 capitalize">{d.discountType}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900 font-medium">
                                                {d.discountType === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-500">
                                                {d.usedCount}{d.maxUses !== undefined ? `/${d.maxUses}` : '/∞'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => toggleActive(d.code, d.isActive)}
                                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${d.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                    >
                                                        {d.isActive ? 'Active' : 'Off'}
                                                    </button>
                                                    {timeStatus && (
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${timeStatus.color}`}>
                                                            {timeStatus.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                                                {d.startsAt || d.expiresAt ? (
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {d.startsAt ? new Date(d.startsAt).toLocaleDateString() : '—'}
                                                        {' → '}
                                                        {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '∞'}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">Always</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                {d.allowedUsernames && d.allowedUsernames.length > 0 ? (
                                                    <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                                                        {d.allowedUsernames.slice(0, 2).map(u => (
                                                            <span key={u} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">{u}</span>
                                                        ))}
                                                        {d.allowedUsernames.length > 2 && (
                                                            <span className="text-slate-400 text-xs">+{d.allowedUsernames.length - 2}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">Anyone</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(d)} className="text-blue-400 hover:text-blue-600 p-1 transition-colors"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(d.code)} className="text-red-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
