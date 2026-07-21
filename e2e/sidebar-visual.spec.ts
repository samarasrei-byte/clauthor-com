import { test, expect } from "@playwright/test";
import { restoreSandboxSession } from "./helpers";

/**
 * Sidebar UX audit: valida em vários viewports que
 *  - o card do sidebar tem a curva na base (rounded-br)
 *  - a base é compacta (não gruda no fim da tela)
 *  - o conteúdo faz scroll interno, sem transbordar horizontalmente
 *  - não há saltos/desalinhamentos ao rolar
 *
 * Requer sessão autenticada — pula quando as env vars do sandbox
 * (LOVABLE_BROWSER_SUPABASE_*) não estão presentes.
 */

const viewports = [
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop-wide", width: 1600, height: 900 },
  { name: "tablet", width: 1024, height: 900 },
];

for (const vp of viewports) {
  test(`sidebar visual + scroll @ ${vp.name}`, async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "visual pass runs on chromium only");
    await page.setViewportSize({ width: vp.width, height: vp.height });

    const restored = await restoreSandboxSession(page);
    test.skip(!restored, "no sandbox Supabase session — skipping authed sidebar audit");

    await page.goto("/dashboard");

    const sidebar = page.locator('[data-sidebar="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    // Curva na base + sombra
    const cls = await sidebar.getAttribute("class");
    expect(cls).toMatch(/rounded-b[rl]-2xl/);
    expect(cls).toMatch(/shadow-lg/);

    // Base compacta: sidebar deve terminar antes da borda inferior da viewport
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(vp.height - 4);

    // Sem overflow horizontal na página inteira
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Rolar o conteúdo do sidebar não pode empurrar a página inteira
    const beforeY = await page.evaluate(() => window.scrollY);
    await sidebar.hover();
    await page.mouse.wheel(0, 400);
    const afterY = await page.evaluate(() => window.scrollY);
    expect(Math.abs(afterY - beforeY)).toBeLessThan(20);

    await testInfo.attach(`sidebar-${vp.name}.png`, {
      body: await sidebar.screenshot(),
      contentType: "image/png",
    });
  });
}
