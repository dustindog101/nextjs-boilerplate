#!/usr/bin/env node
/**
 * Capture UI audit screenshots for desktop + mobile viewports.
 * Usage: node scripts/ui-audit-screenshots.mjs [outputDir]
 * Requires dev server at http://localhost:3000 (or PLAYWRIGHT_BASE_URL).
 */
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const outDir = path.resolve(process.argv[2] || 'ui-audit-screenshots');
const routes = ['/', '/order', '/track', '/account', '/news'];

async function capture(browser, deviceName, label, route) {
    const context = await browser.newContext({ ...devices[deviceName] });
    const page = await context.newPage();
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
    const file = path.join(outDir, `${slug}-${label}.png`);
    await page.screenshot({ path: file, fullPage: true });
    await context.close();
    console.log(`saved ${file}`);
}

async function main() {
    await mkdir(outDir, { recursive: true });
    const browser = await chromium.launch();

    for (const route of routes) {
        await capture(browser, 'Desktop Chrome', 'desktop', route);
        await capture(browser, 'Pixel 7', 'mobile', route);
    }
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await ctx.newPage();
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /toggle menu/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({
        path: path.join(outDir, 'home-mobile-menu.png'),
        fullPage: false,
    });
    console.log(`saved ${path.join(outDir, 'home-mobile-menu.png')}`);
    await ctx.close();

    await browser.close();
    console.log(`\nDone — ${routes.length * 2 + 1} screenshots in ${outDir}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
