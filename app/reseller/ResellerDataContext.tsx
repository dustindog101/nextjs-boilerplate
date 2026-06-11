"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { fetchResellerOrders } from '../../lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResellerOrder {
    orderId: string;
    createdAt: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    paymentStatus?: string;
    paymentMethod?: string;
    paymentIntentId?: string;
    cryptoAsset?: string;
    paymentExpiresAt?: string;
    cryptoTxHash?: string;
    price: { total: number; subtotal?: number };
    numberOfIds?: number;
    ids?: unknown[];
    shipping?: string;
    source?: string;
    notes?: string;
    updatedAt?: string;
}

interface Resource<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    loaded: boolean;
}

const emptyResource = <T,>(): Resource<T> => ({
    data: null, isLoading: false, error: null, loaded: false,
});

// ─── Context Type ─────────────────────────────────────────────────────────────

interface ResellerDataContextType {
    orders: Resource<ResellerOrder[]>;
    loadOrders: () => Promise<void>;
    refreshOrders: () => Promise<void>;
}

const ResellerDataContext = createContext<ResellerDataContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ResellerDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<Resource<ResellerOrder[]>>(emptyResource);

    const fetchAndSetOrders = useCallback(async () => {
        setOrders(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const data = await fetchResellerOrders();
            const sorted = (data.orders || []).sort(
                (a: ResellerOrder, b: ResellerOrder) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders({ data: sorted, isLoading: false, error: null, loaded: true });
        } catch (err: any) {
            setOrders(prev => ({ ...prev, isLoading: false, error: err.message, loaded: true }));
        }
    }, []);

    const loadOrders = useCallback(async () => {
        if (orders.loaded || orders.isLoading) return;
        await fetchAndSetOrders();
    }, [orders.loaded, orders.isLoading, fetchAndSetOrders]);

    const refreshOrders = useCallback(async () => {
        await fetchAndSetOrders();
    }, [fetchAndSetOrders]);

    return (
        <ResellerDataContext.Provider value={{ orders, loadOrders, refreshOrders }}>
            {children}
        </ResellerDataContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useResellerData = () => {
    const ctx = useContext(ResellerDataContext);
    if (!ctx) throw new Error('useResellerData must be used within ResellerDataProvider');
    return ctx;
};
