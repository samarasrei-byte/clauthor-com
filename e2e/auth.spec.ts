import { test, expect } from "@playwright/test";
import { loginUI, logoutUI, restoreSandboxSession, TEST_EMAIL, TEST_PASSWORD } from "./helpers";

test.describe("Auth flow", () => {
  test("unauthenticated user is redirected from /dashboard to /auth", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test("auth page renders form on desktop & mobile", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });

  test.describe("with credentials", () => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run");

    test("login → dashboard → logout", async ({ page }) => {
      await loginUI(page);
      await expect(page).toHaveURL(/\/dashboard/);
      await logoutUI(page);
      // After logout, dashboard must redirect to auth again
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/auth/);
    });

    test("session persists after reload", async ({ page }) => {
      await loginUI(page);
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("session persists in a new tab (same context)", async ({ page, context }) => {
      await loginUI(page);
      const tab2 = await context.newPage();
      await tab2.goto("/dashboard");
      await expect(tab2).toHaveURL(/\/dashboard/);
    });
  });

  test.describe("with sandbox session env", () => {
    test("restored session reaches /dashboard", async ({ page }) => {
      const ok = await restoreSandboxSession(page);
      test.skip(!ok, "LOVABLE_BROWSER_SUPABASE_* env vars not set");
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
