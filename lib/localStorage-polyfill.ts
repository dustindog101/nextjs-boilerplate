// This file runs before anything else and fixes the broken localStorage polyfill in Next.js dev mode

if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // We're in Node.js (server-side)
    // Create a safe, working localStorage polyfill

    const createSafeStorage = () => {
        const store: Record<string, string> = {};

        return {
            getItem: function (key: string): string | null {
                return store[key] || null;
            },
            setItem: function (key: string, value: string): void {
                store[key] = String(value);
            },
            removeItem: function (key: string): void {
                delete store[key];
            },
            clear: function (): void {
                Object.keys(store).forEach(key => delete store[key]);
            },
            get length(): number {
                return Object.keys(store).length;
            },
            key: function (index: number): string | null {
                const keys = Object.keys(store);
                return keys[index] || null;
            }
        };
    };

    // Replace the broken polyfill with our working one
    (global as any).localStorage = createSafeStorage();
}

export { };
