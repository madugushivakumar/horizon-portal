import { test, expect } from "../fixtures/auth.fixture";
import {
  getEmployeePayslip,
  getForeignPayslip,
  disconnectPrisma,
} from "../fixtures/test-data.fixture";

/**
 * Horizon Portal — Journey 4: Payslip Inspection & IDOR Protection E2E Tests
 * tests/e2e/payroll/view-payslip.spec.ts
 *
 * Verifies:
 * 1. Employee navigates to /payslips, sees historical statements, and views detailed itemized payslip.
 * 2. Itemized payslip statement displays correct earnings, deductions, and employee ownership info.
 * 3. Cross-Tenant IDOR Protection: Employee attempting to access another employee's payslip
 *    is blocked with HTTP 403 Forbidden and the "403 Forbidden — Access Denied" screen.
 */

test.describe("Journey 4: Employee Payslips & IDOR Defense", () => {
  let ownedPayslip: Awaited<ReturnType<typeof getEmployeePayslip>>;
  let foreignPayslip: Awaited<ReturnType<typeof getForeignPayslip>>;

  test.beforeAll(async () => {
    // Resolve owned payslip for Sophie Chen (EMP-0188) and a foreign payslip
    ownedPayslip = await getEmployeePayslip("EMP-0188");
    foreignPayslip = await getForeignPayslip("EMP-0188");
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test("4.1 Employee views their own payslip statement and itemized breakdown", async ({
    authenticatedEmployeePage: page,
  }) => {
    // Navigate to /payslips
    await page.goto("/payslips");
    await page.waitForLoadState("domcontentloaded");

    // Verify page header and table
    await expect(page.locator("h1")).toContainText(/Payslip/i);
    const table = page.locator("#payslip-month-list-table");
    await expect(table).toBeVisible({ timeout: 10000 });

    // Target the link to view the employee's statement
    const runId = ownedPayslip.payrollRunId || ownedPayslip.id;
    const viewLink = page.locator(`a[href*="/payslips/${runId}"]`).first();
    await expect(viewLink).toBeVisible();

    // Click link and navigate to detail page
    await Promise.all([
      page.waitForURL((url) => url.pathname.includes(`/payslips/${runId}`), { timeout: 15000 }),
      viewLink.click(),
    ]);

    await page.waitForLoadState("domcontentloaded");

    // Verify itemized payslip statement components
    // 1. Employee identifier
    await expect(page.getByText("EMP-0188")).toBeVisible({ timeout: 8000 });

    // 2. Earnings & Deductions breakdown
    await expect(page.getByText(/Earnings/i).first()).toBeVisible();
    await expect(page.getByText(/Deductions/i).first()).toBeVisible();
    await expect(page.getByText(/Net Pay|Take-Home/i).first()).toBeVisible();
  });

  test("4.2 IDOR Defense: Accessing another employee's payslip returns 403 Forbidden", async ({
    authenticatedEmployeePage: page,
  }) => {
    // Attempt direct URL navigation to foreign employee's payslip
    const foreignTargetId = foreignPayslip.id;

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/payslips/${foreignTargetId}`) &&
          res.status() === 403
      ),
      page.goto(`/payslips/${foreignTargetId}`),
    ]);

    expect(response.status()).toBe(403);
    await page.waitForLoadState("domcontentloaded");

    // Verify accessible 403 Forbidden screen is rendered
    const forbiddenHeading = page.locator("#forbidden-heading");
    await expect(forbiddenHeading).toBeVisible({ timeout: 8000 });
    await expect(forbiddenHeading).toContainText("403 Forbidden — Access Denied");

    // Verify explicit explanatory text
    await expect(
      page.getByText("You do not have permission to access another employee's payslip.")
    ).toBeVisible();

    // Verify foreign employee confidential salary numbers are strictly NOT rendered
    await expect(page.locator("text=Total Gross Pay")).not.toBeVisible();
  });
});
