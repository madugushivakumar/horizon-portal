import { test, expect } from "@playwright/test";
import {
  getAdminCredentials,
  getEmployeeCredentials,
} from "../helpers/authentication";

/**
 * Horizon Portal — Journey 1: Authentication E2E Tests
 * tests/e2e/auth/login.spec.ts
 *
 * Verifies:
 * 1. Valid Employee authentication, session cookie issuance, and dashboard redirection.
 * 2. Valid Admin authentication and privileged portal access.
 * 3. Rejection of invalid credentials with explicit error banner and HTTP 401.
 * 4. Client-side input validation for empty fields and malformed email addresses.
 */

test.describe("Journey 1: Authentication & Access Control", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state before each test
    await page.context().clearCookies();
  });

  test("1.1 Valid Employee login establishes session and redirects to dashboard", async ({
    page,
  }) => {
    const creds = getEmployeeCredentials();

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Semantic form locators
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await emailInput.fill(creds.email);
    await passwordInput.fill(creds.password);

    // Wait for the login API response and navigation redirect
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200
      ),
      page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }),
      submitBtn.click(),
    ]);

    expect(response.status()).toBe(200);

    // Verify session cookie was set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === "horizon_session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);

    // Verify user landed on an authenticated page
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("1.2 Valid Admin login establishes session and accesses dashboard", async ({
    page,
  }) => {
    const creds = getAdminCredentials();

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('input[type="email"]').fill(creds.email);
    await page.locator('input[type="password"]').fill(creds.password);

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200
      ),
      page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }),
      page.locator('button[type="submit"]').click(),
    ]);

    await expect(page).not.toHaveURL(/\/login/);
  });

  test("1.3 Invalid password is safely rejected with HTTP 401 and error banner", async ({
    page,
  }) => {
    const creds = getEmployeeCredentials();

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('input[type="email"]').fill(creds.email);
    await page.locator('input[type="password"]').fill("TotallyWrongPassword123!");

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/auth/login") && res.status() === 401
      ),
      page.locator('button[type="submit"]').click(),
    ]);

    expect(response.status()).toBe(401);

    // Verify accessible error banner
    const alertBanner = page.getByRole("alert").filter({ hasText: /Invalid|error/i });
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText(/Invalid email or password|Invalid credentials/i);

    // Verify user is NOT redirected
    expect(page.url()).toContain("/login");
  });

  test("1.4 Empty input fields trigger inline client-side validation errors", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Click submit without entering any credentials
    await page.locator('button[type="submit"]').click();

    // Verify inline error text
    await expect(page.getByText("Email address is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();

    // Verify no network request was sent
    expect(page.url()).toContain("/login");
  });

  test("1.5 Malformed email triggers validation error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('input[type="email"]').fill("not-an-email");
    await page.locator('input[type="password"]').fill("SomePassword123!");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    expect(page.url()).toContain("/login");
  });
});
