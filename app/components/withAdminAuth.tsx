// --- START OF FILE app/components/withAdminAuth.tsx ---

"use client";
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Full-page loading spinner component
const FullPageLoader = () => (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-xl text-gray-300">Verifying Permissions...</p>
    </div>
);

// HOC for admin-only authentication
export const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AdminAuthenticatedComponent = (props: P) => {
    const { user, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          // If not logged in at all, redirect to login
          window.location.href = '/account';
        } else if (user.role !== 'admin') {
          // If logged in but not an admin, redirect to user dashboard
          // You can change this to an "Access Denied" page if you prefer
          window.location.href = '/dashboard'; 
        }
      }
    }, [user, isLoading]);

    if (isLoading || !user || user.role !== 'admin') {
      // Show loader while checking or before redirecting
      return <FullPageLoader />;
    }

    // If checks pass, render the admin component
    return <WrappedComponent {...props} />;
  };

  return AdminAuthenticatedComponent;
};

// --- END OF FILE app/components/withAdminAuth.tsx ---