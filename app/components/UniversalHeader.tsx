// --- Universal Header Component ---
// Provides consistent navigation across all pages

"use client";
import React, { useState, useEffect, useRef } from 'react';
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

export const UniversalHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const backButtonHref = pathname === '/checkout' ? '/order/new' : '/order';
  const backButtonText = pathname === '/checkout' ? 'Back to Edit' : 'Back to Gallery';

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="font-pirate text-2xl sm:text-3xl text-white tracking-wider hover:opacity-80 transition-opacity">
              ID Pirate
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {isOrderFlowPage ? (
                <Link
                  href={backButtonHref}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-all"
                >
                  <BackArrowIcon className="h-4 w-4" /> {backButtonText}
                </Link>
              ) : (
                <>
                  <Link
                    href="/order"
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${pathname === '/order'
                      ? 'text-white bg-white/[0.08]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                    <PackageIcon className="h-4 w-4" /> Order
                  </Link>
                  <Link
                    href="/track"
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${pathname === '/track'
                      ? 'text-white bg-white/[0.08]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                    <SearchIcon className="h-4 w-4" /> Track
                  </Link>
                  <Link
                    href="/news"
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${pathname === '/news'
                      ? 'text-white bg-white/[0.08]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
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
                <div className="h-9 w-20 bg-white/[0.06] rounded-lg animate-pulse" />
              ) : user ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">{user.username}</span>
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    onMouseLeave={() => setIsDropdownOpen(false)}
                    className={`absolute right-0 mt-2 w-52 glass rounded-xl shadow-xl py-1 z-50 transition-all duration-200 ease-out ${isDropdownOpen
                      ? 'opacity-100 translate-y-0 visible'
                      : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                      }`}
                  >
                    <div className="px-4 py-2.5 border-b border-white/[0.08]">
                      <p className="text-xs text-zinc-500">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                    </div>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                      My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-colors">
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-white/[0.08] my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/account" className="btn btn-primary text-sm py-2 px-4">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile: Login + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {!isLoading && !user && (
                <Link href="/account" className="btn btn-primary text-xs py-1.5 px-3">
                  Login
                </Link>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                aria-label="Toggle menu"
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
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-72 bg-[var(--bg)] border-l border-white/[0.08] animate-slide-in-right">
            <div className="p-6 pt-20 flex flex-col gap-1">
              <Link href="/order" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all">
                <PackageIcon className="h-5 w-5" /> Order
              </Link>
              <Link href="/track" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all">
                <SearchIcon className="h-5 w-5" /> Track
              </Link>
              <Link href="/news" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all">
                <NewsIcon className="h-5 w-5" /> News
              </Link>
              {user && (
                <>
                  <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all">
                    <UserIcon className="h-5 w-5" /> My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-all">
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
              <div className="border-t border-white/[0.08] my-3" />
              {user ? (
                <>
                  <div className="px-4 py-2 text-xs text-zinc-500">Signed in as <span className="text-white font-medium">{user.username}</span></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/[0.06] transition-all text-left w-full cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/account" className="btn btn-primary w-full justify-center mt-2">
                  Login / Register
                </Link>
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