"use client";

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AdminSection } from './AdminLayout';

const SECTION_LABELS: Record<AdminSection, string> = {
  metrics: 'Metrics',
  users: 'Users',
  orders: 'Orders',
  products: 'Products',
  resellers: 'Resellers',
  affiliates: 'Affiliates',
  discounts: 'Discounts',
  news: 'News',
  settings: 'Settings',
};

interface AdminTopBarProps {
  activeSection: AdminSection;
  isSidebarOpen: boolean;
  onMenuClick: () => void;
}

/** Mobile-only bar: opens admin nav drawer (lg+ hidden — sidebar is always visible). */
export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  activeSection,
  isSidebarOpen,
  onMenuClick,
}) => {
  const { user } = useAuth();

  return (
    <header
      className="lg:hidden flex-shrink-0 z-50 flex items-center h-[65px] px-4 sm:px-6 gap-3 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 rounded-lg -ml-1 transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isSidebarOpen}
        aria-controls="admin-sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <span className="text-sm font-semibold truncate min-w-0" style={{ color: 'var(--text-primary)' }}>
        {SECTION_LABELS[activeSection]}
      </span>

      <div className="flex-1 min-w-0" />

      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
        style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)', background: 'var(--accent-subtle)' }}
      >
        Admin
      </span>
      {user?.username && (
        <span className="text-xs truncate max-w-[7rem] sm:max-w-[10rem] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
          {user.username}
        </span>
      )}
    </header>
  );
};
