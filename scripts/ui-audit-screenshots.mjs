#!/usr/bin/env node
/**
 * Capture desktop + mobile screenshots for UI audit.
 * Usage: node scripts/ui-audit-screenshots.mjs [baseUrl]
 */
import { chromium, devices } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const baseUrl = process.argv[2] || 'http://localhost:3000';
const outDir = path.join(process.cwd(), 'screenshots', 'ui-audit');

const routes = [
  { path: '/', name: 'home' },
  { path: '/order', name: 'order-gallery' },
  { path: '/track', name: 'track' },
  { path: '/account', name: 'account' },
  { path: '/news', name: 'news' },
];

const viewports = [
  { label: 'desktop', width: 1280, height: 800, isMobile: false },
  { label: 'mobile', isMobile: true },
];

async function capture(page, url, filepath, fullPage = true) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: filepath, fullPage });
  console.log('  ✓', filepath);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of viewports) {
    console.log(`\n=== ${vp.label} ===`);
    const context = await browser.newContext(
      vp.isMobile
        ? { ...devices['iPhone 13'] }
        : { viewport: { width: vp.width, height: vp.height } },
    );
    const page = await context.newPage();

    for (const route of routes) {
      const url = `${baseUrl}${route.path}`;
      const filepath = path.join(outDir, `${route.name}-${vp.label}.png`);
      await capture(page, url, filepath);
    }

    if (vp.isMobile) {
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      const menuBtn = page.getByRole('button', { name: 'Toggle menu' });
      if (await menuBtn.count()) {
        await menuBtn.click();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(outDir, 'home-mobile-menu-open.png'),
          fullPage: false,
        });
        console.log('  ✓ home-mobile-menu-open.png');
      }

      await page.goto(`${baseUrl}/account`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(outDir, 'account-mobile-no-header-login.png'),
        fullPage: false,
      });
      console.log('  ✓ account-mobile-no-header-login.png');
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
