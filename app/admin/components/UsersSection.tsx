"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminUpdateUser, User } from '../../../lib/apiClient';
import { Edit, X, Search } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

/* ── Edit User Modal ── */
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updatedData: Partial<User>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState<Partial<User>>(user);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(user.discount?.type as 'percentage' | 'fixed' || 'percentage');
  const [discountValue, setDiscountValue] = useState(user.discount?.value || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const updateData: Partial<User> = {
        role: editedUser.role,
        isReseller: editedUser.isReseller,
      };
      if (discountValue > 0) {
        updateData.discount = { type: discountType as 'percentage' | 'fixed', value: discountValue };
      }
      await onSave(user.userId, updateData);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setEditedUser(prev => ({ ...prev, [name]: finalValue }));
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-md relative animate-fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
        <h3 className="text-lg font-bold text-slate-900 mb-5">Edit User: {user.username}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-label mb-1 block">Role</label>
            <select name="role" value={editedUser.role} onChange={handleChange} className={inputCls}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center pt-1">
            <input type="checkbox" id="isReseller" name="isReseller" checked={!!editedUser.isReseller} onChange={handleChange} className="h-4 w-4 rounded bg-slate-50 border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isReseller" className="ml-2 text-sm text-slate-700">Is Reseller?</label>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="text-label mb-2 block">User Discount</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')} className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className={inputCls} min={0} placeholder="0 = none" />
            </div>
          </div>

          {saveError && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{saveError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-outline px-4 py-2 text-sm" disabled={isSaving}>Cancel</button>
            <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Role Badge ── */
const RoleBadge = ({ role }: { role: string }) => {
  const isAdmin = role === 'admin';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
      {role}
    </span>
  );
};

/* ── Main Users Section ── */
export const UsersSection = () => {
  const { users, loadUsers, refreshUsers } = useAdminData();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    if (!users.data) return [];
    if (!search.trim()) return users.data;
    const q = search.toLowerCase();
    return users.data.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users.data, search]);

  const handleSaveUser = async (userId: string, updatedData: Partial<User>) => {
    await adminUpdateUser(userId, updatedData);
    setEditingUser(null);
    await refreshUsers();
  };

  if (users.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (users.error) return <div className="p-6 text-center text-red-500">Error: {users.error}</div>;

  return (
    <div className="p-4 sm:p-6">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          User Management <span className="text-slate-400 font-normal text-sm">({filtered.length})</span>
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Reseller</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Referred By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm font-medium text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-400 font-mono">{user.userId.substring(0, 12)}…</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.isReseller ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {user.isReseller ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                    {user.referredBy || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.discount ? (
                      <span className="text-emerald-600 font-medium">
                        {user.discount.type === 'percentage' ? `${user.discount.value}%` : `$${user.discount.value}`}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button onClick={() => setEditingUser(user)} className="text-blue-500 hover:text-blue-700 p-1 transition-colors"><Edit size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
};