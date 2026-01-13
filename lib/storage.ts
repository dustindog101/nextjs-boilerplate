// Safe localStorage utilities for Next.js (handles SSR gracefully)

export function getStorageItem(key: string): string | null {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return null;

    // Extra safety: Check if localStorage exists and has a working getItem method
    // This works around broken localStorage polyfills in Next.js dev mode
    if (typeof window.localStorage === 'undefined' ||
        typeof window.localStorage.getItem !== 'function') {
        return null;
    }

    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    if (typeof window.localStorage === 'undefined' ||
        typeof window.localStorage.setItem !== 'function') {
        return;
    }
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Silently fail on SSR or private browsing
    }
}

export function removeStorageItem(key: string): void {
    if (typeof window === 'undefined') return;
    if (typeof window.localStorage === 'undefined' ||
        typeof window.localStorage.removeItem !== 'function') {
        return;
    }
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Silently fail on SSR or private browsing
    }
}
