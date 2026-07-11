import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — E2E tests for ID Pirate.
 *
 * Best practices applied from the playwright-skill (skills.sh #1 testing skill):
 * - Web-first assertions (auto-retry, no hard waits)
 * - Role-based selectors (getByRole, getByLabel — never raw CSS)
 * - Independent tests (no shared state)
 * - Page Object Model for projects with >3 tests
 *
 * Run: npx playwright test
 * Run with UI: npx playwright test --ui
 * Report: npx playwright show-report
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 7'] },
            testMatch: /mobile\.spec\.ts/,
        },
    ],
    webServer: process.env.CI ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
    },
});
