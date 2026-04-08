"use client";
import React, { ReactNode } from 'react';
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
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        aria-hidden={!isSidebarOpen}
      />

      {/* Full-Height Sidebar — pt clears site header (4rem) + mobile AdminTopBar (65px) */}
      <aside
        className={`fixed top-0 left-0 pt-[calc(4rem+65px)] lg:pt-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'} ${!isSidebarOpen && '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <nav className="flex-grow px-2 py-4 space-y-1 overflow-y-auto min-h-0">
          {sidebarLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                setActiveSection(link.id);
                if (window.innerWidth < 1024) { setSidebarOpen(false); }
              }}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeSection === link.id
                ? 'border'
                : 'border border-transparent'
                } ${!isSidebarOpen && 'justify-center'}`}
              style={activeSection === link.id
                ? { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--border-accent)' }
                : { color: 'var(--text-secondary)' }
              }
              onMouseEnter={e => {
                if (activeSection !== link.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (activeSection !== link.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = '';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }
              }}
              title={link.name}
            >
              {link.icon}
              {isSidebarOpen && <span className="ml-3 font-medium text-sm">{link.name}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            href="/"
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${!isSidebarOpen && 'justify-center'}`}
            style={{ color: 'var(--text-secondary)' }}
            title="Back to Main Site"
          >
            <Home size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium text-sm">Back to Site</span>}
          </Link>
          <button
            onClick={logout}
            className={`w-full flex items-center p-3 mt-1 rounded-lg transition-colors ${!isSidebarOpen && 'justify-center'}`}
            style={{ color: 'var(--error)' }}
            title="Logout"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  );
};
