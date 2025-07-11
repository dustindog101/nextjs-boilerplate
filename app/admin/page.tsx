// --- START OF FILE app/admin-dashboard/page.tsx ---

"use client";
import React, { useState, useEffect } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { UniversalHeader } from '../components/UniversalHeader';
import { listAllUsers, adminUpdateUser, User } from '../../lib/apiClient';

// --- SVG Icons ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 12.586a2 2 0 1 0 2.828 2.828L22 7V2h-5z"></path><path d="M2 12l6.64 6.64a2 2 0 0 0 2.828 0L22 7"></path></svg>;
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// --- Edit User Modal Component ---
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updatedData: Partial<User>) => void;
}
const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState<Partial<User>>(user);

  const handleSave = () => {
    onSave(user.userId, editedUser);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }
    setEditedUser(prev => ({ ...prev, [name]: finalValue }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white"><CloseIcon/></button>
        <h3 className="text-2xl font-bold text-white mb-4">Edit User: {user.username}</h3>
        <div className="space-y-4 text-gray-300">
            <div>
                <label className="block text-sm font-medium text-gray-400">Role</label>
                <select name="role" value={editedUser.role} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="isReseller" name="isReseller" checked={!!editedUser.isReseller} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600"/>
                <label htmlFor="isReseller" className="ml-2 text-sm font-medium">Is Reseller?</label>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Admin Dashboard Page ---
function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'discounts'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for data
  const [users, setUsers] = useState<User[]>([]);
  
  // State for modal
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchData = async (tab: 'users' | 'orders' | 'discounts') => {
    setIsLoading(true);
    setError(null);
    try {
      if (tab === 'users') {
        const userList = await listAllUsers();
        setUsers(userList);
      }
      // Add logic for other tabs here later
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);
  
  const handleSaveUser = async (userId: string, updatedData: Partial<User>) => {
    try {
        await adminUpdateUser(userId, updatedData);
        setEditingUser(null); // Close modal on success
        fetchData('users'); // Refresh user list
    } catch (err: any) {
        alert(`Failed to save user: ${err.message}`); // Simple feedback for now
    }
  };

  const renderTabContent = () => {
    if (isLoading) return <p className="text-center text-gray-400 p-8">Loading...</p>;
    if (error) return <p className="text-center text-red-400 p-8">Error: {error}</p>;

    switch (activeTab) {
      case 'users':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.isReseller ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300"><EditIcon/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'orders':
        return <p className="text-center text-gray-500 p-8">Order management coming soon.</p>;
      case 'discounts':
        return <p className="text-center text-gray-500 p-8">Discount management coming soon.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter flex flex-col">
      <UniversalHeader />
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
      
      <main className="container mx-auto p-4 sm:p-8 flex-grow">
        <h2 className="font-pirate-special text-4xl sm:text-5xl font-bold text-white text-center mb-8">
          Admin Dashboard
        </h2>
        
        <div className="mb-8 border-b border-gray-700">
          <nav className="flex justify-center -mb-px space-x-8">
            <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>
              <UsersIcon className="inline-block mr-2"/> Users
            </button>
            <button onClick={() => setActiveTab('orders')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'orders' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>
              <PackageIcon className="inline-block mr-2"/> Orders
            </button>
            <button onClick={() => setActiveTab('discounts')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'discounts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>
              <TagIcon className="inline-block mr-2"/> Discounts
            </button>
          </nav>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          {renderTabContent()}
        </div>
      </main>
      
      <footer className="py-8 text-gray-500 text-sm text-center">
        © {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}

// Protect the page with the admin HOC
export default withAdminAuth(AdminDashboardPage);

// --- END OF FILE app/admin-dashboard/page.tsx ---