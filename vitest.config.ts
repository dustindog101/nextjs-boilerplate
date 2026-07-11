import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        // Two projects: node (pure logic) + jsdom (React components)
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        globals: false,
        projects: [
            {
                // Pure-logic tests (pricing, utils) — node environment
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['tests/**/*.test.ts'],
                    exclude: ['tests/components/**'],
                },
            },
            {
                // React component tests — jsdom environment
                extends: true,
                test: {
                    name: 'components',
                    environment: 'jsdom',
                    include: ['tests/components/**/*.test.tsx'],
                    setupFiles: ['tests/setup.ts'],
                    globals: true,
                },
            },
        ],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname),
        },
    },
});
