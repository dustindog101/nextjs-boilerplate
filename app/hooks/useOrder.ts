"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderDetails, JwtPayload } from '../../lib/types';
import { getStorageItem, removeStorageItem } from '../../lib/storage';
import { fetchOrderById, fetchResellerOrderById } from '../../lib/apiClient';

export const useOrder = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loggedInUser, setLoggedInUser] = useState<JwtPayload | null>(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    const [orderData, setOrderData] = useState<OrderDetails | null>(null);
    const [editableOrderData, setEditableOrderData] = useState<OrderDetails | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isSavingChanges, setIsSavingChanges] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

    useEffect(() => {
        // Auth check from stored JWT
        const token = getStorageItem('idPirateAuthToken');
        if (!token) {
            setIsAuthChecking(false);
            setIsLoadingInitialData(false);
            setFetchError('Not authenticated.');
            return;
        }

        let payload: JwtPayload | null = null;
        try {
            // Decode JWT payload (base64url)
            const payloadStr = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
            payload = JSON.parse(payloadStr) as JwtPayload;
            setLoggedInUser(payload);
        } catch {
            setFetchError('Invalid auth token.');
        }
        setIsAuthChecking(false);
        if (!payload) {
            setIsLoadingInitialData(false);
            return;
        }

        // Fetch order from real API
        const orderId = searchParams.get('orderId');
        if (!orderId) {
            setFetchError('No order ID provided.');
            setIsLoadingInitialData(false);
            return;
        }

        const isResellerUser = payload.isReseller;
        const loadOrder = async () => {
            try {
                const data = isResellerUser
                    ? await fetchResellerOrderById(orderId)
                    : await fetchOrderById(orderId);
                setOrderData(data);
                setEditableOrderData(JSON.parse(JSON.stringify(data)));
            } catch (err: any) {
                setFetchError(err.message || 'Failed to load order.');
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        loadOrder();

    }, [searchParams]);

    // Logout Handler
    const logout = () => {
        removeStorageItem('idPirateAuthToken');
        router.push('/account');
    };

    // Editing Handlers
    const startEditing = () => {
        if (orderData?.status === 'shipped' || orderData?.status === 'delivered') {
            setSaveFeedback("Order cannot be edited in this status.");
            return;
        }
        setIsEditing(true);
        setSaveFeedback(null);
    };

    const cancelEditing = () => {
        setEditableOrderData(JSON.parse(JSON.stringify(orderData)));
        setIsEditing(false);
        setSaveFeedback(null);
    };

    const saveChanges = async () => {
        setIsSavingChanges(true);
        setSaveFeedback(null);

        if (!editableOrderData?.shipping || editableOrderData.shipping.length < 5) {
            setSaveFeedback("Error: Shipping address too short.");
            setIsSavingChanges(false);
            return;
        }

        // TODO: Wire to real update API when backend supports user-initiated order updates
        setOrderData(JSON.parse(JSON.stringify(editableOrderData)));
        setIsEditing(false);
        setSaveFeedback("Order updated successfully!");
        setIsSavingChanges(false);
    };

    // Field Updaters
    const updateGeneralField = (field: keyof OrderDetails, value: any) => {
        setEditableOrderData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const updateIdField = (index: number, field: string, value: any) => {
        setEditableOrderData(prev => {
            if (!prev) return null;
            const newIds = [...prev.ids];
            newIds[index] = { ...newIds[index], [field]: value };
            return { ...prev, ids: newIds };
        });
    };

    return {
        loggedInUser, isAuthChecking, isLoadingInitialData, fetchError,
        orderData, editableOrderData, isEditing, isSavingChanges, saveFeedback,
        logout, startEditing, cancelEditing, saveChanges, updateGeneralField, updateIdField
    };
};
