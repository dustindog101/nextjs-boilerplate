"use client";

import React, { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    show: boolean;
    type?: 'error' | 'success' | 'info';
    duration?: number;
    onDismiss?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
    message,
    show,
    type = 'error',
    duration = 4000,
    onDismiss,
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            if (duration > 0) {
                const timer = setTimeout(() => {
                    setVisible(false);
                    onDismiss?.();
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            setVisible(false);
        }
    }, [show, duration, onDismiss]);

    if (!visible) return null;

    const colors = {
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        info: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    };

    const icons = {
        error: (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
        success: (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
        info: (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
    };

    return (
        <div role="status" aria-live="polite" className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] glass border ${colors[type]} rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-up shadow-lg`}>
            {icons[type]}
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={() => { setVisible(false); onDismiss?.(); }}
                aria-label="Dismiss notification"
                className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
