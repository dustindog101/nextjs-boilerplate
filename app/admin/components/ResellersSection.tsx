"use client";
import React, { useState, useEffect } from 'react';
import { listAllUsers, adminUpdateUser, User } from '../../../lib/apiClient';
import { Edit, X, Percent } from 'lucide-react';
import { Spinner } from '../../components/ui';

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

    const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass p-6 w-full max-w-md relative animate-fade-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"><X size={20} /></button>
                <h3 className="text-lg font-bold text-white mb-5">Reseller Discount — <span className="text-indigo-400">{user.username}</span></h3>
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
                    {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition" disabled={saving}>Cancel</button>
                        <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Discount'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Section ── */
export const ResellersSection = () => {
    const [resellers, setResellers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<User | null>(null);

    const loadResellers = async () => {
        setIsLoading(true);
        try {
            const users = await listAllUsers();
            setResellers(users.filter(u => u.isReseller));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadResellers(); }, []);

    const handleSave = async (userId: string, data: Partial<User>) => {
        await adminUpdateUser(userId, data);
        await loadResellers();
    };

    if (isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (error) return <div className="p-6 text-center text-red-400">Error: {error}</div>;

    return (
        <div className="p-4 sm:p-6">
            {editing && <EditResellerModal user={editing} onClose={() => setEditing(null)} onSave={handleSave} />}

            <h2 className="text-lg font-bold text-white mb-5">
                Resellers <span className="text-zinc-500 font-normal text-sm">({resellers.length})</span>
            </h2>

            {resellers.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Percent size={32} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 mb-1">No resellers yet.</p>
                    <p className="text-zinc-600 text-sm">Toggle isReseller on a user in the Users section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resellers.map(r => (
                        <div key={r.userId} className="glass p-4 hover:border-indigo-500/20 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-white">{r.username}</p>
                                <button onClick={() => setEditing(r)} className="text-zinc-500 hover:text-indigo-400 transition-colors"><Edit size={14} /></button>
                            </div>
                            <div className="text-sm text-zinc-400 space-y-1">
                                <p>Joined: {new Date(r.createdAt).toLocaleDateString()}</p>
                                {r.discount ? (
                                    <p className="text-emerald-400 font-medium">
                                        Discount: {r.discount.type === 'percentage' ? `${r.discount.value}%` : `$${r.discount.value}`}
                                    </p>
                                ) : (
                                    <p className="text-zinc-600">No custom discount set</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
