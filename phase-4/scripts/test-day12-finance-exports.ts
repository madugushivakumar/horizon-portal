/**
 * Horizon Portal — Day 12 Secure Finance CSV Exports Comprehensive Test Suite
 * scripts/test-day12-finance-exports.ts
 *
 * Comprehensive Verification:
 * 1. CSV Serialization, Numeric Precision & Formula Injection Protection:
 *    - UTF-8 BOM (\uFEFF) at start of stream
 *    - CRLF (\r\n) line endings
 *    - RFC 4180 quote escaping ("") and comma wrapping
 *    - Formula injection protection (' prefix on =, +, -, @, \t, \r for text)
 *    - Legitimate negative integers (-500) and decimals (-1250.75) are NOT corrupted
 *    - Zero (0), large financial integers (1558743836), and arbitrary decimal precision preserved
 *    - Non-finite numbers (NaN, Infinity, -Infinity) serialized to empty string ("")
 *    - State-machine RFC 4180 CSV parser verifying roundtrip integrity
 * 2. Invoice CSV Export (/api/v1/admin/finance/export/invoices):
 *    - 401 unauthenticated, 403 non-Admin (HR, Manager, Employee), 200 Admin
 *    - Response headers (Content-Type, Content-Disposition, Cache-Control)
 *    - Unpaginated complete export (all 743 records + 1 header = 744 rows)
 *    - Section A: Dynamic Ageing Coverage:
 *      * PARTIALLY_PAID with positive balance -> ageing calculated
 *      * SENT with positive balance -> ageing calculated
 *      * OVERDUE with positive balance -> ageing calculated
 *      * PAID, DRAFT, CANCELLED, and all closed invoices -> all ageing cells strictly empty ("")
 *    - Section B: Complete Filter Coverage:
 *      * search, status, ageing, open/closed, from, to, combined date range
 *      * Invalid filter rejection (status, ageing, open, from, to, inverted range -> 400)
 * 3. Expense CSV Export (/api/v1/admin/finance/export/expenses):
 *    - 401 unauthenticated, 403 non-Admin (HR, Manager, Employee), 200 Admin
 *    - Response headers (Content-Type, Content-Disposition, Cache-Control)
 *    - Unpaginated complete export (all 501 records + 1 header = 502 rows)
 *    - Section B: Complete Filter Coverage:
 *      * search, status (PAID: 478, UNPAID: 23), category (e.g. 5101), from, to, combined range
 *      * Invalid filter rejection (status, category, from, to, inverted range -> 400)
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { sanitizeCsvCell, serializeToCsv } from "../src/lib/finance/csv";

import { GET as exportInvoicesCsv } from "../src/app/api/v1/admin/finance/export/invoices/route";
import { GET as exportExpensesCsv } from "../src/app/api/v1/admin/finance/export/expenses/route";

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

/**
 * State-machine RFC 4180 compliant CSV parser.
 * Accurately parses CSV strings containing commas, escaped quotes (""), and newlines inside quoted fields.
 */
