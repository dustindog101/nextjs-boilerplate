// --- withAuth HOC ---
// Redirects unauthenticated users to /account

"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { FullPageSpinner } from './ui/Spinner';

export const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthenticatedComponent = (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/account');
      }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
      return <FullPageSpinner />;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};