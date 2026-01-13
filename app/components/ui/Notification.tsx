"use client";

import React from 'react';

interface NotificationProps {
    message: string;
    show: boolean;
    type?: 'error' | 'success' | 'info';
}

export const Notification: React.FC<NotificationProps> = ({
    message,
    show,
    type = 'error',
}) => {
    if (!show) return null;

    const bgColors = {
        error: 'bg-red-500',
        success: 'bg-green-500',
        info: 'bg-blue-500',
    };

    return (
        <div
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 ${bgColors[type]} text-white py-2 px-5 rounded-lg shadow-lg animate-fade-in-out z-50`}
        >
            {message}
        </div>
    );
};
