// --- START OF FILE app/admin-dashboard/page.tsx (New Layout) ---

"use client";
import React, { useState, useEffect, ReactNode } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { useAuth } from '../hooks/useAuth';
import { listAllUsers, adminUpdateUser, User } from '../../lib/apiClient';

// --- SVG Icons ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M12.586 12.586a2 2 0 1 0 2.828 2.828L22 7V2h-5z"></path><path d="M2 12l6.64 6.64a2 2 0 0 0 2.828 0L22 7"></path></svg>;
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="m15 18-6-6 6-6" /></svg>;
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
// Add any other icons you need for other tabs...

type AdminSection = 'users' | 'orders' | 'discounts';

// --- Reusable Content Pane for each section ---
interface ContentPaneProps {
  title: string;
  children: ReactNode;
  isLoading: boolean;
  error: string | null;
}
const ContentPane: React.FC<ContentPaneProps> = ({ title, children, isLoading, error }) => (
    <div className="p-4 sm:p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{title}</h2>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            {isLoading && <p className="text-center text-gray-400 p-8">Loading...</p>}
            {error && <p className="text-center text-red-400 p-8">Error: {error}</p>}
            {!isLoading && !error && children}
        </div>
    </div>
);

// --- Main Admin Dashboard Page with New Layout ---
function AdminDashboardPage() {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // State for data
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (activeSection === 'users') {
                const userList = await listAllUsers();
                setUsers(userList);
            }
            // Add fetch logic for other sections here
        } catch (err: any) {
            setError(err.message || "Failed to fetch data.");
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [activeSection]);

  const sidebarLinks: { id: AdminSection; name: string; icon: ReactNode }[] = [
    { id: 'users', name: 'Users', icon: <UsersIcon className="h-6 w-6" /> },
    { id: 'orders', name: 'Orders', icon: <PackageIcon className="h-6 w-6" /> },
    { id: 'discounts', name: 'Discounts', icon: <TagIcon className="h-6 w-6" /> },
  ];
  
  const iconProps = { width: 24, height: 24, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter flex">
        {/* Mobile Sidebar Backdrop */}
        <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black/50 z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}></div>
        
        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full bg-gray-800 border-r border-gray-700 z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'lg:w-20'}`}>
            <div className="flex flex-col h-full">
                <div className={`flex items-center p-4 border-b border-gray-700 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    {isSidebarOpen && <a href="/" className="font-pirate-special text-3xl text-white">ID Pirate</a>}
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300">
                        <ChevronLeftIcon {...iconProps} className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
                    </button>
                </div>
                
                <nav className="flex-grow px-2 py-4 space-y-2">
                    {sidebarLinks.map(link => (
                        <button key={link.id} onClick={() => setActiveSection(link.id)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeSection === link.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} ${!isSidebarOpen && 'justify-center'}`}>
                            {React.cloneElement(link.icon as React.ReactElement, iconProps)}
                            {isSidebarOpen && <span className="ml-4 font-semibold">{link.name}</span>}
                        </button>
                    ))}
                </nav>

                <div className="px-2 py-4 border-t border-gray-700">
                     <button onClick={logout} className={`w-full flex items-center p-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/20 ${!isSidebarOpen && 'justify-center'}`}>
                        <LogOutIcon {...iconProps} />
                        {isSidebarOpen && <span className="ml-4 font-semibold">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
            <header className="flex items-center p-4 lg:hidden border-b border-gray-700">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300">
                    <MenuIcon {...iconProps} />
                </button>
                <h1 className="ml-4 text-xl font-semibold text-white">Admin Panel</h1>
            </header>
            
            <main className="flex-grow overflow-y-auto">
                {activeSection === 'users' && (
                    <ContentPane title="User Management" isLoading={isLoading} error={error}>
                        {/* Placeholder for the User table component */}
                        <p className="p-4">Total Users: {users.length}</p>
                        {/* You would map over `users` and render your table here */}
                    </ContentPane>
                )}
                {activeSection === 'orders' && (
                    <ContentPane title="Order Management" isLoading={isLoading} error={error}>
                        <p className="p-4">Orders functionality coming soon.</p>
                    </ContentPane>
                )}
                {activeSection === 'discounts' && (
                    <ContentPane title="Discount Codes" isLoading={isLoading} error={error}>
                        <p className="p-4">Discounts functionality coming soon.</p>
                    </ContentPane>
                )}
            </main>
        </div>
    </div>
  );
}

export default withAdminAuth(AdminDashboardPage);

// --- END OF FILE app/admin-dashboard/page.tsx (New Layout) ---