export function parseCsv(csvText: string): string[][] {
  const text = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = "";
        i++;
        continue;
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i += 2;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
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
  console.log("   HORIZON PORTAL — DAY 12 FINANCE CSV EXPORTS TEST SUITE       ");
  console.log("===============================================================\n");

  // Fetch demo accounts
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Critical: Missing required demo user accounts in SQLite database.");
  }

  // ===========================================================================
  // 1. CSV Serialization, Numeric Precision & Formula Injection Unit Tests
  // ===========================================================================
  console.log("--- 1. CSV Serialization, Numeric Precision & Security Unit Tests ---");

  // 1.1 Section C: Complete Numeric Precision & Types
  assert(sanitizeCsvCell(-500) === "-500", "Negative integer (-500) remains uncorrupted");
  assert(sanitizeCsvCell(-1250.75) === "-1250.75", "Negative decimal (-1250.75) remains uncorrupted");
  assert(sanitizeCsvCell(0) === "0", "Zero (0) preserved accurately");
  assert(sanitizeCsvCell(1558743836) === "1558743836", "Large financial integer (1558743836) preserved accurately");
  assert(sanitizeCsvCell(10.55) === "10.55", "Two-decimal amount (10.55) preserved accurately");
  assert(sanitizeCsvCell(12.34567) === "12.34567", ">2 decimal amount (12.34567) preserved without truncation");
  assert(sanitizeCsvCell(NaN) === "", "Non-finite NaN serialized to empty string");
  assert(sanitizeCsvCell(Infinity) === "", "Non-finite Infinity serialized to empty string");
  assert(sanitizeCsvCell(-Infinity) === "", "Non-finite -Infinity serialized to empty string");

  // 1.2 Section D: Formula Injection Mitigation on Text Strings
  assert(sanitizeCsvCell("=SUM(A1:A10)") === "'=SUM(A1:A10)", "Text formula '=' prefixed with single quote");
  assert(sanitizeCsvCell("+12345") === "'+12345", "Text formula '+' prefixed with single quote");
  assert(sanitizeCsvCell("-DANGEROUS") === "'-DANGEROUS", "Text starting with '-' prefixed with single quote");
  assert(sanitizeCsvCell("@admin") === "'@admin", "Text starting with '@' prefixed with single quote");
  assert(sanitizeCsvCell("\tcmd") === "'\tcmd", "Text starting with tab '\\t' prefixed with single quote");
  assert(sanitizeCsvCell("\rtest") === '"\'\rtest"', "Text starting with '\\r' prefixed with quote and escaped for newline");

  // 1.3 RFC 4180 Escaping & Types
  assert(sanitizeCsvCell("Doe, John") === '"Doe, John"', "Text with comma wrapped in double quotes");
  assert(sanitizeCsvCell('Acme "Tech"') === '"Acme ""Tech"""', "Text with double quotes has quotes doubled and wrapped");
  assert(sanitizeCsvCell("Line 1\nLine 2") === '"Line 1\nLine 2"', "Text with embedded newline wrapped in double quotes");
  assert(sanitizeCsvCell(null) === "", "null value serialized to empty string");
  assert(sanitizeCsvCell(undefined) === "", "undefined value serialized to empty string");
  assert(sanitizeCsvCell(true) === "true", "boolean true serialized to 'true'");
  assert(sanitizeCsvCell(false) === "false", "boolean false serialized to 'false'");
  assert(sanitizeCsvCell(new Date("2026-11-03T00:00:00.000Z")) === "2026-11-03", "Date object formatted to YYYY-MM-DD");

  // 1.4 Full Document Serialization & State-Machine Parser Roundtrip
  const testHeaders = ["Client Name", "Balance", "Notes", "Formula"];
  const testRows = [
    ["Meridian Retail Pvt Ltd", -500.5, "Standard, terms", "=SUM(A1:B1)"],
    ['"Acme, Corp"', 1558743836, "Line 1\r\nLine 2", "@escalate"],
  ];
  const testCsv = serializeToCsv(testHeaders, testRows);
  assert(testCsv.charCodeAt(0) === 0xfeff, "Document starts with UTF-8 BOM (0xFEFF)");
  assert(testCsv.includes("\r\n"), "Document uses CRLF (\\r\\n) line endings");

  const parsedDoc = parseCsv(testCsv);
  assert(parsedDoc.length === 3, "parseCsv: Parses exactly 3 rows (1 header + 2 data)");
  assert(parsedDoc[0][0] === "Client Name" && parsedDoc[0][1] === "Balance", "parseCsv: Headers match");
  assert(parsedDoc[1][0] === "Meridian Retail Pvt Ltd", "parseCsv: Row 1 Client Name matches");
  assert(parsedDoc[1][1] === "-500.5", "parseCsv: Row 1 negative balance roundtrips without corrupted quotes");
  assert(parsedDoc[1][2] === "Standard, terms", "parseCsv: Row 1 embedded comma unquoted correctly");
  assert(parsedDoc[1][3] === "'=SUM(A1:B1)", "parseCsv: Row 1 formula protection preserved");
  assert(parsedDoc[2][0] === '"Acme, Corp"', "parseCsv: Row 2 quotes and comma roundtrip accurately");
  assert(parsedDoc[2][2] === "Line 1\r\nLine 2", "parseCsv: Row 2 multiline content roundtrips accurately");

  // ===========================================================================
  // 2. Invoice CSV Export API Tests
  // ===========================================================================
  console.log("\n--- 2. Invoice CSV Export API Tests ---");

  // 2.1 Authorization & Security
  const unauthInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices");
  const unauthInvRes = await exportInvoicesCsv(unauthInvReq);
  assert(unauthInvRes.status === 401, "Invoice Export: Unauthenticated returns 401");

  const empInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices", employeeUser);
  const empInvRes = await exportInvoicesCsv(empInvReq);
  assert(empInvRes.status === 403, "Invoice Export: Employee returns 403 Forbidden");

  const mgrInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices", managerUser);
  const mgrInvRes = await exportInvoicesCsv(mgrInvReq);
  assert(mgrInvRes.status === 403, "Invoice Export: Manager returns 403 Forbidden");

  const hrInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices", hrUser);
  const hrInvRes = await exportInvoicesCsv(hrInvReq);
  assert(hrInvRes.status === 403, "Invoice Export: HR returns 403 Forbidden");

  const adminInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices", adminUser);
  const adminInvRes = await exportInvoicesCsv(adminInvReq);
  assert(adminInvRes.status === 200, "Invoice Export: Admin returns 200 OK");
  assert(
    adminInvRes.headers.get("Content-Type")?.includes("text/csv") === true,
    "Invoice Export: Content-Type is text/csv; charset=utf-8"
  );
  assert(
    adminInvRes.headers.get("Content-Disposition")?.includes("finance-invoices-") === true,
    "Invoice Export: Content-Disposition attachment filename set correctly"
  );
  assert(
    adminInvRes.headers.get("Cache-Control")?.includes("no-cache") === true,
    "Invoice Export: Includes no-cache headers"
  );

  // 2.2 Unpaginated Complete Export (All 743 records)
  const invBuf = await adminInvRes.arrayBuffer();
  const invBytes = new Uint8Array(invBuf);
  assert(
    invBytes[0] === 0xef && invBytes[1] === 0xbb && invBytes[2] === 0xbf,
    "Invoice Export: Raw byte stream begins with UTF-8 BOM bytes (0xEF, 0xBB, 0xBF)"
  );
  const invCsvText = new TextDecoder().decode(invBuf);
  const invParsedRows = parseCsv(invCsvText);
  assert(
    invParsedRows.length === 744,
    `Invoice Export: Exports exactly 744 rows (1 header + 743 invoices, found ${invParsedRows.length})`
  );

  // Verify headers
  const expectedInvHeaders = [
    "Invoice ID",
    "Invoice Number",
    "Client Name",
    "Invoice Date",
    "Due Date",
    "Currency",
    "Total Amount",
    "Amount Paid",
    "Balance Due",
    "Stored Invoice Status",
    "Is Open",
    "Days Overdue",
    "Ageing Bucket",
    "Ageing Label",
  ];
  assert(
    JSON.stringify(invParsedRows[0]) === JSON.stringify(expectedInvHeaders),
    "Invoice Export: Header columns match exact 14-column specification"
  );

  // ===========================================================================
  // Section A: Complete Missing Ageing Coverage
  // ===========================================================================
  console.log("\n--- 2.3 Section A: Ageing Coverage for All Statuses ---");

  // 1. PARTIALLY_PAID with positive balance -> ageing calculated
  const ppExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=PARTIALLY_PAID&open=true&reportingDate=2026-11-03",
    adminUser
  );
  const ppExportRes = await exportInvoicesCsv(ppExportReq);
  const ppParsed = parseCsv(await ppExportRes.text());
  assert(
    ppParsed.length === 2,
    `Invoice Export: PARTIALLY_PAID exports 1 invoice row (+1 header = 2, found ${ppParsed.length})`
  );
  const ppRow = ppParsed[1];
  assert(
    ppRow[9] === "PARTIALLY_PAID" &&
      ppRow[10] === "true" &&
      ppRow[11] !== "" &&
      ppRow[12] !== "" &&
      ppRow[13] !== "",
    "Invoice Export: PARTIALLY_PAID invoice retains calculated daysOverdue, ageingBucket, ageingLabel"
  );

  // 2. SENT with positive balance -> ageing calculated
  const sentOpenExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=SENT&open=true&reportingDate=2026-11-03",
    adminUser
  );
  const sentOpenExportRes = await exportInvoicesCsv(sentOpenExportReq);
  const sentOpenParsed = parseCsv(await sentOpenExportRes.text());
  assert(
    sentOpenParsed.length === 50,
    `Invoice Export: SENT open invoices exports 49 records (+1 header = 50, found ${sentOpenParsed.length})`
  );
  const allSentOpenHaveAgeing = sentOpenParsed.slice(1).every(
    (row) => row[10] === "true" && row[11] !== "" && row[12] !== "" && row[13] !== ""
  );
  assert(allSentOpenHaveAgeing, "Invoice Export: All SENT open invoices retain calculated ageing fields");

  // 3. OVERDUE with positive balance -> ageing calculated
  const overdueExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=OVERDUE&reportingDate=2026-11-03",
    adminUser
  );
  const overdueExportRes = await exportInvoicesCsv(overdueExportReq);
  const overdueParsed = parseCsv(await overdueExportRes.text());
  assert(
    overdueParsed.length === 13,
    `Invoice Export: OVERDUE invoices exports 12 records (+1 header = 13, found ${overdueParsed.length})`
  );
  const allOverdueHaveAgeing = overdueParsed.slice(1).every(
    (row) => row[10] === "true" && row[11] !== "" && row[12] !== "" && row[13] !== ""
  );
  assert(allOverdueHaveAgeing, "Invoice Export: All OVERDUE invoices retain calculated ageing fields");

  // 4. PAID (closed) -> all ageing fields empty ("")
  const paidExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=PAID",
    adminUser
  );
  const paidExportRes = await exportInvoicesCsv(paidExportReq);
  const paidParsed = parseCsv(await paidExportRes.text());
  assert(
    paidParsed.length === 677,
    `Invoice Export: PAID invoices exports 676 records (+1 header = 677, found ${paidParsed.length})`
  );
  const allPaidAgeingEmpty = paidParsed.slice(1).every(
    (row) => row[10] === "false" && row[11] === "" && row[12] === "" && row[13] === ""
  );
  assert(allPaidAgeingEmpty, "Invoice Export: All PAID invoices have empty ageing cells (daysOverdue='', bucket='', label='')");

  // 5. DRAFT (closed) -> all ageing fields empty ("")
  const draftExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=DRAFT",
    adminUser
  );
  const draftExportRes = await exportInvoicesCsv(draftExportReq);
  const draftParsed = parseCsv(await draftExportRes.text());
  assert(
    draftParsed.length === 2,
    `Invoice Export: DRAFT invoices exports 1 record (+1 header = 2, found ${draftParsed.length})`
  );
  const draftRow = draftParsed[1];
  assert(
    draftRow[10] === "false" && draftRow[11] === "" && draftRow[12] === "" && draftRow[13] === "",
    "Invoice Export: DRAFT invoice has empty ageing cells"
  );

  // 6. CANCELLED (closed) -> all ageing fields empty ("")
  const cancelledExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=CANCELLED",
    adminUser
  );
  const cancelledExportRes = await exportInvoicesCsv(cancelledExportReq);
  const cancelledParsed = parseCsv(await cancelledExportRes.text());
  assert(
    cancelledParsed.length === 5,
    `Invoice Export: CANCELLED invoices exports 4 records (+1 header = 5, found ${cancelledParsed.length})`
  );
  const allCancelledAgeingEmpty = cancelledParsed.slice(1).every(
    (row) => row[10] === "false" && row[11] === "" && row[12] === "" && row[13] === ""
  );
  assert(allCancelledAgeingEmpty, "Invoice Export: All CANCELLED invoices have empty ageing cells");

  // 7. All closed invoices (open=false) -> all ageing fields empty ("")
  const closedExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?open=false",
    adminUser
  );
  const closedExportRes = await exportInvoicesCsv(closedExportReq);
  const closedParsed = parseCsv(await closedExportRes.text());
  assert(
    closedParsed.length === 682,
    `Invoice Export: open=false exports 681 closed invoices (+1 header = 682, found ${closedParsed.length})`
  );
  const allClosedAgeingEmpty = closedParsed.slice(1).every(
    (row) => row[10] === "false" && row[11] === "" && row[12] === "" && row[13] === ""
  );
  assert(allClosedAgeingEmpty, "Invoice Export: All 681 closed invoices have strictly empty ageing cells");

  // 8. All open invoices (open=true) -> all ageing fields populated
  const openExportReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?open=true&reportingDate=2026-11-03",
    adminUser
  );
  const openExportRes = await exportInvoicesCsv(openExportReq);
  const openParsed = parseCsv(await openExportRes.text());
  assert(
    openParsed.length === 63,
    `Invoice Export: open=true exports 62 open invoices (+1 header = 63, found ${openParsed.length})`
  );
  const allOpenPopulated = openParsed.slice(1).every(
    (row) => row[10] === "true" && row[11] !== "" && row[12] !== "" && row[13] !== ""
  );
  assert(allOpenPopulated, "Invoice Export: All 62 open invoices have populated ageing fields");

  // ===========================================================================
  // Section B: Complete Filter Coverage for Invoices
  // ===========================================================================
  console.log("\n--- 2.4 Section B: Filter Coverage for Invoices ---");

  // 1. Search filter
  const searchInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?search=Meridian",
    adminUser
  );
  const searchInvRes = await exportInvoicesCsv(searchInvReq);
  const searchInvParsed = parseCsv(await searchInvRes.text());
  assert(
    searchInvParsed.length > 1 &&
      searchInvParsed.slice(1).every((row) => row[2].includes("Meridian") || row[1].includes("Meridian")),
    "Invoice Export: Search filter returns only matching records (Meridian)"
  );

  // 2. Status filter
  const statusInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?status=OVERDUE",
    adminUser
  );
  const statusInvRes = await exportInvoicesCsv(statusInvReq);
  const statusInvParsed = parseCsv(await statusInvRes.text());
  assert(
    statusInvParsed.length === 13 &&
      statusInvParsed.slice(1).every((row) => row[9] === "OVERDUE"),
    "Invoice Export: Status filter returns only OVERDUE records"
  );

  // 3. Ageing filter
  const ageingInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?ageing=0_30&reportingDate=2026-11-03",
    adminUser
  );
  const ageingInvRes = await exportInvoicesCsv(ageingInvReq);
  const ageingInvParsed = parseCsv(await ageingInvRes.text());
  assert(
    ageingInvParsed.length === 38 &&
      ageingInvParsed.slice(1).every((row) => row[12] === "0_30"),
    "Invoice Export: Ageing filter returns only 0_30 records (37 invoices)"
  );

  // 4. From date filter
  const fromInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?from=2026-06-01",
    adminUser
  );
  const fromInvRes = await exportInvoicesCsv(fromInvReq);
  const fromInvParsed = parseCsv(await fromInvRes.text());
  assert(
    fromInvParsed.length > 1 &&
      fromInvParsed.slice(1).every((row) => row[3] >= "2026-06-01"),
    "Invoice Export: 'from' filter returns only records with invoiceDate >= 2026-06-01"
  );

  // 5. To date filter
  const toInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?to=2026-06-30",
    adminUser
  );
  const toInvRes = await exportInvoicesCsv(toInvReq);
  const toInvParsed = parseCsv(await toInvRes.text());
  assert(
    toInvParsed.length > 1 &&
      toInvParsed.slice(1).every((row) => row[3] <= "2026-06-30"),
    "Invoice Export: 'to' filter returns only records with invoiceDate <= 2026-06-30"
  );

  // 6. Combined date range filter
  const rangeInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?from=2026-06-01&to=2026-06-30",
    adminUser
  );
  const rangeInvRes = await exportInvoicesCsv(rangeInvReq);
  const rangeInvParsed = parseCsv(await rangeInvRes.text());
  assert(
    rangeInvParsed.length > 1 &&
      rangeInvParsed.slice(1).every((row) => row[3] >= "2026-06-01" && row[3] <= "2026-06-30"),
    "Invoice Export: Combined 'from' + 'to' filter returns records within range"
  );

  // 7. Defensive rejection of invalid filters
  const badStatusInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices?status=UNKNOWN", adminUser);
  const badStatusInvRes = await exportInvoicesCsv(badStatusInvReq);
  assert(badStatusInvRes.status === 400, "Invoice Export: Invalid status returns 400 Bad Request");

  const badAgeingInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices?ageing=INVALID", adminUser);
  const badAgeingInvRes = await exportInvoicesCsv(badAgeingInvReq);
  assert(badAgeingInvRes.status === 400, "Invoice Export: Invalid ageing returns 400 Bad Request");

  const badOpenInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices?open=invalid", adminUser);
  const badOpenInvRes = await exportInvoicesCsv(badOpenInvReq);
  assert(badOpenInvRes.status === 400, "Invoice Export: Invalid open parameter returns 400 Bad Request");

  const badFromInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices?from=bad-date", adminUser);
  const badFromInvRes = await exportInvoicesCsv(badFromInvReq);
  assert(badFromInvRes.status === 400, "Invoice Export: Invalid from date returns 400 Bad Request");

  const badToInvReq = await createMockRequest("/api/v1/admin/finance/export/invoices?to=bad-date", adminUser);
  const badToInvRes = await exportInvoicesCsv(badToInvReq);
  assert(badToInvRes.status === 400, "Invoice Export: Invalid to date returns 400 Bad Request");

  const invertedRangeInvReq = await createMockRequest(
    "/api/v1/admin/finance/export/invoices?from=2026-12-01&to=2026-01-01",
    adminUser
  );
  const invertedRangeInvRes = await exportInvoicesCsv(invertedRangeInvReq);
  assert(invertedRangeInvRes.status === 400, "Invoice Export: Inverted date range returns 400 Bad Request");

  // ===========================================================================
  // 3. Expense CSV Export API Tests
  // ===========================================================================
  console.log("\n--- 3. Expense CSV Export API Tests ---");

  // 3.1 Authorization & Security
  const unauthExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses");
  const unauthExpRes = await exportExpensesCsv(unauthExpReq);
  assert(unauthExpRes.status === 401, "Expense Export: Unauthenticated returns 401");

  const empExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses", employeeUser);
  const empExpRes = await exportExpensesCsv(empExpReq);
  assert(empExpRes.status === 403, "Expense Export: Employee returns 403 Forbidden");

  const mgrExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses", managerUser);
  const mgrExpRes = await exportExpensesCsv(mgrExpReq);
  assert(mgrExpRes.status === 403, "Expense Export: Manager returns 403 Forbidden");

  const hrExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses", hrUser);
  const hrExpRes = await exportExpensesCsv(hrExpReq);
  assert(hrExpRes.status === 403, "Expense Export: HR returns 403 Forbidden");

  const adminExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses", adminUser);
  const adminExpRes = await exportExpensesCsv(adminExpReq);
  assert(adminExpRes.status === 200, "Expense Export: Admin returns 200 OK");
  assert(
    adminExpRes.headers.get("Content-Type")?.includes("text/csv") === true,
    "Expense Export: Content-Type is text/csv; charset=utf-8"
  );
  assert(
    adminExpRes.headers.get("Content-Disposition")?.includes("finance-expenses-") === true,
    "Expense Export: Content-Disposition filename set correctly"
  );
  assert(
    adminExpRes.headers.get("Cache-Control")?.includes("no-cache") === true,
    "Expense Export: Includes no-cache headers"
  );

  // 3.2 Unpaginated Complete Export (All 501 records)
  const expBuf = await adminExpRes.arrayBuffer();
  const expBytes = new Uint8Array(expBuf);
  assert(
    expBytes[0] === 0xef && expBytes[1] === 0xbb && expBytes[2] === 0xbf,
    "Expense Export: Raw byte stream begins with UTF-8 BOM bytes (0xEF, 0xBB, 0xBF)"
  );
  const expCsvText = new TextDecoder().decode(expBuf);
  const expParsedRows = parseCsv(expCsvText);
  assert(
    expParsedRows.length === 502,
    `Expense Export: Exports exactly 502 rows (1 header + 501 expenses, found ${expParsedRows.length})`
  );

  // Verify headers
  const expectedExpHeaders = [
    "Expense ID",
    "Vendor Name",
    "Bill Reference",
    "Description",
    "Category",
    "Expense Date",
    "Currency",
    "Amount",
    "Payment Status",
    "Created Date",
  ];
  assert(
    JSON.stringify(expParsedRows[0]) === JSON.stringify(expectedExpHeaders),
    "Expense Export: Header columns match exact 10-column specification"
  );

  // ===========================================================================
  // Section B: Complete Filter Coverage for Expenses
  // ===========================================================================
  console.log("\n--- 3.3 Section B: Filter Coverage for Expenses ---");

  // 1. Search filter
  const searchExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?search=Skyline",
    adminUser
  );
  const searchExpRes = await exportExpensesCsv(searchExpReq);
  const searchExpParsed = parseCsv(await searchExpRes.text());
  assert(
    searchExpParsed.length > 1 &&
      searchExpParsed.slice(1).every(
        (row) =>
          row[1].includes("Skyline") || row[2].includes("Skyline") || row[3].includes("Skyline")
      ),
    "Expense Export: Search filter returns only matching records (Skyline)"
  );

  // 2. Status filter: PAID (478)
  const paidExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?status=PAID",
    adminUser
  );
  const paidExpRes = await exportExpensesCsv(paidExpReq);
  const paidExpParsed = parseCsv(await paidExpRes.text());
  assert(
    paidExpParsed.length === 479 &&
      paidExpParsed.slice(1).every((row) => row[8] === "PAID"),
    `Expense Export: Status filter PAID returns 478 records (+1 header = 479, found ${paidExpParsed.length})`
  );

  // 3. Status filter: UNPAID (23)
  const unpaidExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?status=UNPAID",
    adminUser
  );
  const unpaidExpRes = await exportExpensesCsv(unpaidExpReq);
  const unpaidExpParsed = parseCsv(await unpaidExpRes.text());
  assert(
    unpaidExpParsed.length === 24 &&
      unpaidExpParsed.slice(1).every((row) => row[8] === "UNPAID"),
    `Expense Export: Status filter UNPAID returns 23 records (+1 header = 24, found ${unpaidExpParsed.length})`
  );

  // 4. Category filter: 5101 (54 records)
  const catExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?category=5101",
    adminUser
  );
  const catExpRes = await exportExpensesCsv(catExpReq);
  const catExpParsed = parseCsv(await catExpRes.text());
  assert(
    catExpParsed.length === 55 &&
      catExpParsed.slice(1).every((row) => row[4] === "5101"),
    `Expense Export: Category filter 5101 returns 54 records (+1 header = 55, found ${catExpParsed.length})`
  );

  // 5. From date filter
  const fromExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?from=2026-01-01",
    adminUser
  );
  const fromExpRes = await exportExpensesCsv(fromExpReq);
  const fromExpParsed = parseCsv(await fromExpRes.text());
  assert(
    fromExpParsed.length > 1 &&
      fromExpParsed.slice(1).every((row) => row[5] >= "2026-01-01"),
    "Expense Export: 'from' filter returns only records with expenseDate >= 2026-01-01"
  );

  // 6. To date filter
  const toExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?to=2026-03-31",
    adminUser
  );
  const toExpRes = await exportExpensesCsv(toExpReq);
  const toExpParsed = parseCsv(await toExpRes.text());
  assert(
    toExpParsed.length > 1 &&
      toExpParsed.slice(1).every((row) => row[5] <= "2026-03-31"),
    "Expense Export: 'to' filter returns only records with expenseDate <= 2026-03-31"
  );

  // 7. Combined date range filter
  const rangeExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?from=2026-01-01&to=2026-03-31",
    adminUser
  );
  const rangeExpRes = await exportExpensesCsv(rangeExpReq);
  const rangeExpParsed = parseCsv(await rangeExpRes.text());
  assert(
    rangeExpParsed.length > 1 &&
      rangeExpParsed.slice(1).every((row) => row[5] >= "2026-01-01" && row[5] <= "2026-03-31"),
    "Expense Export: Combined 'from' + 'to' filter returns records within range"
  );

  // 8. Defensive rejection of invalid filters
  const badStatusExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses?status=INVALID", adminUser);
  const badStatusExpRes = await exportExpensesCsv(badStatusExpReq);
  assert(badStatusExpRes.status === 400, "Expense Export: Invalid status returns 400 Bad Request");

  const badCatExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses?category=not-num", adminUser);
  const badCatExpRes = await exportExpensesCsv(badCatExpReq);
  assert(badCatExpRes.status === 400, "Expense Export: Invalid category returns 400 Bad Request");

  const badFromExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses?from=bad-date", adminUser);
  const badFromExpRes = await exportExpensesCsv(badFromExpReq);
  assert(badFromExpRes.status === 400, "Expense Export: Invalid from date returns 400 Bad Request");

  const badToExpReq = await createMockRequest("/api/v1/admin/finance/export/expenses?to=bad-date", adminUser);
  const badToExpRes = await exportExpensesCsv(badToExpReq);
  assert(badToExpRes.status === 400, "Expense Export: Invalid to date returns 400 Bad Request");

  const invertedRangeExpReq = await createMockRequest(
    "/api/v1/admin/finance/export/expenses?from=2026-12-01&to=2026-01-01",
    adminUser
  );
  const invertedRangeExpRes = await exportExpensesCsv(invertedRangeExpReq);
  assert(invertedRangeExpRes.status === 400, "Expense Export: Inverted date range returns 400 Bad Request");

  console.log("\n===============================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Export test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
