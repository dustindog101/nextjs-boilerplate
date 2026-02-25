"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    listAllUsers, adminListOrders, adminListDiscounts, adminGetMetrics, adminListReferrals,
    User, Discount, AdminMetrics, ReferralGroup,
} from '../../lib/apiClient';

// ── Resource state wrapper ──────────────────────────────────────────
interface Resource<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    loaded: boolean;       // true once first fetch completes (even if error)
}

const emptyResource = <T,>(): Resource<T> => ({
    data: null, isLoading: false, error: null, loaded: false,
});

// ── Context type ────────────────────────────────────────────────────
interface AdminDataContextType {
    users: Resource<User[]>;
    orders: Resource<any[]>;
    discounts: Resource<Discount[]>;
    metrics: Resource<AdminMetrics>;
    referrals: Resource<ReferralGroup[]>;
    loadUsers: () => Promise<void>;
    loadOrders: () => Promise<void>;
    loadDiscounts: () => Promise<void>;
    loadMetrics: () => Promise<void>;
    loadReferrals: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    refreshOrders: () => Promise<void>;
    refreshDiscounts: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────
export const AdminDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<Resource<User[]>>(emptyResource);
    const [orders, setOrders] = useState<Resource<any[]>>(emptyResource);
    const [discounts, setDiscounts] = useState<Resource<Discount[]>>(emptyResource);
    const [metrics, setMetrics] = useState<Resource<AdminMetrics>>(emptyResource);
    const [referrals, setReferrals] = useState<Resource<ReferralGroup[]>>(emptyResource);

    // Generic loader: lazy-loads only on first call, skips if already loaded
    const lazyLoad = useCallback(
        <T,>(
            getter: () => Promise<T>,
            setter: React.Dispatch<React.SetStateAction<Resource<T>>>,
            current: Resource<T>,
        ) => {
            if (current.loaded || current.isLoading) return Promise.resolve();
            return forceLoad(getter, setter);
        }, []
    );

    // Force-load (for refresh after mutations)
    const forceLoad = async <T,>(
        getter: () => Promise<T>,
        setter: React.Dispatch<React.SetStateAction<Resource<T>>>,
    ) => {
        setter(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const data = await getter();
            setter({ data, isLoading: false, error: null, loaded: true });
        } catch (err: any) {
            setter(prev => ({ ...prev, isLoading: false, error: err.message, loaded: true }));
        }
    };

    // Lazy loaders (only fetch on first access)
    const loadUsers = useCallback(() => lazyLoad(listAllUsers, setUsers, users), [users, lazyLoad]);
    const loadOrders = useCallback(async () => {
        if (orders.loaded || orders.isLoading) return;
        setOrders(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const data = await adminListOrders();
            const sorted = (data || []).sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders({ data: sorted, isLoading: false, error: null, loaded: true });
        } catch (err: any) {
            setOrders(prev => ({ ...prev, isLoading: false, error: err.message, loaded: true }));
        }
    }, [orders]);
    const loadDiscounts = useCallback(() => lazyLoad(adminListDiscounts, setDiscounts, discounts), [discounts, lazyLoad]);
    const loadMetrics = useCallback(() => lazyLoad(adminGetMetrics, setMetrics, metrics), [metrics, lazyLoad]);
    const loadReferrals = useCallback(() => lazyLoad(adminListReferrals, setReferrals, referrals), [referrals, lazyLoad]);

    // Force refreshers (after create / update / delete)
    const refreshUsers = useCallback(() => forceLoad(listAllUsers, setUsers), []);
    const refreshOrders = useCallback(async () => {
        setOrders(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const data = await adminListOrders();
            const sorted = (data || []).sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders({ data: sorted, isLoading: false, error: null, loaded: true });
        } catch (err: any) {
            setOrders(prev => ({ ...prev, isLoading: false, error: err.message, loaded: true }));
        }
    }, []);
    const refreshDiscounts = useCallback(() => forceLoad(adminListDiscounts, setDiscounts), []);

    return (
        <AdminDataContext.Provider value={{
            users, orders, discounts, metrics, referrals,
            loadUsers, loadOrders, loadDiscounts, loadMetrics, loadReferrals,
            refreshUsers, refreshOrders, refreshDiscounts,
        }}>
            {children}
        </AdminDataContext.Provider>
    );
};

// ── Hook ────────────────────────────────────────────────────────────
export const useAdminData = () => {
    const ctx = useContext(AdminDataContext);
    if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
    return ctx;
};
