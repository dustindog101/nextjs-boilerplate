"use client";
import React, { useState, useEffect } from 'react';
import { listAllUsers, adminUpdateUser, User } from '../../../lib/apiClient';
import { Edit, X } from 'lucide-react';
import { Spinner } from '../../components/ui';

/* ── Edit User Modal ── */
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updatedData: Partial<User>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState<Partial<User>>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(user.userId, editedUser);
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

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass p-6 w-full max-w-md relative animate-fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"><X size={20} /></button>
        <h3 className="text-lg font-bold text-white mb-5">Edit User: {user.username}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-label mb-1 block">Role</label>
            <select name="role" value={editedUser.role} onChange={handleChange} className={inputCls}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center pt-1">
            <input type="checkbox" id="isReseller" name="isReseller" checked={!!editedUser.isReseller} onChange={handleChange} className="h-4 w-4 rounded bg-white/[0.04] border-white/[0.08] text-indigo-500 focus:ring-indigo-600" />
            <label htmlFor="isReseller" className="ml-2 text-sm text-zinc-300">Is Reseller?</label>
          </div>
          {saveError && (
            <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{saveError}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition" disabled={isSaving}>Cancel</button>
            <button onClick={handleSave} className="btn btn-primary px-4 py-2 text-sm" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Users Section ── */
export const UsersSection = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const userList = await listAllUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSaveUser = async (userId: string, updatedData: Partial<User>) => {
    await adminUpdateUser(userId, updatedData);
    setEditingUser(null);
    await loadUsers();
  };

  if (isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-6 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
      <h2 className="text-lg font-bold text-white mb-4">User Management <span className="text-zinc-500 font-normal text-sm">({users.length})</span></h2>
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.06]">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Username</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reseller</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">User ID</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map(user => (
                <tr key={user.userId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-zinc-400">{user.role}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.isReseller ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.04] text-zinc-500'}`}>
                      {user.isReseller ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-600 font-mono">{user.userId}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <button onClick={() => setEditingUser(user)} className="text-indigo-400 hover:text-indigo-300 p-1 transition-colors"><Edit size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};