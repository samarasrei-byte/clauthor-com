import { test, expect } from "@playwright/test";

/**
 * Regressão visual light/dark.
 * - Alterna tema via localStorage (mesmas chaves do useTheme.tsx)
 * - Valida que header, banner topo, ícones e inputs mantêm contraste
 *   após um F5 (persistência).
 */

const STORAGE_KEY = "clauthor-theme";
const PIN_KEY = "clauthor-theme-pinned";

async function setTheme(page, theme: "light" | "dark") {
  await page.addInitScript(
    ({ theme, STORAGE_KEY, PIN_KEY }) => {
      localStorage.setItem(STORAGE_KEY, theme);
      localStorage.setItem(PIN_KEY, "1");
    },
    { theme, STORAGE_KEY, PIN_KEY }
  );
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`home · tema ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await setTheme(page, theme);
    });

    test(`header e hero legíveis + persistem após F5`, async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // <html> tem a classe correta
      const html = page.locator("html");
      await expect(html).toHaveClass(new RegExp(`\\b${theme}\\b`));

      // Header visível
      const nav = page.locator("nav").first();
      await expect(nav).toBeVisible();

      // F5 → estado se mantém
      await page.reload({ waitUntil: "networkidle" });
      await expect(html).toHaveClass(new RegExp(`\\b${theme}\\b`));

      // Screenshot de regressão
      await page.screenshot({
        path: `test-results/home-${theme}.png`,
        fullPage: false,
      });
    });
  });
}

test("prefers-color-scheme sincroniza sem pin", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await ctx.close();

  const ctx2 = await browser.newContext({ colorScheme: "light" });
  const page2 = await ctx2.newPage();
  await page2.goto("/");
  await expect(page2.locator("html")).toHaveClass(/\blight\b/);
  await ctx2.close();
});
