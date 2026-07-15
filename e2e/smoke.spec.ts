/**
 * Smoke E2E tests — verify the public site loads and key flows work.
 */
import { test, expect } from '@playwright/test';
import { US_STATE_REGION_COUNT } from '../lib/productCatalog';

test.describe('Homepage', () => {
    test('loads and shows hero', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { level: 1, name: /premium novelty ids/i })
        ).toBeVisible();

        await expect(
            page.getByRole('link', { name: /browse ids/i }).first()
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: /track order/i }).first()
        ).toBeVisible();
    });

    test('shows correct US state count stat', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText(`${US_STATE_REGION_COUNT}+`, { exact: true })).toBeVisible({
            timeout: 10_000,
        });
    });

    test('view all states link navigates to /order', async ({ page }) => {
        await page.goto('/');

        const link = page.getByRole('link', { name: new RegExp(`view all ${US_STATE_REGION_COUNT} states`, 'i') });
        await expect(link).toBeVisible();
        await link.click();

        await expect(page).toHaveURL(/\/order$/);
    });

    test('FAQ accordion expands on click', async ({ page }) => {
        await page.goto('/');

        const faqButton = page.getByRole('button', { name: /what security features/i });
        await expect(faqButton).toBeVisible();

        await faqButton.click();

        await expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    });
});

test.describe('Track page', () => {
    test('loads with search input', async ({ page }) => {
        await page.goto('/track');

        await expect(page.getByLabel(/order number/i)).toBeVisible();
    });

    test('shows error for invalid order ID', async ({ page }) => {
        await page.goto('/track');

        const input = page.getByLabel(/order number/i);
        await input.fill('invalid-order-id-xyz');
        await page.getByRole('button', { name: /track order/i }).click();

        await expect(page.getByText(/not found|invalid|error/i)).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Order gallery', () => {
    test('shows state cards', async ({ page }) => {
        await page.goto('/order');

        await expect(
            page.getByRole('link', { name: /customize & order/i }).first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test('search filters states', async ({ page }) => {
        await page.goto('/order');

        const search = page.getByLabel(/search/i).or(page.getByPlaceholder(/search/i)).first();
        await search.fill('California');

        await expect(page.getByText(/california/i).first()).toBeVisible({ timeout: 5_000 });
    });
});

test.describe('Account page', () => {
    test('shows login and register tabs', async ({ page }) => {
        await page.goto('/account');

        await expect(page.getByRole('button', { name: /^sign in$/i }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /^register$/i })).toBeVisible();
    });

    test('does not show duplicate login button in header', async ({ page }) => {
        await page.goto('/account');

        await expect(page.getByRole('link', { name: /^login$/i })).toHaveCount(0);
        await expect(page.locator('header').getByRole('link', { name: /login/i })).toHaveCount(0);
    });

    test('register form has required fields', async ({ page }) => {
        await page.goto('/account');

        await page.getByRole('button', { name: /^register$/i }).click();

        await expect(page.getByLabel(/username/i)).toBeVisible();
        await expect(page.getByLabel(/password/i).first()).toBeVisible();
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
