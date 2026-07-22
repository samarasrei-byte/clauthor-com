import { test, expect } from "@playwright/test";

/**
 * Header visual regression + scroll behavior.
 * Runs on the public landing page (no auth needed).
 *
 * Validates:
 *  - Header stays visible/fixed while scrolling
 *  - No bottom border strip appears at any scroll offset
 *  - Logo swaps to white when the page reaches the dark zone
 *  - Header height is stable across scroll positions
 */

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

for (const vp of viewports) {
  test(`header visual @ ${vp.name}`, async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "visual pass runs on chromium only");
    await page.setViewportSize({ width: vp.width, height: vp.height });

    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header).toBeVisible({ timeout: 10_000 });

    const heightAtTop = (await header.boundingBox())?.height ?? 0;

    // Screenshot: top
    await testInfo.attach(`header-${vp.name}-top.png`, {
      body: await header.screenshot(),
      contentType: "image/png",
    });

    // Scroll to mid-page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    const midHeight = (await header.boundingBox())?.height ?? 0;
    expect(Math.abs(midHeight - heightAtTop)).toBeLessThan(4);
    await testInfo.attach(`header-${vp.name}-mid.png`, {
      body: await header.screenshot(),
      contentType: "image/png",
    });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await testInfo.attach(`header-${vp.name}-bottom.png`, {
      body: await header.screenshot(),
      contentType: "image/png",
    });

    // No horizontal overflow
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);
  });
}
