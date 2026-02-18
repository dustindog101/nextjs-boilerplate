"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderDetails, JwtPayload } from '../../lib/types';
import { getStorageItem, removeStorageItem } from '../../lib/storage';

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

    // --- Mock Data Helper ---
    const getMockOrder = (id: string): OrderDetails => ({
        orderId: id || "mock-order-123",
        createdAt: "2024-06-25T10:00:00Z",
        status: id === 'mock-order-123' ? 'pending' : 'processing',
        shipping: "123 Mockingbird Lane, Testville, TS 12345, USA",
        paymentMethod: "Bitcoin",
        paymentStatus: "Paid",
        notes: "Mock order notes.",
        price: { subtotal: 190, total: 210 },
        userId: "mvp-dev-local-user",
        ids: [
            { id: 1, state: 'Pennsylvania', dobMonth: '01', dobDay: '01', dobYear: '2000', issueMonth: '01', issueDay: '01', issueYear: '2020', firstName: 'John', middleName: 'D', lastName: 'Doe', streetAddress: '123 Mock St', city: 'Test City', zipCode: '12345', zipPlus4: '6789', heightFeet: '5', heightInches: '10', weight: '180', eyeColor: 'Brown', hairColor: 'Black', sex: 'M' },
            { id: 2, state: 'New Jersey', dobMonth: '05', dobDay: '15', dobYear: '1998', issueMonth: '03', issueDay: '10', issueYear: '2018', firstName: 'Jane', middleName: 'A', lastName: 'Smith', streetAddress: '456 Fake Ave', city: 'Mock City', zipCode: '54321', zipPlus4: '9876', heightFeet: '5', heightInches: '5', weight: '130', eyeColor: 'Blue', hairColor: 'Blonde', sex: 'F' },
        ],
    });

    useEffect(() => {
        // Check Auth
        const token = "mock-token"; // MVP Placeholder
        const mockUser: JwtPayload = { userId: "mvp-dev-local-user", username: "MVPCustomer", role: 'user', isReseller: false, iat: Date.now(), exp: Date.now() + 3600 };
        setLoggedInUser(mockUser);
        setIsAuthChecking(false);

        // Fetch Order
        const orderId = searchParams.get('orderId') || 'mock-order-123';
        setTimeout(() => {
            const data = getMockOrder(orderId);
            setOrderData(data);
            setEditableOrderData(JSON.parse(JSON.stringify(data)));
            setIsLoadingInitialData(false);
        }, 800);

    }, [searchParams]);

    // Logout Handler
    const logout = () => {
        removeStorageItem('idPirateAuthToken');
        router.push('/account');
    };

    // Editing Handlers
    const startEditing = () => {
        // Logic for allowed status
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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API

        if (!editableOrderData?.shipping || editableOrderData.shipping.length < 5) {
            setSaveFeedback("Error: Shipping address too short.");
            setIsSavingChanges(false);
            return;
        }

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
