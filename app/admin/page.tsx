// --- START OF FILE app/admin-dashboard/page.tsx (Final Corrected Version) ---

"use client";
import React, { useState, useEffect, ReactNode } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { useAuth } from '../hooks/useAuth';
import { listAllUsers, adminUpdateUser, User } from '../../lib/apiClient';

// --- Type-Safe SVG Icon Components ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M12.586 12.586a2 2 0 1 0 2.828 2.828L22 7V2h-5z"></path><path d="M2 12l6.64 6.64a2 2 0 0 0 2.828 0L22 7"></path></svg>;
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="m15 18-6-6 6-6" /></svg>;
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// --- Type Definitions for the Page ---
type AdminSection = 'users' | 'orders' | 'discounts';

interface SidebarLink {
  id: AdminSection;
  name: string;
  icon: React.ReactElement;
}

// --- Edit User Modal Component ---
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updatedData: Partial<User>) => void;
}
const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState<Partial<User>>(user);

  const handleSave = () => { onSave(user.userId, editedUser); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setEditedUser(prev => ({ ...prev, [name]: finalValue }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white"><CloseIcon width="24" height="24" strokeWidth="2"/></button>
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
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
            </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Admin Dashboard Page with New Layout ---
function AdminDashboardPage() {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (activeSection === 'users') {
                const userList = await listAllUsers();
                setUsers(userList);
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch data.");
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [activeSection]);

  const handleSaveUser = async (userId: string, updatedData: Partial<User>) => {
    try {
        await adminUpdateUser(userId, updatedData);
        setEditingUser(null);
        const userList = await listAllUsers();
        setUsers(userList);
    } catch (err: any) {
        alert(`Failed to save user: ${err.message}`);
    }
  };
  
  const iconProps: React.SVGProps<SVGSVGElement> = {
    width: 24, height: 24, fill: "none", stroke: "currentColor",
    strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"
  };

  // --- THE FIX IS HERE ---
  // We explicitly type the array to ensure `link.id` is of type `AdminSection`.
  const sidebarLinks: SidebarLink[] = [
    { id: 'users', name: 'Users', icon: <UsersIcon {...iconProps} /> },
    { id: 'orders', name: 'Orders', icon: <PackageIcon {...iconProps} /> },
    { id: 'discounts', name: 'Discounts', icon: <TagIcon {...iconProps} /> },
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter flex">
        {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
        <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black/50 z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}></div>
        
        <aside className={`fixed top-0 left-0 h-full bg-gray-800 border-r border-gray-700 z-40 flex flex-col transition-all duration-300 ease-in-out lg:relative ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className={`flex items-center p-4 border-b border-gray-700 h-[73px] flex-shrink-0 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {isSidebarOpen && <a href="/" className="font-pirate-special text-3xl text-white">ID Pirate</a>}
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300">
                    <ChevronLeftIcon {...iconProps} className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
                </button>
            </div>
            
            <nav className="flex-grow px-2 py-4 space-y-2">
                {sidebarLinks.map(link => (
                    <button key={link.id} onClick={() => setActiveSection(link.id)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeSection === link.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} ${!isSidebarOpen && 'justify-center'}`}>
                        {link.icon}
                        {isSidebarOpen && <span className="ml-4 font-semibold">{link.name}</span>}
                    </button>
                ))}
            </nav>

            <div className="px-2 py-4 border-t border-gray-700 flex-shrink-0">
                 <button onClick={logout} className={`w-full flex items-center p-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/20 ${!isSidebarOpen && 'justify-center'}`}>
                    <LogOutIcon {...iconProps} />
                    {isSidebarOpen && <span className="ml-4 font-semibold">Logout</span>}
                </button>
            </div>
        </aside>

        <div className="flex-1 flex flex-col max-w-full overflow-hidden">
            <header className="flex items-center p-4 lg:hidden border-b border-gray-700 h-[73px] flex-shrink-0">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300">
                    <MenuIcon {...iconProps} />
                </button>
                <h1 className="ml-4 text-xl font-semibold text-white">Admin Panel</h1>
            </header>
            
            <main className="flex-grow overflow-y-auto p-4 sm:p-6">
                {activeSection === 'users' && (
                    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                        {isLoading && <p className="text-center text-gray-400 p-8">Loading users...</p>}
                        {error && <p className="text-center text-red-400 p-8">Error: {error}</p>}
                        {!isLoading && !error && (
                            <div className="overflow-x-auto">
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.isReseller ? 'Yes' : 'No'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.userId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300"><EditIcon width="20" height="20" strokeWidth="2"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {activeSection === 'orders' && <p className="text-center p-8">Order management coming soon.</p>}
                {activeSection === 'discounts' && <p className="text-center p-8">Discount management coming soon.</p>}
            </main>
        </div>
    </div>
  );
}

export default withAdminAuth(AdminDashboardPage);

// --- END OF FILE app/admin-dashboard/page.tsx (Final Corrected Version) ---