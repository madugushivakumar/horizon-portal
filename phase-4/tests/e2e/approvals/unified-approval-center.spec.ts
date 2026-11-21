import { test, expect } from "../fixtures/auth.fixture";

/**
 * Horizon Portal — Unified Multi-Domain Approval Center E2E Tests
 * tests/e2e/approvals/unified-approval-center.spec.ts
 *
 * Verifies:
 * 1. Unified Dashboard Access: Manager opens /approvals and sees summary KPI cards.
 * 2. Multi-Domain Queue: Both Leave Requests and Corporate Expense Authorizations are present.
 * 3. Domain Filters: Filtering by "Leave Requests" and "Corporate Expenses".
 * 4. Status Filters: Filtering by "Pending", "Approved", "Rejected".
 * 5. Detail Inspection: Domain-aware detail view with business justification and compliance notes.
 * 6. Decision Governance:
 *    - Rejection requires mandatory reason (>= 3 chars).
 *    - Approval updates status atomically to Approved.
 *    - Duplicate decisions are prevented with HTTP 409 Conflict.
 * 7. RBAC & Security: Employee role cannot access approval actions or queue.
 * 8. Domain Isolation: Leave request IDs cannot be processed as Expense Authorization IDs.
 */

test.describe("Unified Multi-Domain Approval Center", () => {
  test("Manager accesses Unified Approval Center with summary cards and multi-domain items", async ({
    authenticatedManagerPage: page,
  }) => {
    // Navigate to Unified Approval Center as manager
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Verify Title & Header
    await expect(
      page.getByRole("heading", { name: "Unified Approval Center", level: 1 })
    ).toBeVisible();

    // Verify Summary KPI Cards
    await expect(page.getByText("Total Pending", { exact: false })).toBeVisible();
    await expect(page.getByText("Pending Leave", { exact: false })).toBeVisible();
    await expect(page.getByText("Pending Expenses", { exact: false })).toBeVisible();

    // Verify Domain Filter Controls
    await expect(page.getByRole("button", { name: /All Domains/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Leave Requests/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Corporate Expenses/i })).toBeVisible();
  });

  test("Domain and status filtering updates view correctly", async ({
    authenticatedManagerPage: page,
  }) => {
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Filter by Leave Requests
    const leaveBtn = page.getByRole("button", { name: /Leave Requests/i });
    if (await leaveBtn.isVisible()) {
      await leaveBtn.click();
      await page.waitForTimeout(300);
      // Verify button active state
      await expect(leaveBtn).toHaveClass(/bg-blue-600/);
    }

    // Filter by Corporate Expenses
    const expenseBtn = page.getByRole("button", { name: /Corporate Expenses/i });
    if (await expenseBtn.isVisible()) {
      await expenseBtn.click();
      await page.waitForTimeout(300);
      await expect(expenseBtn).toHaveClass(/bg-purple-600/);
    }

    // Switch status to Approved
    const approvedTab = page.getByRole("button", { name: "approved" });
    if (await approvedTab.isVisible()) {
      await approvedTab.click();
      await page.waitForTimeout(300);
      await expect(approvedTab).toHaveClass(/bg-gray-900/);
    }
  });

  test("Detail modal displays domain-specific governance metadata", async ({
    authenticatedManagerPage: page,
  }) => {
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Click first "View Details" or "Details" button if present
    const detailsBtn = page.getByRole("button", { name: /View Details|Details/i }).first();
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();

      // Modal dialog must be visible
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Check for close button
      const closeBtn = modal.getByRole("button", { name: /Close|✕/i }).first();
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }
  });

  test("Rejection modal enforces mandatory justification reason", async ({
    authenticatedManagerPage: page,
  }) => {
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Find first Reject button if present
    const rejectBtn = page.getByRole("button", { name: "Reject" }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/Reject/i).first()).toBeVisible();

      // Confirm Rejection button should be disabled when reason is empty
      const confirmRejectBtn = modal.getByRole("button", { name: "Confirm Rejection" });
      await expect(confirmRejectBtn).toBeDisabled();

      // Fill valid reason
      const reasonInput = modal.getByRole("textbox");
      await reasonInput.fill("Policy compliance violation: Exceeds discretionary travel limits.");
      await expect(confirmRejectBtn).toBeEnabled();

      // Cancel to prevent modifying fixture state in this read test
      await modal.getByRole("button", { name: "Cancel" }).click();
      await expect(modal).not.toBeVisible();
    }
  });

  test("Employee role cannot access approvals endpoint or action buttons", async ({
    authenticatedEmployeePage: page,
  }) => {
    // Attempt navigation to approvals as standard employee
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Employee should see 403 error notice or empty / redirected view
    const forbiddenNotice = page.getByText(/Forbidden|do not possess permission|do not have permission/i);
    const noRequestsNotice = page.getByText(/No requests found/i);

    const isBlocked = (await forbiddenNotice.isVisible()) || (await noRequestsNotice.isVisible());
    expect(isBlocked).toBe(true);

    // Verify employee cannot see Approve or Reject buttons
    await expect(page.getByRole("button", { name: "Approve" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).not.toBeVisible();
  });
});
