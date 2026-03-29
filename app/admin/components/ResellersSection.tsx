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
    onSave: (userId: string, username: string, data: Partial<User>) => Promise<void>;
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
            await onSave(user.userId, user.username, {
                discount: { type: discountType as 'percentage' | 'fixed', value: discountValue },
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const fieldStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-up" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <button onClick={onClose} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}><X size={20} /></button>
                <h3 className="text-lg font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
                    Reseller Discount — <span style={{ color: 'var(--accent)' }}>{user.username}</span>
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-label mb-1 block">Type</label>
                            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-label mb-1 block">Value</label>
                            <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={fieldStyle} min={0} />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>{error}</p>}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={copied
                ? { background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }
                : { background: 'var(--accent-subtle)', color: 'var(--accent)' }
            }
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

    const orderCountByUser = useMemo(() => {
        const map: Record<string, number> = {};
        (orders.data || []).forEach((o: any) => {
            if (o.userId) map[o.userId] = (map[o.userId] || 0) + 1;
        });
        return map;
    }, [orders.data]);

    const handleSave = async (userId: string, username: string, data: Partial<User>) => {
        await adminUpdateUser(userId, username, data);
        await refreshUsers();
    };

    if (users.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (users.error) return <div className="p-6 text-center text-red-400">Error: {users.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {editing && <EditResellerModal user={editing} onClose={() => setEditing(null)} onSave={handleSave} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Resellers <span className="font-normal text-sm" style={{ color: 'var(--text-tertiary)' }}>({resellers.length})</span>
                </h2>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search resellers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-48 rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                </div>
            </div>

            {resellers.length === 0 ? (
                <div className="card p-8 text-center">
                    <Percent size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>No resellers found.</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Toggle isReseller on a user in the Users section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resellers.map(r => {
                        const orderCount = orderCountByUser[r.userId] || 0;
                        return (
                            <div key={r.userId} className="card card-hover p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.username}</p>
                                    <button onClick={() => setEditing(r)} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}><Edit size={14} /></button>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                        <Link2 size={10} /> {orderCount} order{orderCount !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="text-sm space-y-1 mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    <p>Joined: {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</p>
                                    {r.discount ? (
                                        <p style={{ color: 'var(--success)', fontWeight: 600 }}>
                                            Discount: {r.discount.type === 'percentage' ? `${r.discount.value}%` : `$${r.discount.value}`}
                                        </p>
                                    ) : (
                                        <p style={{ color: 'var(--text-tertiary)' }}>No discount set</p>
                                    )}
                                </div>

                                <CopyLinkButton username={r.username} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
