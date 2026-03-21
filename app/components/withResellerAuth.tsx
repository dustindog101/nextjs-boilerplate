// --- withResellerAuth HOC ---
// Protects routes so only users with isReseller: true can access them.

"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { FullPageSpinner } from './ui/Spinner';

export const withResellerAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const ResellerAuthenticatedComponent = (props: P) => {
        const { user, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading) {
                if (!user) {
                    router.push('/account');
                } else if (!user.isReseller && user.role !== 'admin') {
                    // Admins can also access the reseller dashboard for support purposes
                    router.push('/dashboard');
                }
            }
        }, [user, isLoading, router]);

        if (isLoading || !user || (!user.isReseller && user.role !== 'admin')) {
            return <FullPageSpinner />;
        }

        return <WrappedComponent {...props} />;
    };

    return ResellerAuthenticatedComponent;
};
