// --- START OF FILE app/components/UniversalHeader.tsx ---

"use client";
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// --- SVG Icons ---
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;


export const UniversalHeader = () => {
  const { user, logout, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center px-4 sm:px-8">
      {/* Left Section: Logo and Links */}
      <div className="flex items-center gap-4 sm:gap-6">
        <a href="/" className="font-pirate-special text-3xl sm:text-4xl font-bold text-white tracking-wider">
          ID Pirate
        </a>
        <nav className="hidden sm:flex items-center gap-4">
          <a href="/order" className="flex items-center text-gray-300 hover:text-white font-semibold transition-colors">
            <PackageIcon className="h-5 w-5 mr-2" /> Order
          </a>
          <a href="/track" className="flex items-center text-gray-300 hover:text-white font-semibold transition-colors">
            <SearchIcon className="h-5 w-5 mr-2" /> Track
          </a>
        </nav>
      </div>
      
      {/* Right Section: Auth Status */}
      <div className="flex-shrink-0 relative">
        {isLoading ? (
          <div className="h-10 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
        ) : user ? (
          // Logged-in user dropdown
          <div 
            className="relative group cursor-pointer"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <div className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition">
              <span className="text-gray-300 flex items-center text-sm sm:text-base">
                <UserIcon className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="font-semibold">{user.username}</span>
                <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </span>
            </div>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg py-1 z-50">
                <a href="/orders" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">My Orders</a>
                <a href="/settings" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Settings</a>
                {user.isReseller && <a href="/reseller-dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Reseller</a>}
                {user.role === 'admin' && <a href="/admin-dashboard" className="block px-4 py-2 text-yellow-400 hover:bg-gray-600">Admin Panel</a>}
                <div className="border-t border-gray-600 my-1"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // Guest login button
          <a href="/account" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-md transition-colors shadow-md">
            Login
          </a>
        )}
      </div>
    </header>
  );
};

// --- END OF FILE app/components/UniversalHeader.tsx ---