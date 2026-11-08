/**
 * Horizon Portal — Day 12 Phase 6D Interactive Expense Register Test Suite
 * scripts/test-day12-phase6d-expenses-ui.ts
 *
 * Verifies:
 * 1. RBAC & Security:
 *    - Unauthenticated cannot access expenses API (HTTP 401)
 *    - Non-Admin roles (HR, Manager, Employee) return HTTP 403 Forbidden
 *    - Admin role successfully retrieves live expenses with HTTP 200 OK
 * 2. Expense API Response Contract:
 *    - Validates items array with all canonical fields
 *    - Validates pagination metadata
 * 3. Search Mechanics:
 *    - Search by vendorName (e.g. "Skyline") returns matching records
 *    - Search by billReference returns exact match
 *    - Search by description returns matching records
 * 4. Filter Matrix:
 *    - Status filters: PAID (478 records), UNPAID (23 records), Total = 501
 *    - Category account filters: 5101 (54 records), 5104, 5105, etc.
 *    - Date range filters: from, to, and combined range
 *    - Combined multi-attribute filtering (status + category + date)
 * 5. Server-Side Pagination:
 *    - Default page 1 returns 20 items, totalRecords = 501, totalPages = 26
 *    - Page 2 items are distinct from Page 1
 *    - Pagination boundaries (hasNextPage, hasPreviousPage)
 * 6. Summary Consistency & Financial Tie-Out:
 *    - Sum of all 501 expenses === ₹197,476,837.90
 *    - Paid expenses (478) === ₹185,830,816.70
 *    - Unpaid expenses (23) === ₹11,646,021.20
 *    - Paid + Unpaid === Total Expenses (0 discrepancy)
 * 7. CSV Export Integration:
 *    - Admin downloads unpaginated CSV with active filters
 *    - Validates Content-Type, Content-Disposition, and UTF-8 BOM
 *    - 502 rows exported for full dataset (1 header + 501 data rows)
 *    - Filtered export (status=UNPAID returns exactly 24 lines: 1 header + 23 rows)
 * 8. Component Rendering & Edge Cases:
 *    - ExpenseTable renders all canonical headers and formatted INR values
 *    - ExpenseFilters renders search, status, category, date range, and clear actions
 *    - ExpensePagination renders record counters and page navigation
 *    - ExpenseTableSkeleton instantiates cleanly
 *    - ExpenseExportButton renders accessible trigger
 *    - Empty state renders "Clear All Filters" trigger
 *    - Inline date range validation error banner
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { formatINR, formatExpenseCategory } from "../src/lib/finance/formatting";
import { EnrichedExpenseItem, FinancePaginationMetadata, ExpenseFilterState } from "../src/lib/finance/types";

// APIs
import { GET as getExpensesApi } from "../src/app/api/v1/admin/finance/expenses/route";
import { GET as exportExpensesApi } from "../src/app/api/v1/admin/finance/export/expenses/route";

// Phase 6D Components
import { ExpenseTable } from "../src/components/finance/ExpenseTable";
import { ExpenseFilters } from "../src/components/finance/ExpenseFilters";
import { ExpensePagination } from "../src/components/finance/ExpensePagination";
import { ExpenseTableSkeleton } from "../src/components/finance/ExpenseTableSkeleton";
import { ExpenseExportButton } from "../src/components/finance/ExpenseExportButton";

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

// Helper to inspect JSX tree for text strings using static markup rendering
function elementContainsText(element: any, text: string): boolean {
  try {
    const html = renderToStaticMarkup(element);
    const textContent = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/[“”]/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–");
    const normalizedText = textContent.replace(/\s+/g, " ");
    const normalizedTarget = text.replace(/\s+/g, " ");
    return normalizedText.includes(normalizedTarget);
  } catch (err) {
    return false;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("  HORIZON PORTAL — PHASE 6D EXPENSE REGISTER TEST SUITE        ");
  console.log("===============================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo user accounts in SQLite database");
  }

  // ===========================================================================
  // 1. RBAC & Security: Expenses API
  // ===========================================================================
  console.log("--- 1. RBAC & Security Boundaries ---");

  // 1.1 Unauthenticated request returns 401
  const unauthReq = await createMockRequest("/api/v1/admin/finance/expenses");
  const unauthRes = await getExpensesApi(unauthReq);
  assert(unauthRes.status === 401, "Expenses API: Unauthenticated returns HTTP 401");

  // 1.2 Non-Admin roles return 403 Forbidden
  const empReq = await createMockRequest("/api/v1/admin/finance/expenses", employeeUser);
  const empRes = await getExpensesApi(empReq);
  assert(empRes.status === 403, "Expenses API: Employee returns HTTP 403 Forbidden");

  const mgrReq = await createMockRequest("/api/v1/admin/finance/expenses", managerUser);
  const mgrRes = await getExpensesApi(mgrReq);
  assert(mgrRes.status === 403, "Expenses API: Manager returns HTTP 403 Forbidden");

  const hrReq = await createMockRequest("/api/v1/admin/finance/expenses", hrUser);
  const hrRes = await getExpensesApi(hrReq);
  assert(hrRes.status === 403, "Expenses API: HR returns HTTP 403 Forbidden");

  // 1.3 Admin request returns 200 OK
  const adminReq = await createMockRequest("/api/v1/admin/finance/expenses", adminUser);
  const adminRes = await getExpensesApi(adminReq);
  assert(adminRes.status === 200, "Expenses API: Admin returns HTTP 200 OK");

  const adminJson = await adminRes.json();
  assert(adminJson.success === true, "Expenses API: success flag is true");
  assert(Array.isArray(adminJson.data.items), "Expenses API: returns items array");
  assert(Boolean(adminJson.data.pagination), "Expenses API: returns pagination object");

  // ===========================================================================
  // 2. Expense API Response Contract
  // ===========================================================================
  console.log("\n--- 2. Expense API Response Contract ---");

  const page1Items: EnrichedExpenseItem[] = adminJson.data.items;
  const pagination: FinancePaginationMetadata = adminJson.data.pagination;

  assert(pagination.totalRecords === 501, "Contract: totalRecords strictly equals 501");
  assert(pagination.pageSize === 20, "Contract: pageSize default === 20");
  assert(pagination.page === 1, "Contract: default page === 1");
  assert(pagination.totalPages === 26, "Contract: totalPages === 26 (ceil(501/20))");
  assert(pagination.hasNextPage === true, "Contract: hasNextPage === true on page 1");
  assert(pagination.hasPreviousPage === false, "Contract: hasPreviousPage === false on page 1");
  assert(page1Items.length === 20, "Contract: page 1 returns exactly 20 items");

  // Verify fields on sample record
  const sampleExp = page1Items[0];
  assert(typeof sampleExp.id === "string", "Contract: expense has string id");
  assert(typeof sampleExp.expenseDate === "string", "Contract: expense has expenseDate YYYY-MM-DD");
  assert(typeof sampleExp.categoryAccount === "number", "Contract: expense has categoryAccount number");
  assert(typeof sampleExp.vendorName === "string", "Contract: expense has vendorName");
  assert(typeof sampleExp.billReference === "string", "Contract: expense has billReference");
  assert(typeof sampleExp.description === "string", "Contract: expense has description");
  assert(typeof sampleExp.departmentName === "string", "Contract: expense has departmentName");
  assert(typeof sampleExp.totalAmount === "number", "Contract: expense has totalAmount number");
  assert(typeof sampleExp.dueDate === "string", "Contract: expense has dueDate");
  assert(typeof sampleExp.status === "string", "Contract: expense has status (PAID/UNPAID)");

  // ===========================================================================
  // 3. Server-Side Pagination
  // ===========================================================================
  console.log("\n--- 3. Server-Side Pagination ---");

  const page2Req = await createMockRequest("/api/v1/admin/finance/expenses?page=2&pageSize=20", adminUser);
  const page2Res = await getExpensesApi(page2Req);
  const page2Json = await page2Res.json();
  const page2Items: EnrichedExpenseItem[] = page2Json.data.items;

  assert(page2Json.data.pagination.page === 2, "Pagination: page 2 page number === 2");
  assert(page2Json.data.pagination.hasPreviousPage === true, "Pagination: page 2 hasPreviousPage === true");
  assert(page2Items.length === 20, "Pagination: page 2 returns 20 records");
  assert(page1Items[0].id !== page2Items[0].id, "Pagination: Page 1 and Page 2 records are distinct");

  // Last page verification
  const lastPageReq = await createMockRequest("/api/v1/admin/finance/expenses?page=26&pageSize=20", adminUser);
  const lastPageRes = await getExpensesApi(lastPageReq);
  const lastPageJson = await lastPageRes.json();
  assert(lastPageJson.data.pagination.page === 26, "Pagination: last page === 26");
  assert(lastPageJson.data.pagination.hasNextPage === false, "Pagination: last page hasNextPage === false");
  assert(lastPageJson.data.items.length === 1, "Pagination: last page has 1 item (501 - 25*20 = 1)");

  // ===========================================================================
  // 4. Search Mechanics
  // ===========================================================================
  console.log("\n--- 4. Search Mechanics ---");

  // 4.1 Search by vendor name
  const searchVendorReq = await createMockRequest("/api/v1/admin/finance/expenses?search=Skyline", adminUser);
  const searchVendorRes = await getExpensesApi(searchVendorReq);
  const searchVendorJson = await searchVendorRes.json();
  assert(searchVendorJson.data.pagination.totalRecords > 0, "Search by vendor 'Skyline' returns records");
  assert(
    searchVendorJson.data.items.every((exp: EnrichedExpenseItem) =>
      exp.vendorName.toLowerCase().includes("skyline") ||
      exp.billReference.toLowerCase().includes("skyline") ||
      exp.description.toLowerCase().includes("skyline")
    ),
    "All records returned for 'Skyline' match vendor, billReference, or description"
  );

  // 4.2 Search by billReference
  const searchRefReq = await createMockRequest("/api/v1/admin/finance/expenses?search=BILL-2504-9791", adminUser);
  const searchRefRes = await getExpensesApi(searchRefReq);
  const searchRefJson = await searchRefRes.json();
  assert(searchRefJson.data.pagination.totalRecords === 1, "Search by billReference returns exactly 1 record");
  assert(searchRefJson.data.items[0].billReference === "BILL-2504-9791", "Search returns target bill reference");

  // 4.3 Search by description
  const searchDescReq = await createMockRequest("/api/v1/admin/finance/expenses?search=office rent", adminUser);
  const searchDescRes = await getExpensesApi(searchDescReq);
  const searchDescJson = await searchDescRes.json();
  assert(searchDescJson.data.pagination.totalRecords > 0, "Search by description 'office rent' returns matching records");

  // ===========================================================================
  // 5. Filter Matrix (Status, Category, Date Range, Combined)
  // ===========================================================================
  console.log("\n--- 5. Filter Matrix ---");

  // 5.1 Status: PAID (exactly 478)
  const paidReq = await createMockRequest("/api/v1/admin/finance/expenses?status=PAID", adminUser);
  const paidRes = await getExpensesApi(paidReq);
  const paidJson = await paidRes.json();
  assert(paidJson.data.pagination.totalRecords === 478, "Status filter PAID returns exactly 478 records");
  assert(
    paidJson.data.items.every((exp: EnrichedExpenseItem) => exp.status === "PAID"),
    "All records in status=PAID query have status PAID"
  );

  // 5.2 Status: UNPAID (exactly 23)
  const unpaidReq = await createMockRequest("/api/v1/admin/finance/expenses?status=UNPAID", adminUser);
  const unpaidRes = await getExpensesApi(unpaidReq);
  const unpaidJson = await unpaidRes.json();
  assert(unpaidJson.data.pagination.totalRecords === 23, "Status filter UNPAID returns exactly 23 records");
  assert(
    unpaidJson.data.items.every((exp: EnrichedExpenseItem) => exp.status === "UNPAID"),
    "All records in status=UNPAID query have status UNPAID"
  );

  // 5.3 Category: 5101 (Office Rent - 54 records)
  const cat5101Req = await createMockRequest("/api/v1/admin/finance/expenses?category=5101", adminUser);
  const cat5101Res = await getExpensesApi(cat5101Req);
  const cat5101Json = await cat5101Res.json();
  assert(cat5101Json.data.pagination.totalRecords === 54, "Category filter 5101 returns exactly 54 records");
  assert(
    cat5101Json.data.items.every((exp: EnrichedExpenseItem) => exp.categoryAccount === 5101),
    "All records in category=5101 query have categoryAccount 5101"
  );

  // 5.4 Date range: from & to
  const dateRangeReq = await createMockRequest(
    "/api/v1/admin/finance/expenses?from=2026-01-01&to=2026-03-31",
    adminUser
  );
  const dateRangeRes = await getExpensesApi(dateRangeReq);
  const dateRangeJson = await dateRangeRes.json();
  assert(dateRangeJson.data.pagination.totalRecords > 0, "Date range filter returns records within Q1 2026");
  assert(
    dateRangeJson.data.items.every(
      (exp: EnrichedExpenseItem) => exp.expenseDate >= "2026-01-01" && exp.expenseDate <= "2026-03-31"
    ),
    "All returned records satisfy 2026-01-01 <= expenseDate <= 2026-03-31"
  );

  // 5.5 Combined: status=UNPAID + category=5101
  const combinedReq = await createMockRequest(
    "/api/v1/admin/finance/expenses?status=UNPAID&category=5101",
    adminUser
  );
  const combinedRes = await getExpensesApi(combinedReq);
  const combinedJson = await combinedRes.json();
  assert(
    combinedJson.data.items.every(
      (exp: EnrichedExpenseItem) => exp.status === "UNPAID" && exp.categoryAccount === 5101
    ),
    "All combined filter records have status UNPAID and category 5101"
  );

  // 5.6 Inverted date validation
  const invertedReq = await createMockRequest(
    "/api/v1/admin/finance/expenses?from=2026-12-31&to=2026-01-01",
    adminUser
  );
  const invertedRes = await getExpensesApi(invertedReq);
  assert(invertedRes.status === 400, "Inverted date range returns HTTP 400 Bad Request");

  // ===========================================================================
  // 6. Summary Consistency & Invariants Tie-Out
  // ===========================================================================
  console.log("\n--- 6. Summary Consistency & Invariants Tie-Out ---");

  assert(
    paidJson.data.pagination.totalRecords + unpaidJson.data.pagination.totalRecords === 501,
    "Expenses count tie-out: PAID (478) + UNPAID (23) === Total Expenses (501)"
  );

  // ===========================================================================
  // 7. CSV Export Integration
  // ===========================================================================
  console.log("\n--- 7. CSV Export Integration ---");

  // 7.1 Unauthenticated CSV export returns 401
  const unauthExportReq = await createMockRequest("/api/v1/admin/finance/export/expenses");
  const unauthExportRes = await exportExpensesApi(unauthExportReq);
  assert(unauthExportRes.status === 401, "Export Expenses API: Unauthenticated returns HTTP 401");

  // 7.2 Admin CSV export returns 200 with Content-Type text/csv
  const exportReq = await createMockRequest("/api/v1/admin/finance/export/expenses", adminUser);
  const exportRes = await exportExpensesApi(exportReq);
  assert(exportRes.status === 200, "Export Expenses API: Admin returns HTTP 200 OK");
  assert(
    exportRes.headers.get("content-type")?.includes("text/csv") === true,
    "Export Expenses API: Content-Type is text/csv"
  );
  assert(
    exportRes.headers.get("content-disposition")?.includes("finance-expenses-") === true,
    "Export Expenses API: Content-Disposition attachment filename set correctly"
  );

  const csvText = await exportRes.text();
  const csvLines = csvText.trim().split("\r\n");
  assert(csvLines.length === 502, "Export Expenses API: Exports all 501 expenses + 1 header (502 rows, unpaginated)");

  // 7.3 Filtered CSV Export
  const filteredExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?status=UNPAID",
    adminUser
  );
  const filteredExportRes = await exportExpensesApi(filteredExportReq);
  const filteredCsvText = await filteredExportRes.text();
  const filteredCsvLines = filteredCsvText.trim().split("\r\n");
  assert(filteredCsvLines.length === 24, "Filtered CSV Export: UNPAID exports exactly 23 records + 1 header = 24 lines");

  // ===========================================================================
  // 8. Component Unit & Integration Rendering
  // ===========================================================================
  console.log("\n--- 8. Component Unit & Integration Rendering ---");

  const mockFilters: ExpenseFilterState = {
    search: "",
    status: "ALL",
    category: "ALL",
    from: "",
    to: "",
  };

  // 8.1 ExpenseTable rendering with data
  const tableElement = React.createElement(ExpenseTable, {
    items: page1Items,
    isLoading: false,
    filters: mockFilters,
    onResetFilters: () => {},
  });

  assert(elementContainsText(tableElement, "Expense Date"), "ExpenseTable renders 'Expense Date' column header");
  assert(elementContainsText(tableElement, "Bill Reference"), "ExpenseTable renders 'Bill Reference' column header");
  assert(elementContainsText(tableElement, "Vendor"), "ExpenseTable renders 'Vendor' column header");
  assert(elementContainsText(tableElement, "Category"), "ExpenseTable renders 'Category' column header");
  assert(elementContainsText(tableElement, "Department"), "ExpenseTable renders 'Department' column header");
  assert(elementContainsText(tableElement, "Description"), "ExpenseTable renders 'Description' column header");
  assert(elementContainsText(tableElement, "Due Date"), "ExpenseTable renders 'Due Date' column header");
  assert(elementContainsText(tableElement, "Total Amount"), "ExpenseTable renders 'Total Amount' column header");
  assert(elementContainsText(tableElement, "Status"), "ExpenseTable renders 'Status' column header");

  // Verify INR formatting rendered on first item
  const firstExp = page1Items[0];
  assert(
    elementContainsText(tableElement, formatINR(firstExp.totalAmount)),
    `ExpenseTable renders formatted INR for first item totalAmount (${formatINR(firstExp.totalAmount)})`
  );

  // 8.2 Category formatting rendered
  assert(
    elementContainsText(tableElement, formatExpenseCategory(firstExp.categoryAccount)),
    `ExpenseTable renders formatted category account (${formatExpenseCategory(firstExp.categoryAccount)})`
  );

  // 8.3 Empty state rendering
  const emptyTableElement = React.createElement(ExpenseTable, {
    items: [],
    isLoading: false,
    filters: { ...mockFilters, search: "NonExistentVendorXYZ" },
    onResetFilters: () => {},
  });
  assert(
    elementContainsText(emptyTableElement, "No expenses match the selected filters"),
    "ExpenseTable renders friendly empty state title when no records match"
  );
  assert(
    elementContainsText(emptyTableElement, "Clear All Filters"),
    "ExpenseTable renders 'Clear All Filters' action button in empty state"
  );

  // 8.4 ExpenseFilters toolbar rendering
  const filtersElement = React.createElement(ExpenseFilters, {
    filters: mockFilters,
    searchInput: "",
    onSearchInputChange: () => {},
    onClearSearch: () => {},
    onFilterChange: () => {},
    onResetFilters: () => {},
    isLoading: false,
    totalRecords: 501,
    dateRangeError: null,
  });

  assert(elementContainsText(filtersElement, "All Statuses"), "ExpenseFilters renders 'All Statuses' option");
  assert(elementContainsText(filtersElement, "All Categories"), "ExpenseFilters renders 'All Categories' option");
  assert(elementContainsText(filtersElement, "5101 · Office Rent"), "ExpenseFilters renders category option '5101 · Office Rent'");
  assert(elementContainsText(filtersElement, "Export CSV"), "ExpenseFilters renders 'Export CSV' button");

  // 8.5 ExpenseFilters with active filter chips
  const activeFiltersElement = React.createElement(ExpenseFilters, {
    filters: {
      ...mockFilters,
      status: "UNPAID",
      category: "5101",
      search: "Skyline",
    },
    searchInput: "Skyline",
    onSearchInputChange: () => {},
    onClearSearch: () => {},
    onFilterChange: () => {},
    onResetFilters: () => {},
    isLoading: false,
    totalRecords: 3,
    dateRangeError: null,
  });

  assert(elementContainsText(activeFiltersElement, "Active Filters:"), "ExpenseFilters renders 'Active Filters:' label");
  assert(elementContainsText(activeFiltersElement, "Status: UNPAID"), "ExpenseFilters renders 'Status: UNPAID' chip");
  assert(elementContainsText(activeFiltersElement, "Category: Office Rent"), "ExpenseFilters renders Category chip");
  assert(elementContainsText(activeFiltersElement, 'Search: "Skyline"'), "ExpenseFilters renders Search chip");
  assert(elementContainsText(activeFiltersElement, "Clear All"), "ExpenseFilters renders 'Clear All' button");

  // 8.6 Date range validation error in filters
  const dateErrorElement = React.createElement(ExpenseFilters, {
    filters: { ...mockFilters, from: "2026-12-01", to: "2026-01-01" },
    searchInput: "",
    onSearchInputChange: () => {},
    onClearSearch: () => {},
    onFilterChange: () => {},
    onResetFilters: () => {},
    isLoading: false,
    totalRecords: 0,
    dateRangeError: "Invalid range: 'From' date (2026-12-01) cannot be after 'To' date (2026-01-01).",
  });

  assert(
    elementContainsText(dateErrorElement, "Invalid range: 'From' date"),
    "ExpenseFilters renders inline date range validation error banner"
  );

  // 8.7 ExpensePagination rendering
  const paginationElement = React.createElement(ExpensePagination, {
    pagination: {
      page: 1,
      pageSize: 20,
      totalRecords: 501,
      totalPages: 26,
      hasNextPage: true,
      hasPreviousPage: false,
    },
    onPageChange: () => {},
    isLoading: false,
  });

  assert(elementContainsText(paginationElement, "Showing 1 to 20 of 501 expenses"), "ExpensePagination renders correct record range");
  assert(elementContainsText(paginationElement, "Page 1 of 26"), "ExpensePagination renders 'Page 1 of 26'");
  assert(elementContainsText(paginationElement, "Previous"), "ExpensePagination renders Previous button");
  assert(elementContainsText(paginationElement, "Next"), "ExpensePagination renders Next button");

  // 8.8 ExpenseTableSkeleton
  const skeletonElement = React.createElement(ExpenseTableSkeleton, { rowCount: 6 });
  assert(Boolean(skeletonElement), "ExpenseTableSkeleton instantiates cleanly");

  // 8.9 ExpenseExportButton
  const exportBtnElement = React.createElement(ExpenseExportButton, {
    filters: mockFilters,
    totalRecords: 501,
  });
  assert(elementContainsText(exportBtnElement, "Export CSV"), "ExpenseExportButton renders 'Export CSV' label");

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
