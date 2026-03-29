"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminUpdateUser, User } from '../../../lib/apiClient';
import { Edit, X, Search } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

/* ── Shared input style (dark) ── */
const inputCls = "w-full rounded-lg px-4 py-2 text-sm outline-none transition-all focus:ring-2";
const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

/* ── Edit User Modal ── */
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, username: string, updatedData: Partial<User>) => Promise<void>;
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
      } else {
        updateData.discount = undefined;
      }
      await onSave(user.userId, user.username, updateData);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-up" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Edit User: {user.username}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-label mb-1 block">Role</label>
            <select name="role" value={editedUser.role} onChange={handleChange} className={inputCls} style={inputStyle}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center pt-1">
            <input type="checkbox" id="isReseller" name="isReseller" checked={!!editedUser.isReseller} onChange={handleChange} className="h-4 w-4 rounded" style={{ accentColor: 'var(--accent)' }} />
            <label htmlFor="isReseller" className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Is Reseller?</label>
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="text-label mb-2 block">User Discount</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')} className={inputCls} style={inputStyle}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className={inputCls} style={inputStyle} min={0} placeholder="0 = none" />
            </div>
          </div>

          {saveError && <p className="text-red-400 text-sm p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>{saveError}</p>}
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
    <span className="badge" style={isAdmin
      ? { background: 'var(--accent-subtle)', color: 'var(--accent)' }
      : { background: 'rgba(100,116,139,0.15)', color: 'var(--text-tertiary)' }
    }>
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

  const handleSaveUser = async (userId: string, username: string, updatedData: Partial<User>) => {
    await adminUpdateUser(userId, username, updatedData);
    setEditingUser(null);
    await refreshUsers();
  };

  if (users.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (users.error) return <div className="p-6 text-center text-red-400">Error: {users.error}</div>;

  return (
    <div className="p-4 sm:p-6">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          User Management <span className="font-normal text-sm" style={{ color: 'var(--text-tertiary)' }}>({filtered.length})</span>
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Username', 'Role', 'Reseller', 'Referred By', 'Discount', 'Joined', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.userId} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.username}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{user.userId.substring(0, 12)}…</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="badge" style={user.isReseller
                      ? { background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }
                      : { background: 'rgba(100,116,139,0.15)', color: 'var(--text-tertiary)' }
                    }>
                      {user.isReseller ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {user.referredBy || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.discount ? (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {user.discount.type === 'percentage' ? `${user.discount.value}%` : `$${user.discount.value}`}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button onClick={() => setEditingUser(user)} className="p-1 transition-colors" style={{ color: 'var(--accent)' }}>
                      <Edit size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
};