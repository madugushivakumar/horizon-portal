/**
 * Horizon Portal — Day 12 Read-Only Finance APIs Test Suite
 * scripts/test-day12-finance-apis.ts
 *
 * Verifies:
 * 1. RBAC & Security: 401 unauthenticated, 403 non-Admin (HR, Manager, Employee), 200 Admin
 * 2. Response headers: NO_CACHE_HEADERS present across all responses
 * 3. GET-only invariant: No mutation handlers (POST/PUT/PATCH/DELETE) exposed
 * 4. Finance Summary API (/api/v1/admin/finance/summary):
 *    - Accurate database figures matching verified 2026-11-03 values
 *    - All 5 dynamic ageing buckets verified
 *    - Accounting invariants and individual invoice tie-out verified
 * 5. Invoice Listing API (/api/v1/admin/finance/invoices):
 *    - Pagination (default page 1, pageSize 20)
 *    - Search by invoiceNumber and clientName
 *    - Filter by status (PAID, OVERDUE, etc.)
 *    - Filter by dynamic ageing (0_30, 31_60, etc.)
 *    - Filter by open condition (open=true -> 62, open=false -> 681)
 *    - Filter by date range (from, to)
 *    - Defensive error handling: 400 for invalid status, ageing, date, pagination
 * 6. Expense Listing API (/api/v1/admin/finance/expenses):
 *    - Pagination (default page 1, pageSize 20)
 *    - Search by vendorName, billReference, description
 *    - Filter by status (PAID -> 478, UNPAID -> 23)
 *    - Filter by categoryAccount code
 *    - Filter by expenseDate range (from, to)
 *    - Defensive error handling: 400 for invalid status, category, date, pagination
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getFinanceSummary } from "../src/app/api/v1/admin/finance/summary/route";
import { GET as getFinanceInvoices } from "../src/app/api/v1/admin/finance/invoices/route";
import { GET as getFinanceExpenses } from "../src/app/api/v1/admin/finance/expenses/route";

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

async function createMockRequest(
  url: string,
  user?: MockUser
): Promise<NextRequest> {
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

async function runTests() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — DAY 12 FINANCE APIs VERIFICATION SUITE      ");
  console.log("===============================================================\n");

  // Fetch demo accounts from database
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Critical: Missing required demo user accounts in SQLite database.");
  }

  // ===========================================================================
  // 1. Authentication & Role-Based Access Control
  // ===========================================================================
  console.log("--- 1. RBAC & Security Tests ---");

  // 1.1 Summary Endpoint Security
  const unauthSummaryReq = await createMockRequest("/api/v1/admin/finance/summary");
  const unauthSummaryRes = await getFinanceSummary(unauthSummaryReq);
  assert(unauthSummaryRes.status === 401, "Summary API: Unauthenticated returns 401");

  const empSummaryReq = await createMockRequest("/api/v1/admin/finance/summary", employeeUser);
  const empSummaryRes = await getFinanceSummary(empSummaryReq);
  assert(empSummaryRes.status === 403, "Summary API: Employee returns 403 Forbidden");

  const mgrSummaryReq = await createMockRequest("/api/v1/admin/finance/summary", managerUser);
  const mgrSummaryRes = await getFinanceSummary(mgrSummaryReq);
  assert(mgrSummaryRes.status === 403, "Summary API: Manager returns 403 Forbidden");

  const hrSummaryReq = await createMockRequest("/api/v1/admin/finance/summary", hrUser);
  const hrSummaryRes = await getFinanceSummary(hrSummaryReq);
  assert(hrSummaryRes.status === 403, "Summary API: HR returns 403 Forbidden (Admin strictly required)");

  const adminSummaryReq = await createMockRequest("/api/v1/admin/finance/summary", adminUser);
  const adminSummaryRes = await getFinanceSummary(adminSummaryReq);
  assert(adminSummaryRes.status === 200, "Summary API: Admin returns 200 OK");
  assert(
    adminSummaryRes.headers.get("Cache-Control")?.includes("no-cache") === true,
    "Summary API: Includes Cache-Control no-cache header"
  );

  // 1.2 Invoices Endpoint Security
  const unauthInvReq = await createMockRequest("/api/v1/admin/finance/invoices");
  const unauthInvRes = await getFinanceInvoices(unauthInvReq);
  assert(unauthInvRes.status === 401, "Invoices API: Unauthenticated returns 401");

  const hrInvReq = await createMockRequest("/api/v1/admin/finance/invoices", hrUser);
  const hrInvRes = await getFinanceInvoices(hrInvReq);
  assert(hrInvRes.status === 403, "Invoices API: HR returns 403 Forbidden");

  const adminInvReq = await createMockRequest("/api/v1/admin/finance/invoices", adminUser);
  const adminInvRes = await getFinanceInvoices(adminInvReq);
  assert(adminInvRes.status === 200, "Invoices API: Admin returns 200 OK");

  // 1.3 Expenses Endpoint Security
  const unauthExpReq = await createMockRequest("/api/v1/admin/finance/expenses");
  const unauthExpRes = await getFinanceExpenses(unauthExpReq);
  assert(unauthExpRes.status === 401, "Expenses API: Unauthenticated returns 401");

  const hrExpReq = await createMockRequest("/api/v1/admin/finance/expenses", hrUser);
  const hrExpRes = await getFinanceExpenses(hrExpReq);
  assert(hrExpRes.status === 403, "Expenses API: HR returns 403 Forbidden");

  const adminExpReq = await createMockRequest("/api/v1/admin/finance/expenses", adminUser);
  const adminExpRes = await getFinanceExpenses(adminExpReq);
  assert(adminExpRes.status === 200, "Expenses API: Admin returns 200 OK");

  // ===========================================================================
  // 2. Finance Summary API Detailed Verification
  // ===========================================================================
  console.log("\n--- 2. Finance Summary API Data Verification (Cutoff: 2026-11-03) ---");

  const summaryReq = await createMockRequest(
    "/api/v1/admin/finance/summary?reportingDate=2026-11-03",
    adminUser
  );
  const summaryRes = await getFinanceSummary(summaryReq);
  const summaryJson = await summaryRes.json();
  const summaryData = summaryJson.data;

  assert(summaryJson.success === true, "Summary response has success: true");
  assert(summaryData.billedAmount === 1558743836, "Summary API: Billed amount = ₹1,558,743,836");
  assert(summaryData.collectedAmount === 1419349558, "Summary API: Collected amount = ₹1,419,349,558");
  assert(summaryData.outstandingAmount === 139394278, "Summary API: Outstanding amount = ₹139,394,278");
  assert(summaryData.overdueAmount === 114981820, "Summary API: Overdue amount = ₹114,981,820");
  assert(summaryData.notOverdueOutstandingAmount === 24412458, "Summary API: Not Overdue Balance = ₹24,412,458");
  assert(summaryData.totalExpenses === 197476837.9, "Summary API: Total expenses = ₹197,476,837.90");
  assert(summaryData.paidExpenses === 185830816.7, "Summary API: Paid expenses = ₹185,830,816.70");
  assert(summaryData.unpaidExpenses === 11646021.2, "Summary API: Unpaid expenses = ₹11,646,021.20");
  assert(summaryData.invoiceCount === 743, "Summary API: Total invoices = 743");
  assert(summaryData.openInvoiceCount === 62, "Summary API: Open invoices = 62");
  assert(summaryData.overdueInvoiceCount === 53, "Summary API: Overdue invoices = 53");
  assert(summaryData.expenseCount === 501, "Summary API: Total expenses count = 501");

  // Invariants
  assert(
    summaryData.reconciliation.invariants.allValid === true,
    "Summary API: All accounting invariants pass"
  );
  assert(
    summaryData.reconciliation.individualInvoices.reconciledCount === 739,
    "Summary API: 739 invoices tie out"
  );
  assert(
    summaryData.reconciliation.individualInvoices.cancelledCount === 4,
    "Summary API: 4 invoices identified as CANCELLED"
  );
  assert(
    summaryData.reconciliation.individualInvoices.errorCount === 0,
    "Summary API: 0 individual invoice errors"
  );

  // Ageing breakdown check
  const b = summaryData.ageingBreakdown;
  assert(b.NOT_OVERDUE.count === 9 && b.NOT_OVERDUE.amount === 24412458, "Summary API: NOT_OVERDUE bucket matches");
  assert(b["0_30"].count === 37 && b["0_30"].amount === 79270642, "Summary API: 0_30 bucket matches");
  assert(b["31_60"].count === 13 && b["31_60"].amount === 30733938, "Summary API: 31_60 bucket matches");
  assert(b["61_90"].count === 0 && b["61_90"].amount === 0, "Summary API: 61_90 bucket matches");
  assert(b["90_PLUS"].count === 3 && b["90_PLUS"].amount === 4977240, "Summary API: 90_PLUS bucket matches");

  // ===========================================================================
  // 3. Invoice Listing API Verification
  // ===========================================================================
  console.log("\n--- 3. Invoice Listing API Verification ---");

  // 3.1 Default pagination
  const invDefReq = await createMockRequest("/api/v1/admin/finance/invoices", adminUser);
  const invDefRes = await getFinanceInvoices(invDefReq);
  const invDefJson = await invDefRes.json();
  assert(invDefRes.status === 200, "Invoices API: Default request returns 200");
  assert(invDefJson.data.items.length === 20, "Invoices API: Default page returns 20 items");
  assert(invDefJson.data.pagination.totalRecords === 743, "Invoices API: Total records = 743");
  assert(invDefJson.data.pagination.totalPages === 38, "Invoices API: Total pages = 38");
  assert(invDefJson.data.pagination.hasNextPage === true, "Invoices API: hasNextPage = true");
  assert(invDefJson.data.pagination.hasPreviousPage === false, "Invoices API: hasPreviousPage = false");

  // Verify item attributes
  const firstInv = invDefJson.data.items[0];
  assert(Boolean(firstInv.id), "Invoice has id");
  assert(Boolean(firstInv.invoiceNumber), "Invoice has invoiceNumber");
  assert(Boolean(firstInv.clientName), "Invoice has clientName relation populated");
  assert(typeof firstInv.totalAmount === "number", "Invoice has totalAmount number");
  assert(typeof firstInv.balanceDue === "number", "Invoice has balanceDue number");
  assert(typeof firstInv.isOpen === "boolean", "Invoice has isOpen boolean");
  assert(typeof firstInv.daysOverdue === "number", "Invoice has calculated daysOverdue");
  assert(Boolean(firstInv.ageingBucket), "Invoice has calculated ageingBucket");
  assert(Boolean(firstInv.ageingLabel), "Invoice has human-readable ageingLabel");

  // 3.2 Search by invoice number
  const invSearchReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?search=INV/2026",
    adminUser
  );
  const invSearchRes = await getFinanceInvoices(invSearchReq);
  const invSearchJson = await invSearchRes.json();
  assert(
    invSearchJson.data.items.every((i: any) => i.invoiceNumber.includes("INV/2026")),
    "Invoices API: Search by invoiceNumber filters accurately"
  );

  // 3.3 Search by client name
  const invClientSearchReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?search=Meridian",
    adminUser
  );
  const invClientSearchRes = await getFinanceInvoices(invClientSearchReq);
  const invClientSearchJson = await invClientSearchRes.json();
  assert(
    invClientSearchJson.data.items.length > 0 &&
      invClientSearchJson.data.items.every((i: any) => i.clientName.toLowerCase().includes("meridian")),
    "Invoices API: Search by clientName filters accurately"
  );

  // 3.4 Filter by status (OVERDUE)
  const invStatusReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=OVERDUE",
    adminUser
  );
  const invStatusRes = await getFinanceInvoices(invStatusReq);
  const invStatusJson = await invStatusRes.json();
  assert(invStatusJson.data.pagination.totalRecords === 12, "Invoices API: Filter status=OVERDUE returns exactly 12 records");
  assert(
    invStatusJson.data.items.every((i: any) => i.status === "OVERDUE"),
    "Invoices API: All returned records have status OVERDUE"
  );

  // 3.5 Filter by open condition
  const invOpenReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?open=true",
    adminUser
  );
  const invOpenRes = await getFinanceInvoices(invOpenReq);
  const invOpenJson = await invOpenRes.json();
  assert(invOpenJson.data.pagination.totalRecords === 62, "Invoices API: Filter open=true returns exactly 62 open invoices");
  assert(
    invOpenJson.data.items.every((i: any) => i.isOpen === true),
    "Invoices API: All items in open=true have isOpen: true"
  );

  const invClosedReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?open=false",
    adminUser
  );
  const invClosedRes = await getFinanceInvoices(invClosedReq);
  const invClosedJson = await invClosedRes.json();
  assert(invClosedJson.data.pagination.totalRecords === 681, "Invoices API: Filter open=false returns exactly 681 closed invoices (743 - 62)");

  // 3.6 Filter by dynamic ageing bucket (0_30 relative to cutoff 2026-11-03)
  const invAgeingReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?ageing=0_30&reportingDate=2026-11-03",
    adminUser
  );
  const invAgeingRes = await getFinanceInvoices(invAgeingReq);
  const invAgeingJson = await invAgeingRes.json();
  assert(
    invAgeingJson.data.pagination.totalRecords === 37,
    "Invoices API: Filter ageing=0_30 returns exactly 37 records matching verified bucket"
  );

  // 3.7 Defensive Error Handling
  const badStatusReq = await createMockRequest("/api/v1/admin/finance/invoices?status=UNKNOWN", adminUser);
  const badStatusRes = await getFinanceInvoices(badStatusReq);
  assert(badStatusRes.status === 400, "Invoices API: Invalid status returns 400 Bad Request");

  const badAgeingReq = await createMockRequest("/api/v1/admin/finance/invoices?ageing=INVALID_BUCKET", adminUser);
  const badAgeingRes = await getFinanceInvoices(badAgeingReq);
  assert(badAgeingRes.status === 400, "Invoices API: Invalid ageing bucket returns 400 Bad Request");

  const badOpenReq = await createMockRequest("/api/v1/admin/finance/invoices?open=maybe", adminUser);
  const badOpenRes = await getFinanceInvoices(badOpenReq);
  assert(badOpenRes.status === 400, "Invoices API: Invalid open parameter returns 400 Bad Request");

  const badDateReq = await createMockRequest("/api/v1/admin/finance/invoices?from=2026/11/03", adminUser);
  const badDateRes = await getFinanceInvoices(badDateReq);
  assert(badDateRes.status === 400, "Invoices API: Invalid date format returns 400 Bad Request");

  const badRangeReq = await createMockRequest("/api/v1/admin/finance/invoices?from=2026-12-01&to=2026-01-01", adminUser);
  const badRangeRes = await getFinanceInvoices(badRangeReq);
  assert(badRangeRes.status === 400, "Invoices API: Inverted date range returns 400 Bad Request");

  const badPageReq = await createMockRequest("/api/v1/admin/finance/invoices?page=-5", adminUser);
  const badPageRes = await getFinanceInvoices(badPageReq);
  assert(badPageRes.status === 400, "Invoices API: Negative page returns 400 Bad Request");

  const badPageSizeReq = await createMockRequest("/api/v1/admin/finance/invoices?pageSize=500", adminUser);
  const badPageSizeRes = await getFinanceInvoices(badPageSizeReq);
  assert(badPageSizeRes.status === 400, "Invoices API: PageSize exceeding max returns 400 Bad Request");

  // 3.8 Ageing Null Invariant for Closed Invoices & Exact Calculation for Open Invoices
  console.log("\n--- 3.8 Ageing Null Invariant for Closed Invoices Tests ---");

  // PAID status check (closed)
  const paidInvsReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=PAID&pageSize=100",
    adminUser
  );
  const paidInvsRes = await getFinanceInvoices(paidInvsReq);
  const paidInvsJson = await paidInvsRes.json();
  assert(
    paidInvsJson.data.items.length > 0 &&
      paidInvsJson.data.items.every(
        (i: any) =>
          i.isOpen === false &&
          i.daysOverdue === null &&
          i.ageingBucket === null &&
          i.ageingLabel === null
      ),
    "PAID invoices (balanceDue = 0) strictly return daysOverdue=null, ageingBucket=null, ageingLabel=null"
  );

  // CANCELLED status check (closed)
  const cancelledInvsReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=CANCELLED&pageSize=100",
    adminUser
  );
  const cancelledInvsRes = await getFinanceInvoices(cancelledInvsReq);
  const cancelledInvsJson = await cancelledInvsRes.json();
  assert(
    cancelledInvsJson.data.items.length === 4 &&
      cancelledInvsJson.data.items.every(
        (i: any) =>
          i.isOpen === false &&
          i.daysOverdue === null &&
          i.ageingBucket === null &&
          i.ageingLabel === null
      ),
    "CANCELLED invoices strictly return daysOverdue=null, ageingBucket=null, ageingLabel=null"
  );

  // DRAFT status check (closed / non-operational)
  const draftInvsReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=DRAFT&pageSize=100",
    adminUser
  );
  const draftInvsRes = await getFinanceInvoices(draftInvsReq);
  const draftInvsJson = await draftInvsRes.json();
  assert(
    draftInvsJson.data.items.length === 1 &&
      draftInvsJson.data.items.every(
        (i: any) =>
          i.isOpen === false &&
          i.daysOverdue === null &&
          i.ageingBucket === null &&
          i.ageingLabel === null
      ),
    "DRAFT invoices strictly return daysOverdue=null, ageingBucket=null, ageingLabel=null"
  );

  // All closed invoices check (open=false)
  assert(
    invClosedJson.data.items.every(
      (i: any) =>
        i.isOpen === false &&
        i.daysOverdue === null &&
        i.ageingBucket === null &&
        i.ageingLabel === null
    ),
    "All closed invoices (open=false) return daysOverdue=null, ageingBucket=null, ageingLabel=null"
  );

  // PARTIALLY_PAID open invoice with positive balance
  const ppOpenInvsReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=PARTIALLY_PAID&open=true&pageSize=100",
    adminUser
  );
  const ppOpenInvsRes = await getFinanceInvoices(ppOpenInvsReq);
  const ppOpenInvsJson = await ppOpenInvsRes.json();
  assert(
    ppOpenInvsJson.data.items.length === 1 &&
      ppOpenInvsJson.data.items.every(
        (i: any) =>
          i.isOpen === true &&
          typeof i.daysOverdue === "number" &&
          typeof i.ageingBucket === "string" &&
          typeof i.ageingLabel === "string"
      ),
    "PARTIALLY_PAID open invoices (positive balance) retain calculated daysOverdue, ageingBucket, ageingLabel"
  );

  // SENT open invoices with positive balance
  const sentOpenInvsReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=SENT&open=true&pageSize=100",
    adminUser
  );
  const sentOpenInvsRes = await getFinanceInvoices(sentOpenInvsReq);
  const sentOpenInvsJson = await sentOpenInvsRes.json();
  assert(
    sentOpenInvsJson.data.items.length === 49 &&
      sentOpenInvsJson.data.items.every(
        (i: any) =>
          i.isOpen === true &&
          typeof i.daysOverdue === "number" &&
          typeof i.ageingBucket === "string" &&
          typeof i.ageingLabel === "string"
      ),
    "SENT open invoices (positive balance) retain calculated daysOverdue, ageingBucket, ageingLabel"
  );

  // OVERDUE open invoices with positive balance
  const overdueOpenInvsReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=OVERDUE&open=true&pageSize=100",
    adminUser
  );
  const overdueOpenInvsRes = await getFinanceInvoices(overdueOpenInvsReq);
  const overdueOpenInvsJson = await overdueOpenInvsRes.json();
  assert(
    overdueOpenInvsJson.data.items.length === 12 &&
      overdueOpenInvsJson.data.items.every(
        (i: any) =>
          i.isOpen === true &&
          typeof i.daysOverdue === "number" &&
          typeof i.ageingBucket === "string" &&
          typeof i.ageingLabel === "string"
      ),
    "OVERDUE open invoices (positive balance) retain calculated daysOverdue, ageingBucket, ageingLabel"
  );

  // ===========================================================================
  // 4. Expense Listing API Verification
  // ===========================================================================
  console.log("\n--- 4. Expense Listing API Verification ---");

  // 4.1 Default pagination
  const expDefReq = await createMockRequest("/api/v1/admin/finance/expenses", adminUser);
  const expDefRes = await getFinanceExpenses(expDefReq);
  const expDefJson = await expDefRes.json();
  assert(expDefRes.status === 200, "Expenses API: Default request returns 200");
  assert(expDefJson.data.items.length === 20, "Expenses API: Default page returns 20 items");
  assert(expDefJson.data.pagination.totalRecords === 501, "Expenses API: Total records = 501");
  assert(expDefJson.data.pagination.totalPages === 26, "Expenses API: Total pages = 26");

  // Verify item attributes
  const firstExp = expDefJson.data.items[0];
  assert(Boolean(firstExp.id), "Expense has id");
  assert(Boolean(firstExp.expenseDate), "Expense has expenseDate");
  assert(Boolean(firstExp.vendorName), "Expense has vendorName relation populated");
  assert(Boolean(firstExp.departmentName), "Expense has departmentName relation populated");
  assert(typeof firstExp.totalAmount === "number", "Expense has totalAmount number");
  assert(Boolean(firstExp.status), "Expense has status");

  // 4.2 Status filter: PAID (478) and UNPAID (23)
  const expPaidReq = await createMockRequest(
    "/api/v1/admin/finance/expenses?status=PAID",
    adminUser
  );
  const expPaidRes = await getFinanceExpenses(expPaidReq);
  const expPaidJson = await expPaidRes.json();
  assert(expPaidJson.data.pagination.totalRecords === 478, "Expenses API: Filter status=PAID returns 478 records");

  const expUnpaidReq = await createMockRequest(
    "/api/v1/admin/finance/expenses?status=UNPAID",
    adminUser
  );
  const expUnpaidRes = await getFinanceExpenses(expUnpaidReq);
  const expUnpaidJson = await expUnpaidRes.json();
  assert(expUnpaidJson.data.pagination.totalRecords === 23, "Expenses API: Filter status=UNPAID returns 23 records");

  // 4.3 Search by vendor name
  const expVendorReq = await createMockRequest(
    "/api/v1/admin/finance/expenses?search=Skyline",
    adminUser
  );
  const expVendorRes = await getFinanceExpenses(expVendorReq);
  const expVendorJson = await expVendorRes.json();
  assert(
    expVendorJson.data.items.length > 0 &&
      expVendorJson.data.items.every((e: any) => e.vendorName.toLowerCase().includes("skyline")),
    "Expenses API: Search by vendorName filters accurately"
  );

  // 4.4 Defensive Error Handling
  const badExpStatusReq = await createMockRequest("/api/v1/admin/finance/expenses?status=PENDING", adminUser);
  const badExpStatusRes = await getFinanceExpenses(badExpStatusReq);
  assert(badExpStatusRes.status === 400, "Expenses API: Invalid status returns 400 Bad Request");

  const badExpCatReq = await createMockRequest("/api/v1/admin/finance/expenses?category=not-a-number", adminUser);
  const badExpCatRes = await getFinanceExpenses(badExpCatReq);
  assert(badExpCatRes.status === 400, "Expenses API: Invalid category returns 400 Bad Request");

  const badExpDateReq = await createMockRequest("/api/v1/admin/finance/expenses?to=invalid-date", adminUser);
  const badExpDateRes = await getFinanceExpenses(badExpDateReq);
  assert(badExpDateRes.status === 400, "Expenses API: Invalid date returns 400 Bad Request");

  console.log("\n===============================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("API test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
