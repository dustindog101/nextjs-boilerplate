"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminCreateDiscount, adminUpdateDiscount, adminDeleteDiscount, Discount, DiscountScope } from '../../../lib/apiClient';
import { Plus, X, Tag, Trash2, Edit, Search, Users, Calendar, Clock, ShoppingCart, Package } from 'lucide-react';
import { Spinner, SortableTh } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';
import { sortRows } from '@/lib/tableSort';
import { useTableSortState } from '@/app/hooks/useTableSort';
import { productSelectGroups, getProductShortLabel } from '@/lib/productCatalog';

const inputCls = "w-full bg-white/[0.04] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm [color-scheme:dark] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 focus:outline-none transition-all";

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
    // NEW: scope + productIds
    const [scope, setScope] = useState<DiscountScope>(existing?.scope || 'cart');
    const [productIds, setProductIds] = useState<string[]>(existing?.productIds || []);
    const [productSearch, setProductSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Memoized product groups from catalog
    const productGroups = useMemo(() => productSelectGroups(), []);

    // Filtered groups based on search
    const filteredGroups = useMemo(() => {
        if (!productSearch.trim()) return productGroups;
        const q = productSearch.toLowerCase();
        return productGroups
            .map(g => ({
                label: g.label,
                options: g.options.filter(o =>
                    o.id.toLowerCase().includes(q) || o.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)
                ),
            }))
            .filter(g => g.options.length > 0);
    }, [productGroups, productSearch]);

    const toggleProduct = (pid: string) => {
        setProductIds(prev =>
            prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
        );
    };

    const handleSubmit = async () => {
        if (!code.trim()) { setError('Code is required.'); return; }
        if (value <= 0) { setError('Value must be greater than 0.'); return; }
        if (discountType === 'percentage' && value > 100) { setError('Percentage cannot exceed 100.'); return; }
        if (scope === 'line_item' && productIds.length === 0) {
            setError('Select at least one product for line-item scope.'); return;
        }
        if (startsAt && expiresAt && new Date(startsAt) >= new Date(expiresAt)) {
            setError('Start date must be before expiration date.'); return;
        }
        setSaving(true);
        setError(null);

        const parsedUsernames = allowedUsernames.trim()
            ? allowedUsernames.split(',').map(u => u.trim().toLowerCase()).filter(Boolean)
            : undefined;

        try {
            const payload = {
                discountType,
                value,
                minOrder,
                maxUses: maxUses ? parseInt(maxUses) : undefined,
                startsAt: startsAt || undefined,
                expiresAt: expiresAt || undefined,
                allowedUsernames: parsedUsernames,
                scope,
                productIds: scope === 'line_item' ? productIds : undefined,
            };

            if (isEdit) {
                // For edits, send undefined fields as null so the backend can REMOVE them
                // (e.g. clearing productIds when switching back to cart scope)
                await adminUpdateDiscount(existing!.code, {
                    ...payload,
                    productIds: scope === 'line_item' ? productIds : null,
                    allowedUsernames: parsedUsernames ?? null,
                    startsAt: startsAt || null,
                    expiresAt: expiresAt || null,
                    maxUses: maxUses ? parseInt(maxUses) : null,
                });
            } else {
                await adminCreateDiscount({
                    code: code.trim().toUpperCase(),
                    ...payload,
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
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl p-6 w-full max-w-lg relative animate-fade-up max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><X size={20} /></button>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-5">{isEdit ? 'Edit Discount' : 'Create Discount Code'}</h3>
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

                    {/* NEW: Scope selector */}
                    <div className="border-t border-[var(--border)] pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package size={14} className="text-[var(--text-tertiary)]" />
                            <label className="text-label">Applies To</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setScope('cart')}
                                className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${scope === 'cart' ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}
                            >
                                <ShoppingCart size={16} className={scope === 'cart' ? 'text-[var(--accent)] mt-0.5' : 'text-[var(--text-tertiary)] mt-0.5'} />
                                <div>
                                    <div className="text-sm font-semibold text-[var(--text-primary)]">Whole cart</div>
                                    <div className="text-xs text-[var(--text-tertiary)]">Discount applies to the entire order total.</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScope('line_item')}
                                className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${scope === 'line_item' ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}
                            >
                                <Package size={16} className={scope === 'line_item' ? 'text-[var(--accent)] mt-0.5' : 'text-[var(--text-tertiary)] mt-0.5'} />
                                <div>
                                    <div className="text-sm font-semibold text-[var(--text-primary)]">Specific products</div>
                                    <div className="text-xs text-[var(--text-tertiary)]">Per-ID discount on selected products in cart.</div>
                                </div>
                            </button>
                        </div>
                        {scope === 'line_item' && (
                            <p className="text-xs text-[var(--text-secondary)] mt-2 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
                                <strong>Per-ID:</strong> Value applies to <em>each matching unit</em> in the cart. E.g. 10% on `PA:STANDARD` × 2 = 10% off each ID, twice.
                            </p>
                        )}
                    </div>

                    {/* NEW: Product picker (only for line_item scope) */}
                    {scope === 'line_item' && (
                        <div className="border border-[var(--border)] rounded-lg p-3 bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-label">Eligible Products</label>
                                <span className="text-xs text-[var(--text-tertiary)]">{productIds.length} selected</span>
                            </div>
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-[var(--border)] rounded-md pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 focus:outline-none"
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto bg-white/[0.02] border border-[var(--border)] rounded-md">
                                {filteredGroups.length === 0 ? (
                                    <div className="p-3 text-sm text-[var(--text-tertiary)] text-center">No products match.</div>
                                ) : (
                                    filteredGroups.map(group => (
                                        <div key={group.label}>
                                            <div className="sticky top-0 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                {group.label}
                                            </div>
                                            {group.options.map(opt => (
                                                <label
                                                    key={opt.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--accent-subtle)] cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={productIds.includes(opt.id)}
                                                        onChange={() => toggleProduct(opt.id)}
                                                        className="rounded border-white/20 bg-white/[0.04] text-[var(--accent)] focus:ring-[var(--accent)]/40"
                                                    />
                                                    <span className="text-sm text-[var(--text-secondary)] font-mono">{opt.id}</span>
                                                    <span className="text-xs text-[var(--text-tertiary)]">— {opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                            {productIds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {productIds.slice(0, 6).map(pid => (
                                        <span key={pid} className="inline-flex items-center gap-1 text-xs bg-[var(--accent-subtle)] text-[var(--accent-hover)] px-2 py-0.5 rounded-full">
                                            {pid}
                                            <button onClick={() => toggleProduct(pid)} className="hover:text-red-400"><X size={10} /></button>
                                        </span>
                                    ))}
                                    {productIds.length > 6 && (
                                        <span className="text-xs text-[var(--text-tertiary)]">+{productIds.length - 6} more</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Min Order + Max Uses */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Min Order ($)</label>
                            <input type="number" value={minOrder} onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)} className={inputCls} min={0} step={0.01} />
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Max Uses <span className="text-[var(--text-tertiary)]">(blank=∞)</span></label>
                            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputCls} min={1} placeholder="Unlimited" />
                        </div>
                    </div>

                    {/* Validity Period */}
                    <div className="border-t border-[var(--border)] pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={14} className="text-[var(--text-tertiary)]" />
                            <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Validity Period</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-label mb-1 block">Starts <span className="text-[var(--text-tertiary)]">(optional)</span></label>
                                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className="text-label mb-1 block">Expires <span className="text-[var(--text-tertiary)]">(optional)</span></label>
                                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Allowed Usernames */}
                    <div className="border-t border-[var(--border)] pt-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={14} className="text-[var(--text-tertiary)]" />
                            <label className="text-label">Restrict to Users <span className="text-[var(--text-tertiary)]">(optional)</span></label>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mb-2">Comma-separated usernames. Leave blank for anyone.</p>
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
                                    <span key={u} className="text-xs bg-[var(--accent-subtle)] text-[var(--accent-hover)] px-2 py-0.5 rounded-full">{u}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{error}</p>}
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

    const { sortKey, direction, toggleSort } = useTableSortState('code', 'asc');

    const sorted = useMemo(() => {
        const tie = (a: Discount, b: Discount) => a.code.localeCompare(b.code);
        return sortRows(
            filtered,
            sortKey,
            direction,
            {
                code: d => d.code,
                type: d => d.discountType,
                value: d =>
                    d.discountType === 'percentage' ? d.value : 1000 + d.value,
                uses: d => d.usedCount,
                status: d => d.isActive,
                window: d => (d.startsAt ? new Date(d.startsAt).getTime() : 0),
                users: d => d.allowedUsernames?.length ?? 0,
                scope: d => d.scope ?? 'cart',
            },
            tie
        );
    }, [filtered, sortKey, direction]);

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
            return { label: 'Scheduled', color: 'bg-amber-500/10 text-amber-400' };
        }
        if (d.expiresAt && new Date(d.expiresAt) < now) {
            return { label: 'Expired', color: 'bg-red-500/10 text-red-400' };
        }
        return null;
    };

    if (discounts.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (discounts.error) return <div className="p-6 text-center text-red-400">Error: {discounts.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {showForm && <DiscountFormModal existing={editingDiscount} onClose={closeForm} onDone={refreshDiscounts} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Discount Codes <span className="text-[var(--text-tertiary)] font-normal text-sm">({sorted.length})</span>
                </h2>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search codes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-44 bg-white/[0.04] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 focus:outline-none transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/[0.04] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none transition-all"
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

            {sorted.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Tag size={32} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-[var(--text-secondary)] mb-1">No discount codes found.</p>
                    <p className="text-[var(--text-tertiary)] text-sm">Create one to offer promotions.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border)]">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <SortableTh
                                        columnKey="code"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Code
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="type"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Type
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="value"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        align="right"
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Value
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="scope"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Scope
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="uses"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        align="right"
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Uses
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="status"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Status
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="window"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Window
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="users"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold text-[var(--text-tertiary)]"
                                    >
                                        Users
                                    </SortableTh>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider" scope="col">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {sorted.map(d => {
                                    const timeStatus = getTimeStatus(d);
                                    return (
                                        <tr key={d.code} className="hover:bg-white/[0.03] transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[var(--text-primary)] font-mono">{d.code}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-tertiary)] capitalize">{d.discountType}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--text-primary)] font-medium">
                                                {d.discountType === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                {(d.scope ?? 'cart') === 'cart' ? (
                                                    <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]">
                                                        <ShoppingCart size={11} /> Cart
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center gap-1 text-[var(--accent)]"
                                                        title={(d.productIds ?? []).join(', ')}
                                                    >
                                                        <Package size={11} />
                                                        {(d.productIds?.length ?? 0)} product{(d.productIds?.length ?? 0) === 1 ? '' : 's'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--text-tertiary)]">
                                                {d.usedCount}{d.maxUses !== undefined ? `/${d.maxUses}` : '/∞'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => toggleActive(d.code, d.isActive)}
                                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${d.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1]'}`}
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
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-tertiary)]">
                                                {d.startsAt || d.expiresAt ? (
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {d.startsAt ? new Date(d.startsAt).toLocaleDateString() : '—'}
                                                        {' → '}
                                                        {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : '∞'}
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-600">Always</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                {d.allowedUsernames && d.allowedUsernames.length > 0 ? (
                                                    <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                                                        {d.allowedUsernames.slice(0, 2).map(u => (
                                                            <span key={u} className="bg-[var(--accent-subtle)] text-[var(--accent-hover)] px-1.5 py-0.5 rounded-full text-xs">{u}</span>
                                                        ))}
                                                        {d.allowedUsernames.length > 2 && (
                                                            <span className="text-[var(--text-tertiary)] text-xs">+{d.allowedUsernames.length - 2}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-600">Anyone</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(d)} className="text-[var(--accent)] hover:text-[var(--accent-hover)] p-1 transition-colors"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(d.code)} className="text-red-400 hover:text-red-300 p-1 transition-colors"><Trash2 size={14} /></button>
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
