/**
 * Referral / affiliate link tracking.
 *
 * When a visitor arrives with `?ref=CODE` in the URL:
 *   1. Store the code in a 30-day cookie + localStorage (for SSR access)
 *   2. Show a "Welcome! You've unlocked X% off" banner on the homepage
 *   3. Auto-fill the discount code at checkout
 *
 * The cookie is 30 days (industry standard for affiliate attribution).
 * Last-touch attribution: if a new `?ref=CODE` arrives, it overwrites the
 * previous one.
 */

import { getStorageItem, setStorageItem } from './storage';

const REF_COOKIE_NAME = 'idPirateRef';
const REF_STORAGE_KEY = 'idPirateRefCode';
const REF_COOKIE_MAX_AGE_DAYS = 30;

/**
 * On any page load, check for `?ref=CODE` in the URL.
 * If present, store it + strip the param from the URL (clean sharing).
 * Call this from a useEffect in the root layout or a shared component.
 */
export function captureReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);
    const refCode = url.searchParams.get('ref');

    if (!refCode) {
        // No ref in URL — return any existing stored ref
        return getStoredReferralCode();
    }

    const normalizedCode = refCode.trim().toUpperCase();

    // Store in cookie (30 days)
    const expires = new Date();
    expires.setDate(expires.getDate() + REF_COOKIE_MAX_AGE_DAYS);
    document.cookie = `${REF_COOKIE_NAME}=${normalizedCode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    // Also store in localStorage (for SSR + easier access)
    setStorageItem(REF_STORAGE_KEY, normalizedCode);

    // Strip the ref param from the URL (clean URL for sharing)
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());

    return normalizedCode;
}

/**
 * Get the stored referral code (from localStorage first, then cookie).
 */
export function getStoredReferralCode(): string | null {
    if (typeof window === 'undefined') return null;

    // Try localStorage first (faster, SSR-safe via getStorageItem)
    const stored = getStorageItem(REF_STORAGE_KEY);
    if (stored) return stored;

    // Fall back to cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === REF_COOKIE_NAME && value) {
            return value;
        }
    }

    return null;
}

/**
 * Clear the stored referral code (called after order submission to prevent
 * the same code from auto-applying to the next order).
 */
export function clearReferralCode(): void {
    if (typeof window === 'undefined') return;

    // Clear localStorage
    try {
        localStorage.removeItem(REF_STORAGE_KEY);
    } catch {
        // ignore
    }

    // Clear cookie (set expiry to past)
    document.cookie = `${REF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Get the referral URL for sharing.
 * Example: https://idpirate.com?ref=JOHN15
 */
export function getReferralUrl(code: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://idpirate.com';
    return `${origin}?ref=${code.toUpperCase()}`;
}
