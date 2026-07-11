/**
 * Mobile-specific smoke tests — runs only in the mobile-chrome project
 * (Pixel 7 viewport). Verifies the site is usable on small screens.
 *
 * This file matches `mobile.spec.ts` per playwright.config.ts testMatch rule.
 */
import { test, expect } from '@playwright/test';

test.describe('Mobile homepage', () => {
    test('hero is readable on mobile', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { level: 1, name: /premium novelty ids/i })
        ).toBeVisible();
    });

    test('navigation menu is accessible via hamburger', async ({ page }) => {
        await page.goto('/');

        // Mobile menu toggle should be visible on small screens
        const menuToggle = page.getByRole('button', { name: /toggle menu/i });
        await expect(menuToggle).toBeVisible();
    });
});

test.describe('Mobile order gallery', () => {
    test('state cards stack vertically on mobile', async ({ page }) => {
        await page.goto('/order');

        // Cards should be visible — on mobile they stack to 1 column
        await expect(
            page.getByRole('link', { name: /order now/i }).first()
        ).toBeVisible({ timeout: 10_000 });
    });
});
