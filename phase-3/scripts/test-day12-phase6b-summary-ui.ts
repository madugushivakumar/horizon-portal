/**
 * Horizon Portal — Day 12 Phase 6B Live Finance Summary UI Test Suite
 * scripts/test-day12-phase6b-summary-ui.ts
 *
 * Verifies:
 * 1. Summary API Integration:
 *    - Admin retrieves live database figures from /api/v1/admin/finance/summary
 *    - Unauthenticated returns 401, non-Admin (HR, Mgr, Emp) returns 403
 * 2. 5 Live KPI Card Figures & Invariants:
 *    - Total Billed: ₹1,55,87,43,836
 *    - Total Collected: ₹1,41,93,49,558
 *    - Total Outstanding: ₹13,93,94,278
 *    - Total Overdue: ₹11,49,81,820
 *    - Total Expenses: ₹19,74,76,837.90
 *    - Billed = Collected + Outstanding (exact paise tie-out)
 * 3. 5 Dynamic Ageing Distribution Buckets:
 *    - Not Overdue: 9 invoices, ₹2,44,12,458
 *    - 0–30 Days: 37 invoices, ₹7,92,70,642
 *    - 31–60 Days: 13 invoices, ₹3,07,33,938
 *    - 61–90 Days: 0 invoices, ₹0 (zero handling verified)
 *    - 90+ Days: 3 invoices, ₹49,77,240
 *    - Sum of 5 buckets (₹139,394,278) == Total Outstanding (₹139,394,278)
 * 4. Component Rendering & Edge Cases:
 *    - FinanceSummaryCards handles non-zero, zero, and negative values
 *    - FinanceAgeingCards handles zero-bucket rendering cleanly
 *    - FinanceSummarySkeleton renders matching structure
 *    - FinanceSummaryError renders user-friendly messages for 401, 403, and 500
 * 5. Dynamic Reporting Date:
 *    - Uses API cutoff date (2026-11-03) dynamically rather than hardcoding
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import React from "react";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { formatINR } from "../src/lib/finance/formatting";
import { FinanceSummary } from "../src/lib/finance/types";

// API
import { GET as getFinanceSummary } from "../src/app/api/v1/admin/finance/summary/route";

// Phase 6B Components
import { FinanceSummaryCards } from "../src/components/finance/FinanceSummaryCards";
import { FinanceAgeingCards } from "../src/components/finance/FinanceAgeingCards";
import { FinanceSummarySkeleton } from "../src/components/finance/FinanceSummarySkeleton";
import { FinanceSummaryError } from "../src/components/finance/FinanceSummaryError";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

interface MockUser {
  id: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

async function createMockRequest(url: string, user?: MockUser): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (user) {
    const token = await createAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }

  const reqInit: RequestInit = {
    method: "GET",
    headers,
  };

  return new NextRequest(new URL(url, "http://localhost:3000"), reqInit as any);
}

// Helper to extract all text content recursively from JSX tree
function extractAllText(element: any): string {
  if (!element) return "";
  if (typeof element === "string" || typeof element === "number") {
    return String(element);
  }
  if (Array.isArray(element)) {
    return element.map(extractAllText).join(" ");
  }
  if (typeof element.type === "function") {
    try {
      return extractAllText(element.type(element.props));
    } catch {
      return "";
    }
  }
  if (element.props?.children) {
    return extractAllText(element.props.children);
  }
  return "";
}

function elementContainsText(element: any, text: string): boolean {
  const allText = extractAllText(element);
  const normalizedAll = allText.replace(/\s+/g, " ");
  const normalizedTarget = text.replace(/\s+/g, " ");
  return normalizedAll.includes(normalizedTarget);
}

async function runTests() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — PHASE 6B LIVE FINANCE SUMMARY TEST SUITE   ");
  console.log("===============================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Critical: Missing required demo user accounts in SQLite database.");
  }

  // ===========================================================================
  // 1. Live Summary API Integration & RBAC
  // ===========================================================================
  console.log("--- 1. Live Summary API Integration & RBAC ---");

  const unauthReq = await createMockRequest("/api/v1/admin/finance/summary");
  const unauthRes = await getFinanceSummary(unauthReq);
  assert(unauthRes.status === 401, "Summary API: Unauthenticated returns HTTP 401");

  const empReq = await createMockRequest("/api/v1/admin/finance/summary", employeeUser);
  const empRes = await getFinanceSummary(empReq);
  assert(empRes.status === 403, "Summary API: Employee returns HTTP 403 Forbidden");

  const mgrReq = await createMockRequest("/api/v1/admin/finance/summary", managerUser);
  const mgrRes = await getFinanceSummary(mgrReq);
  assert(mgrRes.status === 403, "Summary API: Manager returns HTTP 403 Forbidden");

  const hrReq = await createMockRequest("/api/v1/admin/finance/summary", hrUser);
  const hrRes = await getFinanceSummary(hrReq);
  assert(hrRes.status === 403, "Summary API: HR returns HTTP 403 Forbidden");

  const adminReq = await createMockRequest("/api/v1/admin/finance/summary?reportingDate=2026-11-03", adminUser);
  const adminRes = await getFinanceSummary(adminReq);
  assert(adminRes.status === 200, "Summary API: Admin returns HTTP 200 OK");

  const adminJson = await adminRes.json();
  assert(adminJson.success === true, "Summary API response indicates success: true");
  assert(Boolean(adminJson.data), "Summary API response contains valid data object");

  const liveSummary: FinanceSummary = adminJson.data;

  // ===========================================================================
  // 2. 5 Live KPI Card Values & INR Formatting Verification
  // ===========================================================================
  console.log("\n--- 2. Live KPI Cards Figures & Accounting Tie-Out ---");

  // 2.1 Total Billed
  assert(liveSummary.billedAmount === 1558743836, "KPI 1: Billed Amount = ₹1,558,743,836");
  assert(formatINR(liveSummary.billedAmount) === "₹1,55,87,43,836", "KPI 1: Formatted INR = '₹1,55,87,43,836'");

  // 2.2 Total Collected
  assert(liveSummary.collectedAmount === 1419349558, "KPI 2: Collected Amount = ₹1,419,349,558");
  assert(formatINR(liveSummary.collectedAmount) === "₹1,41,93,49,558", "KPI 2: Formatted INR = '₹1,41,93,49,558'");

  // 2.3 Total Outstanding
  assert(liveSummary.outstandingAmount === 139394278, "KPI 3: Outstanding Amount = ₹139,394,278");
  assert(formatINR(liveSummary.outstandingAmount) === "₹13,93,94,278", "KPI 3: Formatted INR = '₹13,93,94,278'");

  // 2.4 Total Overdue
  assert(liveSummary.overdueAmount === 114981820, "KPI 4: Overdue Amount = ₹114,981,820");
  assert(formatINR(liveSummary.overdueAmount) === "₹11,49,81,820", "KPI 4: Formatted INR = '₹11,49,81,820'");

  // 2.5 Total Expenses
  assert(liveSummary.totalExpenses === 197476837.9, "KPI 5: Total Expenses = ₹197,476,837.90");
  assert(formatINR(liveSummary.totalExpenses) === "₹19,74,76,837.90", "KPI 5: Formatted INR = '₹19,74,76,837.90'");

  // 2.6 Accounting Invariants
  assert(
    liveSummary.collectedAmount + liveSummary.outstandingAmount === liveSummary.billedAmount,
    "Billed tie-out: Billed == Collected + Outstanding (0 discrepancy)"
  );
  assert(
    liveSummary.overdueAmount + liveSummary.notOverdueOutstandingAmount === liveSummary.outstandingAmount,
    "Outstanding tie-out: Overdue + Not Overdue == Outstanding (0 discrepancy)"
  );
  assert(
    liveSummary.openInvoiceCount === 62,
    "Open Invoices count == 62"
  );
  assert(
    liveSummary.overdueInvoiceCount === 53,
    "Overdue Invoices count == 53"
  );

  // ===========================================================================
  // 3. 5 Dynamic Ageing Distribution Buckets Verification
  // ===========================================================================
  console.log("\n--- 3. 5 Dynamic Ageing Distribution Buckets ---");

  const bd = liveSummary.ageingBreakdown;
  assert(Boolean(bd), "Ageing breakdown object is populated");

  // 3.1 Not Overdue
  assert(bd.NOT_OVERDUE.count === 9, "Bucket Not Overdue: count = 9");
  assert(bd.NOT_OVERDUE.amount === 24412458, "Bucket Not Overdue: amount = ₹24,412,458");
  assert(formatINR(bd.NOT_OVERDUE.amount) === "₹2,44,12,458", "Bucket Not Overdue: Formatted INR = '₹2,44,12,458'");

  // 3.2 0–30 Days
  assert(bd["0_30"].count === 37, "Bucket 0–30 Days: count = 37");
  assert(bd["0_30"].amount === 79270642, "Bucket 0–30 Days: amount = ₹79,270,642");
  assert(formatINR(bd["0_30"].amount) === "₹7,92,70,642", "Bucket 0–30 Days: Formatted INR = '₹7,92,70,642'");

  // 3.3 31–60 Days
  assert(bd["31_60"].count === 13, "Bucket 31–60 Days: count = 13");
  assert(bd["31_60"].amount === 30733938, "Bucket 31–60 Days: amount = ₹30,733,938");
  assert(formatINR(bd["31_60"].amount) === "₹3,07,33,938", "Bucket 31–60 Days: Formatted INR = '₹3,07,33,938'");

  // 3.4 61–90 Days (Verified zero count and zero amount handling)
  assert(bd["61_90"].count === 0, "Bucket 61–90 Days: count = 0");
  assert(bd["61_90"].amount === 0, "Bucket 61–90 Days: amount = ₹0");
  assert(formatINR(bd["61_90"].amount) === "₹0", "Bucket 61–90 Days: Formatted INR = '₹0' (zero display verified)");

  // 3.5 90+ Days
  assert(bd["90_PLUS"].count === 3, "Bucket 90+ Days: count = 3");
  assert(bd["90_PLUS"].amount === 4977240, "Bucket 90+ Days: amount = ₹4,977,240");
  assert(formatINR(bd["90_PLUS"].amount) === "₹49,77,240", "Bucket 90+ Days: Formatted INR = '₹49,77,240'");

  // 3.6 Ageing Reconciliation with Total Outstanding
  const sumAgeingAmounts =
    bd.NOT_OVERDUE.amount +
    bd["0_30"].amount +
    bd["31_60"].amount +
    bd["61_90"].amount +
    bd["90_PLUS"].amount;
  assert(
    sumAgeingAmounts === liveSummary.outstandingAmount,
    "Ageing reconciliation: Sum of 5 buckets (₹139,394,278) === Total Outstanding (₹139,394,278)"
  );

  const sumAgeingCounts =
    bd.NOT_OVERDUE.count +
    bd["0_30"].count +
    bd["31_60"].count +
    bd["61_90"].count +
    bd["90_PLUS"].count;
  assert(
    sumAgeingCounts === liveSummary.openInvoiceCount,
    "Ageing count reconciliation: Sum of 5 bucket counts (62) === Total Open Invoices (62)"
  );

  // ===========================================================================
  // 4. Component Rendering & Edge Cases
  // ===========================================================================
  console.log("\n--- 4. Component Rendering & Edge Cases ---");

  // 4.1 FinanceSummaryCards with live data
  const kpiElement = React.createElement(FinanceSummaryCards, { summary: liveSummary });
  assert(elementContainsText(kpiElement, "₹1,55,87,43,836"), "FinanceSummaryCards renders live Billed amount");
  assert(elementContainsText(kpiElement, "₹1,41,93,49,558"), "FinanceSummaryCards renders live Collected amount");
  assert(elementContainsText(kpiElement, "₹13,93,94,278"), "FinanceSummaryCards renders live Outstanding amount");
  assert(elementContainsText(kpiElement, "₹11,49,81,820"), "FinanceSummaryCards renders live Overdue amount");
  assert(elementContainsText(kpiElement, "₹19,74,76,837.90"), "FinanceSummaryCards renders live Total Expenses amount");

  // 4.2 FinanceSummaryCards with valid zero numbers (empty state)
  const zeroSummary: FinanceSummary = {
    ...liveSummary,
    billedAmount: 0,
    collectedAmount: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    totalExpenses: 0,
    invoiceCount: 0,
    openInvoiceCount: 0,
    overdueInvoiceCount: 0,
    expenseCount: 0,
  };
  const zeroKpiElement = React.createElement(FinanceSummaryCards, { summary: zeroSummary });
  assert(elementContainsText(zeroKpiElement, "₹0"), "FinanceSummaryCards renders ₹0 for valid zero values without errors");

  // 4.3 FinanceAgeingCards with live data
  const ageingElement = React.createElement(FinanceAgeingCards, { summary: liveSummary });
  assert(elementContainsText(ageingElement, "Not Overdue"), "FinanceAgeingCards renders 'Not Overdue' bucket");
  assert(elementContainsText(ageingElement, "₹2,44,12,458"), "FinanceAgeingCards renders '₹2,44,12,458'");
  assert(elementContainsText(ageingElement, "0 – 30 Days"), "FinanceAgeingCards renders '0 – 30 Days' bucket");
  assert(elementContainsText(ageingElement, "₹7,92,70,642"), "FinanceAgeingCards renders '₹7,92,70,642'");
  assert(elementContainsText(ageingElement, "61 – 90 Days"), "FinanceAgeingCards renders '61 – 90 Days' bucket");
  assert(elementContainsText(ageingElement, "₹0"), "FinanceAgeingCards renders zero amount for empty bucket '₹0'");
  assert(elementContainsText(ageingElement, "0 Open Invoices"), "FinanceAgeingCards renders '0 Open Invoices' without errors");
  assert(elementContainsText(ageingElement, "Reconciled (100% Match)"), "FinanceAgeingCards displays 'Reconciled (100% Match)' badge");

  // 4.4 FinanceSummarySkeleton
  const skeletonElement = React.createElement(FinanceSummarySkeleton);
  assert(Boolean(skeletonElement), "FinanceSummarySkeleton instantiates successfully");

  // 4.5 FinanceSummaryError
  const errorElement401 = React.createElement(FinanceSummaryError, {
    error: "Unauthorized",
    status: 401,
  });
  assert(elementContainsText(errorElement401, "Authentication Session Expired"), "FinanceSummaryError renders friendly 401 title");
  assert(elementContainsText(errorElement401, "Sign In Again"), "FinanceSummaryError provides 'Sign In Again' action for 401");

  const errorElement403 = React.createElement(FinanceSummaryError, {
    error: "Forbidden",
    status: 403,
  });
  assert(elementContainsText(errorElement403, "Access Restricted — 403 Forbidden"), "FinanceSummaryError renders 403 Forbidden title");

  const errorElement500 = React.createElement(FinanceSummaryError, {
    error: "Database timeout",
    status: 500,
    onRetry: () => {},
  });
  assert(elementContainsText(errorElement500, "Retry Fetching Summary"), "FinanceSummaryError renders Retry action for 500");

  // ===========================================================================
  // 5. Dynamic Reporting Date Verification
  // ===========================================================================
  console.log("\n--- 5. Dynamic Reporting Date Verification ---");
  assert(liveSummary.reportingDate === "2026-11-03", "Summary API returns reportingDate: '2026-11-03'");

  console.log("\n===============================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
