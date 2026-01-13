// --- Universal Header Component ---
// Provides consistent navigation across all pages

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePathname } from 'next/navigation';
import {
  UserIcon,
  ChevronDownIcon,
  PackageIcon,
  SearchIcon,
  BackArrowIcon,
} from './icons';

export const UniversalHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  // --- Dynamic Navigation Logic ---
  const isOrderFlowPage = ['/order/new', '/checkout'].includes(pathname);
  const backButtonHref = pathname === '/checkout' ? '/order/new' : '/order';
  const backButtonText = pathname === '/checkout' ? 'Back to Edit Order' : 'Back to Gallery';

  return (
    <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center px-4 sm:px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4 sm:gap-6">
        <a href="/" className="font-pirate text-3xl sm:text-4xl font-bold text-white tracking-wider">
          ID Pirate
        </a>
        <nav className="hidden sm:flex items-center gap-4">
          {isOrderFlowPage ? (
            <a href={backButtonHref} className="flex items-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors">
              <BackArrowIcon className="h-5 w-5 mr-2" /> {backButtonText}
            </a>
          ) : (
            <>
              <a href="/order" className="flex items-center text-gray-300 hover:text-white font-semibold transition-colors">
                <PackageIcon className="h-5 w-5 mr-2" /> Order
              </a>
              <a href="/track" className="flex items-center text-gray-300 hover:text-white font-semibold transition-colors">
                <SearchIcon className="h-5 w-5 mr-2" /> Track
              </a>
            </>
          )}
        </nav>
      </div>

      <div className="flex-shrink-0 relative">
        {isLoading ? (
          <div className="h-10 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
        ) : user ? (
          <div ref={dropdownRef} className="relative group">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
            >
              <span className="text-gray-300 flex items-center text-sm sm:text-base">
                <UserIcon className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="font-semibold">{user.username}</span>
                <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </span>
            </button>

            <div
              onMouseLeave={() => setIsDropdownOpen(false)}
              className={`absolute right-0 mt-2 w-56 bg-gray-700 border border-gray-600 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 ease-out ${isDropdownOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'}`}
            >
              <div className="px-4 py-2 border-b border-gray-600">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="font-semibold text-white truncate">{user.username}</p>
              </div>
              <a href="/orders" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">My Orders</a>
              <a href="/settings" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Settings</a>
              {user.isReseller && <a href="/reseller-dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Reseller</a>}
              {user.role === 'admin' && <a href="/admin-dashboard" className="block px-4 py-2 text-yellow-400 hover:bg-gray-600">Admin Panel</a>}
              <div className="border-t border-gray-600 my-1"></div>
              <button onClick={logout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 hover:text-red-300">Logout</button>
            </div>
          </div>
        ) : (
          <a href="/account" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-md transition-colors shadow-md">Login / Register</a>
        )}
      </div>
    </header>
  );
};