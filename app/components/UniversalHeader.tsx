// --- Universal Header Component ---
// Dark Maritime Premium header with backdrop blur

"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import {
  UserIcon,
  ChevronDownIcon,
  PackageIcon,
  SearchIcon,
  BackArrowIcon,
  NewsIcon,
} from './icons';

type UniversalHeaderProps = {
  /** Set by middleware + root layout (no flash); true on reseller subdomains that rewrite to /r/[id]. */
  hideHeaderForResellerHost?: boolean;
};

export const UniversalHeader = ({
  hideHeaderForResellerHost = false,
}: UniversalHeaderProps) => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const button = userMenuButtonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width: '13rem',
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        userMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // --- Dynamic Navigation Logic ---
  const isOrderFlowPage = ['/order/new', '/checkout'].includes(pathname);
  const isAccountPage = pathname === '/account';
  const backButtonHref = pathname === '/checkout' ? '/order/new' : '/order';
  const backButtonText = pathname === '/checkout' ? 'Back to Edit' : 'Back to Gallery';

  // Hide main-site branding: path-based /r/..., or reseller subdomain (see middleware + layout prop).
  if (pathname.startsWith('/r/') || hideHeaderForResellerHost) return null;


  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 overflow-visible bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border)] pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between overflow-visible">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity font-[var(--font-display)]">
              <span className="text-[var(--accent)]">ID</span> <span className="text-white">PIRATE</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {isOrderFlowPage ? (
                <Link
                  href={backButtonHref}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-all"
                >
                  <BackArrowIcon className="h-4 w-4" /> {backButtonText}
                </Link>
              ) : (
                <>
                  <Link
                    href="/order"
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${pathname === '/order'
                      ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                    <PackageIcon className="h-4 w-4" /> Order
                  </Link>
                  <Link
                    href="/track"
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${pathname === '/track'
                      ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                    <SearchIcon className="h-4 w-4" /> Track
                  </Link>
                  <Link
                    href="/news"
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${pathname === '/news'
                      ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                    <NewsIcon className="h-4 w-4" /> News
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: Auth + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Auth Section - Desktop */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="h-9 w-20 bg-white/[0.1] rounded-lg animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    ref={userMenuButtonRef}
                    onClick={() => {
                      if (!isDropdownOpen) updateDropdownPosition();
                      setIsDropdownOpen((open) => !open);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="menu"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">{user.username}</span>
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMounted && isDropdownOpen && createPortal(
                    <div
                      ref={dropdownRef}
                      role="menu"
                      style={dropdownStyle}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                      className="z-[200] bg-[var(--bg-elevated)] rounded-xl shadow-lg border border-[var(--border)] py-1 animate-fade-in"
                    >
                      <Link href="/dashboard" role="menuitem" className="block px-4 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                        <p className="text-xs text-[var(--text-tertiary)]">Signed in as</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.username}</p>
                      </Link>
                      <Link href="/dashboard" role="menuitem" className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                        Dashboard
                      </Link>
                      <Link href="/orders" role="menuitem" className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                        My Orders
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" role="menuitem" className="block px-4 py-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--bg-hover)] transition-colors">
                          Admin Panel
                        </Link>
                      )}
                      {(user.isReseller || user.role === 'admin') && (
                        <Link href="/reseller" role="menuitem" className="block px-4 py-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--bg-hover)] transition-colors">
                          Reseller Dashboard
                        </Link>
                      )}
                      <div className="border-t border-[var(--border)] my-1" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>,
                    document.body,
                  )}
                </div>
              ) : isAccountPage ? null : (
                <Link href="/account" className="btn btn-primary text-sm py-2 px-4">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile: Login + Hamburger */}
            <div className="flex md:hidden items-center gap-3">
              {!isLoading && !user && !isAccountPage && (
                <Link href="/account" className="btn btn-primary text-xs py-2 px-3 min-h-11 inline-flex items-center">
                  Login
                </Link>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[var(--bg-elevated)] border-l border-[var(--border)] shadow-xl animate-slide-in-right pt-[env(safe-area-inset-top,0px)]">
            <div className="p-6 pt-20 flex flex-col gap-1">
              {isOrderFlowPage ? (
                <Link
                  href={backButtonHref}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                >
                  <BackArrowIcon className="h-5 w-5" /> {backButtonText}
                </Link>
              ) : (
                <>
                  <Link href="/order" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <PackageIcon className="h-5 w-5" /> Order
                  </Link>
                  <Link href="/track" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <SearchIcon className="h-5 w-5" /> Track
                  </Link>
                  <Link href="/news" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <NewsIcon className="h-5 w-5" /> News
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <UserIcon className="h-5 w-5" /> Dashboard
                  </Link>
                  <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <UserIcon className="h-5 w-5" /> My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--bg-hover)] transition-all">
                      Admin Panel
                    </Link>
                  )}
                  {(user.isReseller || user.role === 'admin') && (
                    <Link href="/reseller" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--bg-hover)] transition-all">
                      Reseller Dashboard
                    </Link>
                  )}
                </>
              )}
              <div className="border-t border-[var(--border)] my-3" />
              {user ? (
                <>
                  <div className="px-4 py-2 text-xs text-[var(--text-tertiary)]">Signed in as <span className="text-[var(--text-primary)] font-medium">{user.username}</span></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-[var(--bg-hover)] transition-all text-left w-full cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                !isAccountPage && (
                  <Link href="/account" className="btn btn-primary w-full justify-center mt-2">
                    Login / Register
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add the slide-in animation */}
      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
      `}</style>
    </>
  );
};