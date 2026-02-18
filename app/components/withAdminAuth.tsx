// --- withAdminAuth HOC ---
// Redirects non-admin users appropriately

"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { FullPageSpinner } from './ui/Spinner';

export const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AdminAuthenticatedComponent = (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push('/account');
        } else if (user.role !== 'admin') {
          router.push('/dashboard');
        }
      }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.role !== 'admin') {
      return <FullPageSpinner />;
    }

    return <WrappedComponent {...props} />;
  };

  return AdminAuthenticatedComponent;
};