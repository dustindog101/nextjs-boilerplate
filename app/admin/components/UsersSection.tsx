// --- START OF FILE app/admin-dashboard/components/UsersSection.tsx ---
"use client";
import React, { useState, useEffect } from 'react';
import { listAllUsers, adminUpdateUser, User } from '../../../lib/apiClient';
import { Edit, Trash2, X } from 'lucide-react';

// --- Edit User Modal Component ---
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updatedData: Partial<User>) => Promise<void>;
}
const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState<Partial<User>>(user);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(user.userId, editedUser);
    setIsSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setEditedUser(prev => ({ ...prev, [name]: finalValue }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white"><X size={24}/></button>
        <h3 className="text-2xl font-bold text-white mb-4">Edit User: {user.username}</h3>
        <div className="space-y-4 text-gray-300">
            <div>
                <label className="block text-sm font-medium text-gray-400">Role</label>
                <select name="role" value={editedUser.role} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 mt-1">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="flex items-center pt-2">
                <input type="checkbox" id="isReseller" name="isReseller" checked={!!editedUser.isReseller} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>
                <label htmlFor="isReseller" className="ml-2 text-sm font-medium">Is Reseller?</label>
            </div>
            {/* Add more editable fields here in the future, like for discounts */}
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Users Section Component ---
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

  useEffect(() => {
    loadUsers();
  }, []);
  
  const handleSaveUser = async (userId: string, updatedData: Partial<User>) => {
    try {
        await adminUpdateUser(userId, updatedData);
        setEditingUser(null);
        await loadUsers(); // Refresh list after saving
    } catch (err: any) {
        alert(`Failed to save user: ${err.message}`); // Simple feedback for now
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading users...</div>;
  if (error) return <div className="p-6 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
      <h2 className="text-2xl font-bold text-white mb-4">User Management ({users.length})</h2>
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reseller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User ID</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {users.map(user => (
              <tr key={user.userId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isReseller ? 'bg-green-100 text-green-800' : 'bg-gray-600 text-gray-200'}`}>
                    {user.isReseller ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.userId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300 p-1"><Edit size={16}/></button>
                  {/* <button className="text-red-400 hover:text-red-300 p-1 ml-2"><Trash2 size={16}/></button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// --- END OF FILE app/admin-dashboard/components/UsersSection.tsx ---