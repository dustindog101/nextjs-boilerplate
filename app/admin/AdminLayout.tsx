"use client";
import React, { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Home, Users, Package, Tag, BarChart3, Handshake, ShoppingBag, LogOut, Newspaper, Settings, Wallet } from 'lucide-react';

export type AdminSection = 'metrics' | 'users' | 'orders' | 'products' | 'resellers' | 'affiliates' | 'discounts' | 'news' | 'payments' | 'settings';

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

  // Lock scroll when mobile drawer is open; close on Escape
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const applyLock = () => {
      if (mq.matches && isSidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
    applyLock();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mq.matches && isSidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', applyLock);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', applyLock);
    };
  }, [isSidebarOpen, setSidebarOpen]);

  const sidebarLinks: SidebarLink[] = [
    { id: 'metrics', name: 'Metrics', icon: <BarChart3 size={20} /> },
    { id: 'users', name: 'Users', icon: <Users size={20} /> },
    { id: 'orders', name: 'Orders', icon: <Package size={20} /> },
    { id: 'products', name: 'Products', icon: <ShoppingBag size={20} /> },
    { id: 'resellers', name: 'Resellers', icon: <Handshake size={20} /> },
    { id: 'affiliates', name: 'Affiliates', icon: <Users size={20} /> },
    { id: 'discounts', name: 'Discounts', icon: <Tag size={20} /> },
    { id: 'news', name: 'News', icon: <Newspaper size={20} /> },
    { id: 'payments', name: 'Payments', icon: <Wallet size={20} /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      {/* Mobile: tap outside to close; below top bar (65px) */}
      <div
        role="presentation"
        aria-hidden={!isSidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 top-[65px] bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sidebar: mobile drawer under AdminTopBar; desktop always visible */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={`fixed left-0 top-[65px] h-[calc(100dvh-65px)] z-40 flex flex-col border-r border-[var(--border)] transition-[transform,width] duration-300 ease-in-out lg:top-0 lg:z-auto lg:h-full lg:min-h-0 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'} ${!isSidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}
        style={{ background: 'var(--bg-secondary)' }}
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
