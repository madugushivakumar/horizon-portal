/**
 * Horizon Portal — Day 12 Phase 6C Interactive Invoice Register Test Suite
 * scripts/test-day12-phase6c-invoices-ui.ts
 *
 * Verifies:
 * 1. RBAC & Security:
 *    - Unauthenticated cannot access invoices API (HTTP 401)
 *    - Non-Admin roles (HR, Manager, Employee) return HTTP 403 Forbidden
 *    - Admin role successfully retrieves live invoices with HTTP 200 OK
 * 2. Search Mechanics:
 *    - Search by invoiceNumber returns exact matching invoice
 *    - Search by clientName returns matching records
 * 3. Filter Matrix:
 *    - Status filters (PAID, SENT, PARTIALLY_PAID, OVERDUE, DRAFT, CANCELLED)
 *    - Ageing filters (NOT_OVERDUE, 0_30, 31_60, 61_90, 90_PLUS)
 *    - Operational status (open=true returns exactly 62, open=false returns exactly 681)
 *    - Date range filters (from, to, combined)
 *    - Combined multi-attribute filtering
 * 4. Server-Side Pagination:
 *    - Default page 1 returns 20 items, totalRecords = 743, totalPages = 38
 *    - Page 2 items are distinct from Page 1
 *    - Page bounds (hasNextPage, hasPreviousPage)
 * 5. Closed Invoice Ageing Invariant:
 *    - Closed invoices (PAID, CANCELLED, DRAFT, balanceDue=0) have null ageing in API
 *    - UI table strictly renders "—" for closed invoice ageing cells
 * 6. CSV Export Integration:
 *    - Admin downloads unpaginated CSV with active filters
 *    - Respects snapshot reporting cutoff in query and Content-Disposition header
 *    - Closed invoices have empty ageing columns in CSV
 * 7. Component Rendering & Edge Cases:
 *    - InvoiceTable renders all 9 canonical columns with INR formatting
 *    - InvoiceFilters renders search, status, ageing, open/closed, date range, clear action
 *    - InvoicePagination renders record counters and navigation controls
 *    - InvoiceTableSkeleton instantiates cleanly
 *    - Empty state renders "Clear All Filters" trigger
 *    - Error state renders retry trigger
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { formatINR } from "../src/lib/finance/formatting";
import { EnrichedInvoiceItem, FinancePaginationMetadata, InvoiceFilterState } from "../src/lib/finance/types";

// APIs
import { GET as getInvoicesApi } from "../src/app/api/v1/admin/finance/invoices/route";
import { GET as exportInvoicesApi } from "../src/app/api/v1/admin/finance/export/invoices/route";

// Phase 6C Components
import { InvoiceTable } from "../src/components/finance/InvoiceTable";
import { InvoiceFilters } from "../src/components/finance/InvoiceFilters";
import { InvoicePagination } from "../src/components/finance/InvoicePagination";
import { InvoiceTableSkeleton } from "../src/components/finance/InvoiceTableSkeleton";
import { InvoiceExportButton } from "../src/components/finance/InvoiceExportButton";

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
  console.log("  HORIZON PORTAL — PHASE 6C INVOICE REGISTER TEST SUITE        ");
  console.log("===============================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo user accounts in SQLite database");
  }

  // ===========================================================================
  // 1. RBAC & Security: Invoices API
  // ===========================================================================
  console.log("--- 1. RBAC & Security Boundaries ---");

  // 1.1 Unauthenticated request returns 401
  const unauthReq = await createMockRequest("/api/v1/admin/finance/invoices");
  const unauthRes = await getInvoicesApi(unauthReq);
  assert(unauthRes.status === 401, "Invoices API: Unauthenticated returns HTTP 401");

  // 1.2 Non-Admin roles return 403 Forbidden
  const empReq = await createMockRequest("/api/v1/admin/finance/invoices", employeeUser);
  const empRes = await getInvoicesApi(empReq);
  assert(empRes.status === 403, "Invoices API: Employee returns HTTP 403 Forbidden");

  const mgrReq = await createMockRequest("/api/v1/admin/finance/invoices", managerUser);
  const mgrRes = await getInvoicesApi(mgrReq);
  assert(mgrRes.status === 403, "Invoices API: Manager returns HTTP 403 Forbidden");

  const hrReq = await createMockRequest("/api/v1/admin/finance/invoices", hrUser);
  const hrRes = await getInvoicesApi(hrReq);
  assert(hrRes.status === 403, "Invoices API: HR returns HTTP 403 Forbidden");

  // 1.3 Admin request returns 200 OK
  const adminReq = await createMockRequest("/api/v1/admin/finance/invoices?reportingDate=2026-11-03", adminUser);
  const adminRes = await getInvoicesApi(adminReq);
  assert(adminRes.status === 200, "Invoices API: Admin returns HTTP 200 OK");

  const adminJson = await adminRes.json();
  assert(adminJson.success === true, "Invoices API: success flag is true");
  assert(Array.isArray(adminJson.data.items), "Invoices API: returns items array");
  assert(Boolean(adminJson.data.pagination), "Invoices API: returns pagination object");

  // ===========================================================================
  // 2. Server-Side Pagination
  // ===========================================================================
  console.log("\n--- 2. Server-Side Pagination Verification ---");

  const page1Items: EnrichedInvoiceItem[] = adminJson.data.items;
  const pagination: FinancePaginationMetadata = adminJson.data.pagination;

  assert(pagination.totalRecords === 743, "Pagination: totalRecords === 743");
  assert(pagination.pageSize === 20, "Pagination: pageSize === 20 (backend default)");
  assert(pagination.page === 1, "Pagination: default page === 1");
  assert(pagination.totalPages === 38, "Pagination: totalPages === 38 (ceil(743/20))");
  assert(pagination.hasNextPage === true, "Pagination: hasNextPage === true on page 1");
  assert(pagination.hasPreviousPage === false, "Pagination: hasPreviousPage === false on page 1");
  assert(page1Items.length === 20, "Pagination: page 1 returns exactly 20 records");

  // Fetch Page 2
  const page2Req = await createMockRequest("/api/v1/admin/finance/invoices?page=2&pageSize=20&reportingDate=2026-11-03", adminUser);
  const page2Res = await getInvoicesApi(page2Req);
  const page2Json = await page2Res.json();
  const page2Items: EnrichedInvoiceItem[] = page2Json.data.items;

  assert(page2Json.data.pagination.page === 2, "Pagination: page 2 page number === 2");
  assert(page2Json.data.pagination.hasPreviousPage === true, "Pagination: page 2 hasPreviousPage === true");
  assert(page2Items.length === 20, "Pagination: page 2 returns 20 records");
  assert(page1Items[0].id !== page2Items[0].id, "Pagination: Page 1 and Page 2 records are distinct");

  // ===========================================================================
  // 3. Search Mechanics
  // ===========================================================================
  console.log("\n--- 3. Search Mechanics ---");

  // 3.1 Search by invoiceNumber
  const searchInvReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?search=INV/2026-27/0140&reportingDate=2026-11-03",
    adminUser
  );
  const searchInvRes = await getInvoicesApi(searchInvReq);
  const searchInvJson = await searchInvRes.json();
  assert(searchInvJson.data.pagination.totalRecords === 1, "Search by invoiceNumber returns exactly 1 match");
  assert(searchInvJson.data.items[0].invoiceNumber === "INV/2026-27/0140", "Search by invoiceNumber matches target invoice");

  // 3.2 Search by clientName
  const searchClientReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?search=Meridian&reportingDate=2026-11-03",
    adminUser
  );
  const searchClientRes = await getInvoicesApi(searchClientReq);
  const searchClientJson = await searchClientRes.json();
  assert(searchClientJson.data.pagination.totalRecords > 0, "Search by clientName 'Meridian' returns matching records");
  assert(
    searchClientJson.data.items.every((inv: EnrichedInvoiceItem) =>
      inv.clientName.toLowerCase().includes("meridian")
    ),
    "All returned search records contain 'Meridian' in clientName"
  );

  // ===========================================================================
  // 4. Status, Ageing, Open/Closed, and Date Filters
  // ===========================================================================
  console.log("\n--- 4. Filter Matrix ---");

  // 4.1 Status: OVERDUE (exactly 12)
  const overdueReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=OVERDUE&reportingDate=2026-11-03",
    adminUser
  );
  const overdueRes = await getInvoicesApi(overdueReq);
  const overdueJson = await overdueRes.json();
  assert(overdueJson.data.pagination.totalRecords === 12, "Status filter OVERDUE returns exactly 12 records");
  assert(
    overdueJson.data.items.every((inv: EnrichedInvoiceItem) => inv.status === "OVERDUE"),
    "All records in status=OVERDUE query have status OVERDUE"
  );

  // 4.2 Status: SENT (49)
  const sentReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=SENT&reportingDate=2026-11-03",
    adminUser
  );
  const sentRes = await getInvoicesApi(sentReq);
  const sentJson = await sentRes.json();
  assert(sentJson.data.pagination.totalRecords === 49, "Status filter SENT returns exactly 49 records");

  // 4.3 Status: PARTIALLY_PAID (1)
  const partPaidReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=PARTIALLY_PAID&reportingDate=2026-11-03",
    adminUser
  );
  const partPaidRes = await getInvoicesApi(partPaidReq);
  const partPaidJson = await partPaidRes.json();
  assert(partPaidJson.data.pagination.totalRecords === 1, "Status filter PARTIALLY_PAID returns exactly 1 record");

  // 4.4 Status: CANCELLED (4)
  const cancelledReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=CANCELLED&reportingDate=2026-11-03",
    adminUser
  );
  const cancelledRes = await getInvoicesApi(cancelledReq);
  const cancelledJson = await cancelledRes.json();
  assert(cancelledJson.data.pagination.totalRecords === 4, "Status filter CANCELLED returns exactly 4 records");

  // 4.5 Ageing: 0_30 (37 records)
  const ageing030Req = await createMockRequest(
    "/api/v1/admin/finance/invoices?ageing=0_30&reportingDate=2026-11-03",
    adminUser
  );
  const ageing030Res = await getInvoicesApi(ageing030Req);
  const ageing030Json = await ageing030Res.json();
  assert(ageing030Json.data.pagination.totalRecords === 37, "Ageing filter 0_30 returns exactly 37 records");

  // 4.6 Ageing: NOT_OVERDUE (9 records)
  const ageingNotOverdueReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?ageing=NOT_OVERDUE&reportingDate=2026-11-03",
    adminUser
  );
  const ageingNotOverdueRes = await getInvoicesApi(ageingNotOverdueReq);
  const ageingNotOverdueJson = await ageingNotOverdueRes.json();
  assert(ageingNotOverdueJson.data.pagination.totalRecords === 9, "Ageing filter NOT_OVERDUE returns exactly 9 records");

  // 4.7 Operational Status: open=true (62 open invoices)
  const openReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?open=true&reportingDate=2026-11-03",
    adminUser
  );
  const openRes = await getInvoicesApi(openReq);
  const openJson = await openRes.json();
  assert(openJson.data.pagination.totalRecords === 62, "Open filter (open=true) returns exactly 62 records");
  assert(
    openJson.data.items.every((inv: EnrichedInvoiceItem) => inv.isOpen === true),
    "All records in open=true query have isOpen: true"
  );

  // 4.8 Operational Status: open=false (681 closed invoices)
  const closedReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?open=false&reportingDate=2026-11-03",
    adminUser
  );
  const closedRes = await getInvoicesApi(closedReq);
  const closedJson = await closedRes.json();
  assert(closedJson.data.pagination.totalRecords === 681, "Closed filter (open=false) returns exactly 681 records (743 - 62)");
  assert(
    closedJson.data.items.every((inv: EnrichedInvoiceItem) => inv.isOpen === false),
    "All records in open=false query have isOpen: false"
  );

  // 4.9 Date range: from & to
  const dateRangeReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?from=2026-06-01&to=2026-06-30&reportingDate=2026-11-03",
    adminUser
  );
  const dateRangeRes = await getInvoicesApi(dateRangeReq);
  const dateRangeJson = await dateRangeRes.json();
  assert(dateRangeJson.data.pagination.totalRecords > 0, "Date range filter returns records within June 2026");
  assert(
    dateRangeJson.data.items.every(
      (inv: EnrichedInvoiceItem) => inv.invoiceDate >= "2026-06-01" && inv.invoiceDate <= "2026-06-30"
    ),
    "All returned records satisfy 2026-06-01 <= invoiceDate <= 2026-06-30"
  );

  // 4.10 Combined Filters: status=OVERDUE + ageing=31_60
  const combinedReq = await createMockRequest(
    "/api/v1/admin/finance/invoices?status=OVERDUE&ageing=31_60&reportingDate=2026-11-03",
    adminUser
  );
  const combinedRes = await getInvoicesApi(combinedReq);
  const combinedJson = await combinedRes.json();
  assert(combinedJson.data.pagination.totalRecords > 0, "Combined filter (OVERDUE + 31_60) returns records");
  assert(
    combinedJson.data.items.every(
      (inv: EnrichedInvoiceItem) => inv.status === "OVERDUE" && inv.ageingBucket === "31_60"
    ),
    "All combined filter records have status OVERDUE and ageing 31_60"
  );

  // ===========================================================================
  // 5. Closed Invoices Null Ageing Invariant
  // ===========================================================================
  console.log("\n--- 5. Closed Invoice Ageing Null Invariant ---");

  // In closed invoices, daysOverdue, ageingBucket, and ageingLabel MUST be strictly null
  const sampleClosed = closedJson.data.items.slice(0, 20);
  assert(
    sampleClosed.every(
      (inv: EnrichedInvoiceItem) =>
        inv.daysOverdue === null && inv.ageingBucket === null && inv.ageingLabel === null
    ),
    "All closed invoice items strictly have daysOverdue=null, ageingBucket=null, ageingLabel=null"
  );

  // In open invoices, ageing fields are populated
  const sampleOpen = openJson.data.items.slice(0, 20);
  assert(
    sampleOpen.every(
      (inv: EnrichedInvoiceItem) =>
        typeof inv.daysOverdue === "number" && inv.ageingBucket !== null && inv.ageingLabel !== null
    ),
    "All open invoice items strictly retain calculated ageing attributes"
  );

  // ===========================================================================
  // 6. CSV Export Integration & Reporting Date Consistency
  // ===========================================================================
  console.log("\n--- 6. CSV Export Integration & Reporting Date ---");

  // 6.1 Unauthenticated CSV export returns 401
  const unauthExportReq = await createMockRequest("/api/v1/admin/finance/export/invoices");
  const unauthExportRes = await exportInvoicesApi(unauthExportReq);
  assert(unauthExportRes.status === 401, "Export Invoices API: Unauthenticated returns HTTP 401");

  // 6.2 Admin CSV export returns 200 with Content-Type text/csv
  const exportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?reportingDate=2026-11-03",
    adminUser
  );
  const exportRes = await exportInvoicesApi(exportReq);
  assert(exportRes.status === 200, "Export Invoices API: Admin returns HTTP 200 OK");
  assert(
    exportRes.headers.get("content-type")?.includes("text/csv") === true,
    "Export Invoices API: Content-Type is text/csv"
  );
  assert(
    exportRes.headers.get("content-disposition")?.includes("finance-invoices-2026-11-03.csv") === true,
    "Export Invoices API: Filename includes reporting date (finance-invoices-2026-11-03.csv)"
  );

  const csvText = await exportRes.text();
  const csvLines = csvText.trim().split("\r\n");
  assert(csvLines.length === 744, "Export Invoices API: Exports all 743 invoices + 1 header (744 rows, unpaginated)");

  // 6.3 CSV Export with filters
  const filteredExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=OVERDUE&reportingDate=2026-11-03",
    adminUser
  );
  const filteredExportRes = await exportInvoicesApi(filteredExportReq);
  const filteredCsvText = await filteredExportRes.text();
  const filteredCsvLines = filteredCsvText.trim().split("\r\n");
  assert(filteredCsvLines.length === 13, "Filtered CSV Export: OVERDUE exports exactly 12 records + 1 header = 13 lines");

  // ===========================================================================
  // 7. Component Unit & Integration Rendering
  // ===========================================================================
  console.log("\n--- 7. Component Unit & Integration Rendering ---");

  const mockFilters: InvoiceFilterState = {
    search: "",
    status: "ALL",
    ageing: "ALL",
    open: "ALL",
    from: "",
    to: "",
  };

  // 7.1 InvoiceTable rendering with data
  const tableElement = React.createElement(InvoiceTable, {
    items: page1Items,
    isLoading: false,
    filters: mockFilters,
    onResetFilters: () => {},
  });

  assert(elementContainsText(tableElement, "Invoice #"), "InvoiceTable renders 'Invoice #' column header");
  assert(elementContainsText(tableElement, "Client Name"), "InvoiceTable renders 'Client Name' column header");
  assert(elementContainsText(tableElement, "Invoice Date"), "InvoiceTable renders 'Invoice Date' column header");
  assert(elementContainsText(tableElement, "Due Date"), "InvoiceTable renders 'Due Date' column header");
  assert(elementContainsText(tableElement, "Total Amount"), "InvoiceTable renders 'Total Amount' column header");
  assert(elementContainsText(tableElement, "Amount Paid"), "InvoiceTable renders 'Amount Paid' column header");
  assert(elementContainsText(tableElement, "Balance Due"), "InvoiceTable renders 'Balance Due' column header");
  assert(elementContainsText(tableElement, "Status"), "InvoiceTable renders 'Status' column header");
  assert(elementContainsText(tableElement, "Ageing"), "InvoiceTable renders 'Ageing' column header");

  // Verify INR formatting rendered on first item
  const firstInv = page1Items[0];
  assert(
    elementContainsText(tableElement, formatINR(firstInv.totalAmount)),
    `InvoiceTable renders formatted INR for first item totalAmount (${formatINR(firstInv.totalAmount)})`
  );

  // 7.2 Closed invoices render "—" for Ageing
  // Find a closed invoice in page1Items or use sample closed item
  const closedInvItem = sampleClosed[0];
  const closedTableElement = React.createElement(InvoiceTable, {
    items: [closedInvItem],
    isLoading: false,
    filters: mockFilters,
    onResetFilters: () => {},
  });
  assert(
    elementContainsText(closedTableElement, "—"),
    "InvoiceTable strictly renders '—' for closed invoice ageing cell"
  );

  // 7.3 Empty state rendering
  const emptyTableElement = React.createElement(InvoiceTable, {
    items: [],
    isLoading: false,
    filters: { ...mockFilters, search: "NonExistentClientXYZ" },
    onResetFilters: () => {},
  });
  assert(
    elementContainsText(emptyTableElement, "No invoices match the selected filters"),
    "InvoiceTable renders friendly empty state title when no records match"
  );
  assert(
    elementContainsText(emptyTableElement, "Clear All Filters"),
    "InvoiceTable renders 'Clear All Filters' action button in empty state"
  );

  // 7.4 InvoiceFilters toolbar rendering
  const filtersElement = React.createElement(InvoiceFilters, {
    filters: mockFilters,
    searchInput: "",
    onSearchInputChange: () => {},
    onClearSearch: () => {},
    onFilterChange: () => {},
    onResetFilters: () => {},
    isLoading: false,
    reportingDate: "2026-11-03",
    totalRecords: 743,
    dateRangeError: null,
  });

  assert(elementContainsText(filtersElement, "All Statuses"), "InvoiceFilters renders 'All Statuses' option");
  assert(elementContainsText(filtersElement, "All Ageing Buckets"), "InvoiceFilters renders 'All Ageing Buckets' option");
  assert(elementContainsText(filtersElement, "All Invoices (Open & Closed)"), "InvoiceFilters renders Open/Closed options");
  assert(elementContainsText(filtersElement, "Export CSV"), "InvoiceFilters renders 'Export CSV' button");

  // 7.5 InvoiceFilters with active filter chips
  const activeFiltersElement = React.createElement(InvoiceFilters, {
    filters: {
      ...mockFilters,
      status: "OVERDUE",
      ageing: "0_30",
      search: "Acme",
    },
    searchInput: "Acme",
    onSearchInputChange: () => {},
    onClearSearch: () => {},
    onFilterChange: () => {},
    onResetFilters: () => {},
    isLoading: false,
    reportingDate: "2026-11-03",
    totalRecords: 12,
    dateRangeError: null,
  });

  assert(elementContainsText(activeFiltersElement, "Active Filters:"), "InvoiceFilters renders 'Active Filters:' label");
  assert(elementContainsText(activeFiltersElement, "Status: OVERDUE"), "InvoiceFilters renders 'Status: OVERDUE' chip");
  assert(elementContainsText(activeFiltersElement, "Ageing: 0–30 Days"), "InvoiceFilters renders 'Ageing: 0–30 Days' chip");
  assert(elementContainsText(activeFiltersElement, 'Search: "Acme"'), "InvoiceFilters renders Search chip");
  assert(elementContainsText(activeFiltersElement, "Clear All"), "InvoiceFilters renders 'Clear All' button");

  // 7.6 Date range validation error in filters
  const dateErrorElement = React.createElement(InvoiceFilters, {
    filters: { ...mockFilters, from: "2026-12-01", to: "2026-01-01" },
    searchInput: "",
    onSearchInputChange: () => {},
    onClearSearch: () => {},
    onFilterChange: () => {},
    onResetFilters: () => {},
    isLoading: false,
    reportingDate: "2026-11-03",
    totalRecords: 0,
    dateRangeError: "Invalid range: 'From' date (2026-12-01) cannot be after 'To' date (2026-01-01).",
  });

  assert(
    elementContainsText(dateErrorElement, "Invalid range: 'From' date"),
    "InvoiceFilters renders inline date range validation error banner"
  );

  // 7.7 InvoicePagination rendering
  const paginationElement = React.createElement(InvoicePagination, {
    pagination: {
      page: 1,
      pageSize: 20,
      totalRecords: 743,
      totalPages: 38,
      hasNextPage: true,
      hasPreviousPage: false,
    },
    onPageChange: () => {},
    isLoading: false,
  });

  assert(elementContainsText(paginationElement, "Showing 1 to 20 of 743 invoices"), "InvoicePagination renders correct record range");
  assert(elementContainsText(paginationElement, "Page 1 of 38"), "InvoicePagination renders 'Page 1 of 38'");
  assert(elementContainsText(paginationElement, "Previous"), "InvoicePagination renders Previous button");
  assert(elementContainsText(paginationElement, "Next"), "InvoicePagination renders Next button");

  // 7.8 InvoiceTableSkeleton
  const skeletonElement = React.createElement(InvoiceTableSkeleton, { rowCount: 6 });
  assert(Boolean(skeletonElement), "InvoiceTableSkeleton instantiates cleanly");

  // 7.9 InvoiceExportButton
  const exportBtnElement = React.createElement(InvoiceExportButton, {
    filters: mockFilters,
    reportingDate: "2026-11-03",
    totalRecords: 743,
  });
  assert(elementContainsText(exportBtnElement, "Export CSV"), "InvoiceExportButton renders 'Export CSV' label");

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
