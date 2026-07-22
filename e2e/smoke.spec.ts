/**
 * Smoke E2E tests — verify the public site loads and key flows work.
 *
 * These tests don't require auth — they cover the public-facing pages.
 * Authenticated tests (admin, dashboard, checkout) live in separate files
 * and use saved auth state.
 *
 * Patterns from playwright-skill:
 * - Web-first assertions (expect().toBeVisible())
 * - Role-based selectors (getByRole, getByLabel)
 * - No hard waits (waitForTimeout)
 * - Independent tests
 */
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
    test('loads and shows hero', async ({ page }) => {
        await page.goto('/');

        // Hero heading is visible
        await expect(
            page.getByRole('heading', { level: 1, name: /premium novelty ids/i })
        ).toBeVisible();

        // Primary CTAs are present in the hero
        await expect(page.getByRole('link', { name: /browse ids/i }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /track order/i }).first()).toBeVisible();
    });

    test('shows correct US state count (not 53)', async ({ page }) => {
        await page.goto('/');

        // The "States Available" stat should show 51–52 (50 states + DC), not 53
        // (which would incorrectly include UK + PR)
        await expect(page.getByText(/5[12]\+/)).toBeVisible({ timeout: 10_000 });
    });

    test('view all states link navigates to /order', async ({ page }) => {
        await page.goto('/');

        const link = page.getByRole('link', { name: /view all \d+ states/i });
        await expect(link).toBeVisible();
        await link.click();

        await expect(page).toHaveURL(/\/order$/);
    });

    test('FAQ accordion expands on click', async ({ page }) => {
        await page.goto('/');

        // Find a FAQ button
        const faqButton = page.getByRole('button', { name: /what security features/i });
        await expect(faqButton).toBeVisible();

        // Click to expand
        await faqButton.click();

        // The panel should now be visible (aria-expanded = true)
        await expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    });
});

test.describe('Track page', () => {
    test('loads with search input', async ({ page }) => {
        await page.goto('/track');

        // The track input should be visible
        await expect(page.getByLabel(/order number/i)).toBeVisible();
    });

    test('shows error for invalid order ID', async ({ page }) => {
        await page.goto('/track');

        const input = page.getByLabel(/order number/i);
        await input.fill('invalid-order-id-xyz');
        await input.press('Enter');

        // Should show some error message (exact text may vary)
        await expect(page.getByText(/not found|invalid|error/i)).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Order gallery', () => {
    test('shows state cards', async ({ page }) => {
        await page.goto('/order');

        // At least one customize CTA should be visible
        await expect(
            page.getByRole('link', { name: /customize & order/i }).first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test('search filters states', async ({ page }) => {
        await page.goto('/order');

        // Type in search
        const search = page.getByLabel(/search states or id types/i);
        await search.fill('California');

        // California should appear in results
        await expect(page.getByText(/california/i).first()).toBeVisible({ timeout: 5_000 });
    });
});

test.describe('Account page', () => {
    test('shows login and register tabs', async ({ page }) => {
        await page.goto('/account');

        await expect(page.getByRole('button', { name: 'Sign In', exact: true }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Register', exact: true })).toBeVisible();
    });

    test('register form has required fields', async ({ page }) => {
        await page.goto('/account');

        // Switch to register tab
        await page.getByRole('button', { name: 'Register', exact: true }).click();

        // Username + password fields should be visible
        await expect(page.getByLabel(/username/i)).toBeVisible();
        await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });

    test('hides header login button on account page', async ({ page }) => {
        await page.goto('/account');

        // Header should not show a redundant Login CTA when already on /account
        await expect(page.locator('header').getByRole('link', { name: /^login$/i })).toHaveCount(0);
    });
});

test.describe('Legal pages', () => {
    test('terms page loads', async ({ page }) => {
        await page.goto('/terms');
        await expect(page).toHaveTitle(/terms|id pirate/i);
    });

    test('privacy page loads', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page).toHaveTitle(/privacy|id pirate/i);
    });
});
