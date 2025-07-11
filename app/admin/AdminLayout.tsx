// --- START OF FILE app/admin/AdminLayout.tsx (Final Refactored Version) ---
"use client";
import React, { useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Home, Users, Package, Tag, BarChart3, Handshake, ShoppingBag, LogOut, ChevronLeft } from 'lucide-react';

export type AdminSection = 'metrics' | 'users' | 'orders' | 'products' | 'resellers' | 'affiliates' | 'discounts';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection, setActiveSection, isSidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();

  const sidebarLinks = [
    { id: 'metrics', name: 'Metrics', icon: <BarChart3 size={22} /> },
    { id: 'users', name: 'Users', icon: <Users size={22} /> },
    { id: 'orders', name: 'Orders', icon: <Package size={22} /> },
    { id: 'products', name: 'Products', icon: <ShoppingBag size={22} /> },
    { id: 'resellers', name: 'Resellers', icon: <Handshake size={22} /> },
    { id: 'affiliates', name: 'Affiliates', icon: <Users size={22} /> },
    { id: 'discounts', name: 'Discounts', icon: <Tag size={22} /> },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black/60 z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}></div>
      
      {/* Full-Height Sidebar */}
      <aside className={`fixed top-0 left-0 pt-[73px] lg:pt-0 h-full bg-gray-800 border-r border-gray-700 z-20 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'} ${!isSidebarOpen && '-translate-x-full'}`}>
        <div className={`hidden lg:flex items-center p-4 border-b border-gray-700 h-[73px] flex-shrink-0 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700 text-gray-300">
            <ChevronLeft className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
        
        <nav className="flex-grow px-2 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => (
            <button key={link.id} onClick={() => { setActiveSection(link.id); if (window.innerWidth < 1024) { setSidebarOpen(false); } }} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeSection === link.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} ${!isSidebarOpen && 'justify-center'}`} title={link.name}>
              {link.icon}
              {isSidebarOpen && <span className="ml-4 font-semibold">{link.name}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-gray-700 flex-shrink-0">
          <a href="/" className={`w-full flex items-center p-3 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-700 ${!isSidebarOpen && 'justify-center'}`} title="Back to Main Site">
            <Home size={22} />
            {isSidebarOpen && <span className="ml-4 font-semibold">Back to Site</span>}
          </a>
          <button onClick={logout} className={`w-full flex items-center p-3 mt-1 rounded-lg transition-colors text-red-400 hover:text-white hover:bg-red-500/20 ${!isSidebarOpen && 'justify-center'}`} title="Logout">
            <LogOut size={22} />
            {isSidebarOpen && <span className="ml-4 font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
// --- END OF FILE app/admin/AdminLayout.tsx (Final Refactored Version) ---