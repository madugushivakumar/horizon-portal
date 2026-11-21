import { Page, expect } from "@playwright/test";
import { AccountCredentials } from "./authentication";

/**
 * Horizon Portal — E2E Test Helpers
 * tests/e2e/helpers/test-helpers.ts
 *
 * Reusable, robust automation helpers built on web-first assertions
 * and zero arbitrary sleep calls.
 */

/**
 * Performs full UI login through the /login interface.
 * Fills email and password fields, clicks submit, and waits for successful navigation.
 */
export async function loginAs(page: Page, credentials: AccountCredentials): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  const emailInput = page.locator('input[type="email"], input[name="email"], #email');
  const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
  const submitButton = page.locator('button[type="submit"]');

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  // Submit and wait for redirect away from /login
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }),
    submitButton.click(),
  ]);

  await page.waitForLoadState("domcontentloaded");
}

/**
 * Clears the session and navigates back to /login.
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Waits for a specific API response to settle with the expected HTTP status.
 */
export async function waitForApiResponse(
  page: Page,
  urlSubstring: string,
  expectedStatus = 200,
  timeout = 15000
) {
  return page.waitForResponse(
    (response) =>
      response.url().includes(urlSubstring) && response.status() === expectedStatus,
    { timeout }
  );
}
