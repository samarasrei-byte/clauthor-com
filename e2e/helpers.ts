import { expect, Page } from "@playwright/test";

/**
 * Test credentials – override via env. Defaults are placeholders so tests
 * fail fast with a clear message instead of silently passing.
 */
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "";

export function requireCreds() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Missing E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars. Set them before running auth tests."
    );
  }
}

/** Restore a Supabase session from env (LOVABLE_BROWSER_SUPABASE_*) if available. */
export async function restoreSandboxSession(page: Page): Promise<boolean> {
  const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  if (!storageKey || !sessionJson) return false;
  await page.goto("/");
  await page.evaluate(
    ([k, v]) => window.localStorage.setItem(k, v),
    [storageKey, sessionJson] as const
  );
  return true;
}

/** Perform email/password login via UI. */
export async function loginUI(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  requireCreds();
  await page.goto("/auth");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /entrar|sign in|login/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard|\/$/i, { timeout: 15_000 });
}

export async function logoutUI(page: Page) {
  // Logout button lives in DashboardLayout header
  await page.getByRole("button", { name: /sair|logout|sign out/i }).first().click();
  await expect(page).toHaveURL(/\/(auth)?$/);
}
