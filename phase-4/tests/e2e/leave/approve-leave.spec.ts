import { test, expect } from "../fixtures/auth.fixture";
import {
  createIsolatedLeaveRequest,
  cleanupTestData,
  disconnectPrisma,
} from "../fixtures/test-data.fixture";

/**
 * Horizon Portal — Journey 3: Leave Approval & RBAC Enforcement E2E Tests
 * tests/e2e/leave/approve-leave.spec.ts
 *
 * Verifies:
 * 1. Independent data provisioning: seeds an isolated pending request directly.
 * 2. Authorized Manager logs in, locates the request, confirms approval, and verifies
 *    status transition to "Approved".
 * 3. Role-Based Access Control (RBAC): Employee cannot view or access the approval queue (HTTP 403).
 * 4. Strict teardown of test records.
 */

test.describe("Journey 3: Manager Leave Approval & RBAC", () => {
  let isolatedRequest: Awaited<ReturnType<typeof createIsolatedLeaveRequest>>;

  test.beforeEach(async () => {
    // Create an independent pending leave request for Sophie Chen (EMP-0188)
    // reporting to Manager Marcus Brody (EMP-0547)
    isolatedRequest = await createIsolatedLeaveRequest({
      employeeId: "EMP-0188",
      leaveTypeCode: "CL",
      days: 1.0,
      reason: `E2E-INDEPENDENT-APPR-${Date.now()}`,
      status: "Pending",
    });
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test("3.1 Authorized Manager reviews and approves pending leave request", async ({
    authenticatedManagerPage: page,
  }) => {
    await page.goto("/approvals");
    await page.waitForLoadState("domcontentloaded");

    // Verify page heading and navigation tabs
    await expect(page.locator("h1")).toContainText(/Leave Approvals|Approval Queue/i);
    await expect(page.getByRole("button", { name: /Pending Review/i })).toBeVisible();

    // Ensure the Pending Review tab is active
    await page.getByRole("button", { name: /Pending Review/i }).click();

    // Search for employee or find the row matching the isolated request
    const searchInput = page.locator('input[placeholder*="Search employee"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("EMP-0188");
      // Wait for debounce and network refresh
      await page.waitForResponse((res) => res.url().includes("/api/v1/approvals/leave")).catch(() => {});
    }

    // Locate the row for the pending leave request by employee ID
    const targetRow = page.locator('tr:has-text("EMP-0188")').first();
    await expect(targetRow).toBeVisible({ timeout: 12000 });
    await expect(targetRow).toContainText("Pending");

    // Click "Approve" button inside the target row
    const approveBtn = targetRow.locator('button:has-text("Approve")');
    await approveBtn.click();

    // Confirm Approval modal opens
    const modalHeading = page.locator("h3:has-text('Confirm Leave Approval')");
    await expect(modalHeading).toBeVisible({ timeout: 8000 });

    // Click "Confirm Approval" inside the modal
    const confirmApproveBtn = page.locator(
      'button:has-text("Confirm Approval")'
    );

    const [approvalResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/approvals/leave") &&
          res.url().includes("/approve") &&
          res.request().method() === "POST"
      ),
      confirmApproveBtn.click(),
    ]);

    expect(approvalResponse.status()).toBe(200);

    // Verify success banner appears
    await expect(
      page.getByText(/has been successfully approved/i)
    ).toBeVisible({ timeout: 10000 });

    // Switch to "Approved History" tab and verify the request transitioned to Approved
    const approvedTab = page.getByRole("button", { name: /Approved History/i });
    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/v1/approvals/leave")).catch(() => {}),
      approvedTab.click(),
    ]);

    // Verify row appears under Approved tab
    const approvedRow = page.locator('tr:has-text("EMP-0188")').first();
    await expect(approvedRow).toBeVisible({ timeout: 10000 });
    await expect(approvedRow).toContainText("Approved");
  });

  test("3.2 Unauthorized Employee is denied access to the approval queue (RBAC 403)", async ({
    authenticatedEmployeePage: page,
  }) => {
    // 1. API Level Defense: GET /api/v1/approvals/leave returns HTTP 403 Forbidden
    const apiResult = await page.evaluate(async () => {
      const res = await fetch("/api/v1/approvals/leave");
      const json = await res.json().catch(() => ({}));
      return { status: res.status, error: json.error };
    });

    expect(apiResult.status).toBe(403);
    expect(apiResult.error).toContain("Forbidden: Employees do not have permission");

    // 2. Route Level Defense: Navigating to /approvals redirects Employee away to /dashboard
    await page.goto("/approvals");
    await page.waitForLoadState("domcontentloaded");

    // Verify redirected away from /approvals with unauthorized error flag
    await expect(page).toHaveURL(/dashboard.*error=unauthorized/);

    // 3. UI Level Defense: Sidebar navigation strictly hides Team Approvals from Employee
    await expect(page.locator('a[href="/approvals"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Confirm Approval")')).not.toBeVisible();
  });
});
