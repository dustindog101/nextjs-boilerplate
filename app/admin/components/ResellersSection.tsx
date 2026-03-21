"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminUpdateUser, User } from '../../../lib/apiClient';
import { Edit, X, Percent, Search, Copy, Check, Link2 } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

/* ── Edit Reseller Modal ── */
interface EditModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, data: Partial<User>) => Promise<void>;
}

const EditResellerModal: React.FC<EditModalProps> = ({ user, onClose, onSave }) => {
    const [discountType, setDiscountType] = useState(user.discount?.type || 'percentage');
    const [discountValue, setDiscountValue] = useState(user.discount?.value || 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await onSave(user.userId, {
                discount: { type: discountType as 'percentage' | 'fixed', value: discountValue },
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-md relative animate-fade-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
                <h3 className="text-lg font-bold text-slate-900 mb-5">Reseller Discount — <span className="text-blue-600">{user.username}</span></h3>
                <div className="space-y-4">
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
                            <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className={inputCls} min={0} />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="btn btn-outline px-4 py-2 text-sm" disabled={saving}>Cancel</button>
                        <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Discount'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Copy Subdomain Button ── */
const CopyLinkButton: React.FC<{ username: string }> = ({ username }) => {
    const [copied, setCopied] = useState(false);
    const link = `https://${username}.idpirate.com`;
    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            title={copied ? 'Copied!' : `Copy: ${link}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
        >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Link</>}
        </button>
    );
};

/* ── Main Section ── */
export const ResellersSection = () => {
    const { users, loadUsers, refreshUsers, orders, loadOrders } = useAdminData();
    const [editing, setEditing] = useState<User | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => { loadUsers(); loadOrders(); }, [loadUsers, loadOrders]);

    const resellers = useMemo(() => {
        let result = (users.data || []).filter(u => u.isReseller);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r => r.username.toLowerCase().includes(q));
        }
        return result;
    }, [users.data, search]);

    // Build a map: userId → order count
    const orderCountByUser = useMemo(() => {
        const map: Record<string, number> = {};
        (orders.data || []).forEach((o: any) => {
            if (o.userId) map[o.userId] = (map[o.userId] || 0) + 1;
        });
        return map;
    }, [orders.data]);

    const handleSave = async (userId: string, data: Partial<User>) => {
        await adminUpdateUser(userId, data);
        await refreshUsers();
    };

    if (users.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (users.error) return <div className="p-6 text-center text-red-500">Error: {users.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {editing && <EditResellerModal user={editing} onClose={() => setEditing(null)} onSave={handleSave} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                    Resellers <span className="text-slate-400 font-normal text-sm">({resellers.length})</span>
                </h2>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search resellers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-48 bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {resellers.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Percent size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 mb-1">No resellers found.</p>
                    <p className="text-slate-400 text-sm">Toggle isReseller on a user in the Users section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resellers.map(r => {
                        const orderCount = orderCountByUser[r.userId] || 0;
                        return (
                            <div key={r.userId} className="glass p-4 card-hover">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-slate-900">{r.username}</p>
                                    <button onClick={() => setEditing(r)} className="text-slate-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                                </div>

                                {/* Order count pill */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
                                        <Link2 size={10} /> {orderCount} order{orderCount !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="text-sm text-slate-500 space-y-1 mb-3">
                                    <p>Joined: {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</p>
                                    {r.discount ? (
                                        <p className="text-emerald-600 font-medium">
                                            Discount: {r.discount.type === 'percentage' ? `${r.discount.value}%` : `$${r.discount.value}`}
                                        </p>
                                    ) : (
                                        <p className="text-slate-400">No discount set</p>
                                    )}
                                </div>

                                {/* Copy Subdomain Link */}
                                <CopyLinkButton username={r.username} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
