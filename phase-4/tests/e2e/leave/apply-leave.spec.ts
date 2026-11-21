import { test, expect } from "../fixtures/auth.fixture";
import { cleanupTestData } from "../fixtures/test-data.fixture";
import { PrismaClient } from "@prisma/client";

/**
 * Horizon Portal — Journey 2: Apply Leave E2E Tests
 * tests/e2e/leave/apply-leave.spec.ts
 *
 * Verifies:
 * 1. Self-service leave dashboard renders balances and submission interface.
 * 2. Employee successfully submits a valid leave request and verifies it appears in "Pending" status.
 * 3. Form enforces date validation: rejects end dates earlier than start dates.
 * 4. All test data is strictly isolated and cleaned up post-test.
 */

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db",
    },
  },
});

test.describe("Journey 2: Employee Leave Application", () => {
  const createdTestReasons: string[] = [];

  test.afterEach(async () => {
    // Delete any leave requests created during this test run
    if (createdTestReasons.length > 0) {
      await prisma.leaveRequest.deleteMany({
        where: {
          reason: { in: createdTestReasons },
        },
      });
      createdTestReasons.length = 0;
    }
    // Restore Sophie Chen (EMP-0188) balance to baseline
    await prisma.leaveBalance.update({
      where: { employeeId: "EMP-0188" },
      data: { clBalance: 12, pendingDays: 0 },
    }).catch(() => {});
    await cleanupTestData();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("2.1 Employee navigates to /leave and submits a valid leave request", async ({
    authenticatedEmployeePage: page,
  }) => {
    await page.goto("/leave");
    await page.waitForLoadState("domcontentloaded");

    // Verify page header
    const pageTitle = page.locator("h1");
    await expect(pageTitle).toContainText("Leave & Attendance Self-Service");

    // Verify balance cards are visible
    await expect(page.getByText("Available Time-Off Balances")).toBeVisible();

    // Prepare distinct future dates (e.g. 10 and 11 days from now)
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() + 10);
    // Ensure Monday-Friday
    if (startDateObj.getDay() === 0) startDateObj.setDate(startDateObj.getDate() + 1);
    if (startDateObj.getDay() === 6) startDateObj.setDate(startDateObj.getDate() + 2);

    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);
    if (endDateObj.getDay() === 6) endDateObj.setDate(endDateObj.getDate() + 2);
    if (endDateObj.getDay() === 0) endDateObj.setDate(endDateObj.getDate() + 1);

    const startDateStr = startDateObj.toISOString().split("T")[0];
    const endDateStr = endDateObj.toISOString().split("T")[0];

    const uniqueReason = `E2E-APPLY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    createdTestReasons.push(uniqueReason);

    // Fill the Apply for Leave form
    const categorySelect = page.locator("#leave-type-select");
    const startDateInput = page.locator("#leave-start-date");
    const endDateInput = page.locator("#leave-end-date");
    const reasonTextarea = page.locator("#leave-reason");
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit Leave Request")');

    await categorySelect.selectOption("CL");
    await startDateInput.fill(startDateStr);
    await endDateInput.fill(endDateStr);
    await reasonTextarea.fill(uniqueReason);

    // Submit and wait for API response and table refresh
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/leave/requests") && res.request().method() === "POST"
      ),
      submitBtn.click(),
    ]);

    expect([200, 201]).toContain(response.status());

    // Wait for the automatic dashboard data refresh
    await page.waitForResponse(
      (res) => res.url().includes("/api/v1/leave/requests") && res.request().method() === "GET",
      { timeout: 12000 }
    ).catch(() => {});

    // Verify success banner appears
    await expect(
      page.getByText(/Leave request submitted successfully.*pending review/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify the submitted request is present in Leave Request History table with Pending badge
    const historyTable = page.locator('table[aria-label*="history"], table:has-text("Category")');
    await expect(historyTable).toBeVisible({ timeout: 10000 });

    const requestRow = page.locator(`tr:has-text("${uniqueReason}")`);
    await expect(requestRow).toBeVisible({ timeout: 12000 });
    await expect(requestRow).toContainText("Pending");
  });

  test("2.2 Form rejects submission when end date is earlier than start date", async ({
    authenticatedEmployeePage: page,
  }) => {
    await page.goto("/leave");
    await page.waitForLoadState("domcontentloaded");

    const categorySelect = page.locator("#leave-type-select");
    const startDateInput = page.locator("#leave-start-date");
    const endDateInput = page.locator("#leave-end-date");
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit Leave Request")');

    await categorySelect.selectOption("CL");

    // Invalid range: Start date is Dec 25, End date is Dec 20
    await startDateInput.fill("2026-12-25");
    await endDateInput.fill("2026-12-20");

    await submitBtn.click();

    // Verify validation message
    await expect(
      page.getByText("The leave start date cannot be later than the end date.")
    ).toBeVisible();
  });
});
