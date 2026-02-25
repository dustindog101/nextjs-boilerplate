"use client";
import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Home, Users, Package, Tag, BarChart3, Handshake, ShoppingBag, LogOut, Newspaper, Settings } from 'lucide-react';

export type AdminSection = 'metrics' | 'users' | 'orders' | 'products' | 'resellers' | 'affiliates' | 'discounts' | 'news' | 'settings';

interface SidebarLink {
  id: AdminSection;
  name: string;
  icon: React.ReactElement;
}

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection, setActiveSection, isSidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();

  const sidebarLinks: SidebarLink[] = [
    { id: 'metrics', name: 'Metrics', icon: <BarChart3 size={20} /> },
    { id: 'users', name: 'Users', icon: <Users size={20} /> },
    { id: 'orders', name: 'Orders', icon: <Package size={20} /> },
    { id: 'products', name: 'Products', icon: <ShoppingBag size={20} /> },
    { id: 'resellers', name: 'Resellers', icon: <Handshake size={20} /> },
    { id: 'affiliates', name: 'Affiliates', icon: <Users size={20} /> },
    { id: 'discounts', name: 'Discounts', icon: <Tag size={20} /> },
    { id: 'news', name: 'News', icon: <Newspaper size={20} /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}></div>

      {/* Full-Height Sidebar */}
      <aside className={`fixed top-0 left-0 pt-[73px] lg:pt-0 h-full bg-white border-r border-slate-200 z-30 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'} ${!isSidebarOpen && '-translate-x-full'}`}>
        <div className="lg:hidden h-[73px] flex-shrink-0"></div>

        <nav className="flex-grow px-2 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                setActiveSection(link.id);
                if (window.innerWidth < 1024) { setSidebarOpen(false); }
              }}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeSection === link.id
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                } ${!isSidebarOpen && 'justify-center'}`}
              title={link.name}
            >
              {link.icon}
              {isSidebarOpen && <span className="ml-3 font-medium text-sm">{link.name}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-slate-200 flex-shrink-0">
          <Link href="/" className={`w-full flex items-center p-3 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-50 ${!isSidebarOpen && 'justify-center'}`} title="Back to Main Site">
            <Home size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium text-sm">Back to Site</span>}
          </Link>
          <button onClick={logout} className={`w-full flex items-center p-3 mt-1 rounded-lg transition-colors text-red-500 hover:text-red-600 hover:bg-red-50 ${!isSidebarOpen && 'justify-center'}`} title="Logout">
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
};
