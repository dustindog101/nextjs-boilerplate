// --- START OF FILE app/admin-dashboard/AdminLayout.tsx ---

"use client";
import React, { useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// --- Icon Imports ---
// We'll define a generic IconProps type for consistency
type IconProps = React.SVGProps<SVGSVGElement>;

// A selection of icons for the sidebar
const HomeIcon = (props: IconProps) => <svg {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const UsersIcon = (props: IconProps) => <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const PackageIcon = (props: IconProps) => <svg {...props}><path d="M4.87 4.87A2 2 0 0 1 6.34 4h11.32a2 2 0 0 1 1.47.59l3.29 3.29a2 2 0 0 1 .58 1.41V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.29a2 2 0 0 1 .58-1.41l3.29-3.29Z" /><path d="M8 4v4" /><path d="M16 4v4" /><path d="M21.12 8H2.88" /></svg>;
const TagIcon = (props: IconProps) => <svg {...props}><path d="M12.586 12.586a2 2 0 1 0 2.828 2.828L22 7V2h-5z" /><path d="M2 12l6.64 6.64a2 2 0 0 0 2.828 0L22 7" /></svg>;
const BarChartIcon = (props: IconProps) => <svg {...props}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;
const ShoppingBagIcon = (props: IconProps) => <svg {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const HandshakeIcon = (props: IconProps) => <svg {...props}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5" /><path d="M4 14a2 2 0 1 1-4 0" /><path d="m18 18 2 2a1 1 0 1 0 3-3" /><path d="m21 15-2.5-2.5" /><path d="M12 7.5a2.5 2.5 0 0 1 5 0" /><path d="M10 14a2 2 0 1 1-4 0" /><path d="M17 11.5a2.5 2.5 0 0 1 5 0" /><path d="M3 10s-1 2-2 2" /><path d="M22 10s-1 2-2 2" /></svg>;
const LogOutIcon = (props: IconProps) => <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const MenuIcon = (props: IconProps) => <svg {...props}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;
const ChevronLeftIcon = (props: IconProps) => <svg {...props}><path d="m15 18-6-6 6-6" /></svg>;

export type AdminSection = 'metrics' | 'users' | 'orders' | 'products' | 'resellers' | 'affiliates' | 'discounts';

interface SidebarLink {
  id: AdminSection;
  name: string;
  icon: React.ReactElement;
}

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection, setActiveSection }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const iconProps: IconProps = {
    width: 22, height: 22, fill: "none", stroke: "currentColor",
    strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"
  };

  const sidebarLinks: SidebarLink[] = [
    { id: 'metrics', name: 'Metrics', icon: <BarChartIcon {...iconProps} /> },
    { id: 'users', name: 'Users', icon: <UsersIcon {...iconProps} /> },
    { id: 'orders', name: 'Orders', icon: <PackageIcon {...iconProps} /> },
    { id: 'products', name: 'Products', icon: <ShoppingBagIcon {...iconProps} /> },
    { id: 'resellers', name: 'Resellers', icon: <HandshakeIcon {...iconProps} /> },
    { id: 'affiliates', name: 'Affiliates', icon: <UsersIcon {...iconProps} /> },
    { id: 'discounts', name: 'Discounts', icon: <TagIcon {...iconProps} /> },
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter flex">
      {/* Mobile Sidebar Backdrop */}
      <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black/60 z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}></div>
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-gray-800 border-r border-gray-700 z-40 flex flex-col transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20 -translate-x-full'}`}>
        <div className={`flex items-center p-4 border-b border-gray-700 h-[73px] flex-shrink-0 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen && <a href="/" className="font-pirate-special text-3xl text-white">ID Pirate</a>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hidden lg:block">
            <ChevronLeftIcon {...iconProps} className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
        
        <nav className="flex-grow px-2 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => (
            <button key={link.id} onClick={() => { setActiveSection(link.id); setSidebarOpen(false); }} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeSection === link.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} ${!isSidebarOpen && 'justify-center'}`}>
              {link.icon}
              {isSidebarOpen && <span className="ml-4 font-semibold">{link.name}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-gray-700 flex-shrink-0">
          <a href="/" className={`w-full flex items-center p-3 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-700 ${!isSidebarOpen && 'justify-center'}`}>
            <HomeIcon {...iconProps} />
            {isSidebarOpen && <span className="ml-4 font-semibold">Back to Site</span>}
          </a>
          <button onClick={logout} className={`w-full flex items-center p-3 mt-1 rounded-lg transition-colors text-red-400 hover:text-white hover:bg-red-500/20 ${!isSidebarOpen && 'justify-center'}`}>
            <LogOutIcon {...iconProps} />
            {isSidebarOpen && <span className="ml-4 font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-full overflow-hidden">
        <header className="flex items-center justify-between p-4 lg:hidden border-b border-gray-700 h-[73px] flex-shrink-0 bg-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300">
            <MenuIcon {...iconProps} />
          </button>
          <span className="text-xl font-semibold text-white">{sidebarLinks.find(l => l.id === activeSection)?.name}</span>
          <div className="w-8"></div> {/* Spacer */}
        </header>
        
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
// --- END OF FILE app/admin-dashboard/AdminLayout.tsx ---