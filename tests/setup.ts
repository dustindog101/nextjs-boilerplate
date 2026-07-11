/**
 * Vitest setup for React component tests.
 *
 * Adds @testing-library/jest-dom matchers (toBeInTheDocument, toBeVisible, etc.)
 * and configures jsdom environment.
 *
 * Run: npx vitest run tests/components/
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-cleanup after each test (RTL best practice)
afterEach(() => {
    cleanup();
});
