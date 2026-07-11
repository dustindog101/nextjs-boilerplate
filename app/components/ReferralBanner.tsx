"use client";

import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { captureReferralCode, getStoredReferralCode } from '@/lib/referral';
import { removeStorageItem, setStorageItem, getStorageItem } from '@/lib/storage';

const BANNER_DISMISS_KEY = 'idPirateRefBannerDismissed';

/**
 * Shows a "Welcome! You've been referred" banner when a `?ref=CODE` is active.
 * Appears on the homepage + order page. Dismissible (stores dismissal in
 * localStorage so it doesn't reappear for the same ref code).
 */
export function ReferralBanner() {
    const [refCode, setRefCode] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Capture ref from URL if present (stores in cookie + localStorage)
        const captured = captureReferralCode();
        const stored = captured || getStoredReferralCode();

        if (stored) {
            setRefCode(stored);
            // Check if this specific ref code was dismissed
            const dismissedCode = getStorageItem(BANNER_DISMISS_KEY);
            setDismissed(dismissedCode === stored);
        }
    }, []);

    if (!refCode || dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        removeStorageItem(BANNER_DISMISS_KEY);
        setStorageItem(BANNER_DISMISS_KEY, refCode);
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-500/95 to-purple-500/95 backdrop-blur-sm border-b border-white/10 animate-fade-up">
            <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Gift size={18} className="text-white flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="text-sm font-semibold text-white">
                            You&apos;ve been referred! Use code{' '}
                            <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">{refCode}</span>
                            {' '}at checkout for a discount.
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss referral banner"
                    className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
