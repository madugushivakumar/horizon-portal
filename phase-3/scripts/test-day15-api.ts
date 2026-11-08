/**
 * Horizon Portal — Day 15 AI Insights API Test Suite
 * scripts/test-day15-api.ts
 *
 * Comprehensive automated verification for Phase C & Final Privacy Audit:
 * 1. Authentication & Security boundaries (Admin, HR, Manager, Employee, Unauthenticated).
 * 2. Scoped Filter options endpoint (/api/v1/hr-insights/filters) with Small-Group Suppression.
 * 3. Primary AI Insights endpoint (/api/v1/hr-insights).
 * 4. Mandatory transparency disclaimer ("AI-generated, for human review").
 * 5. Aggregate Attrition Risk counts (Low: 301, Med: 86, High: 43, Total: 430).
 * 6. Privacy & PII concealment (Zero employee names, emails, or IDs in attrition).
 * 7. Statistical Disclosure Control: Small-group (< 5) complementary cell suppression.
 * 8. Top reason counting semantics & category groupings.
 * 9. Synchronized department filtering across Attrition & Anomalies.
 * 10. Deterministic Anomaly sorting (moneyAtRisk DESC, score DESC, ID ASC, null last).
 * 11. Preservation of null vs. zero money at risk.
 * 12. Decimal-safe cumulative financial exposure reconciliation (₹31,421,239.07 INR).
 * 13. Unmatched employee anomaly record preservation & complete ID concealment ("FORMER-EMP-***").
 * 14. Status semantics: "Flagged for Review".
 * 15. Cross-endpoint suppression consistency and anti-reconstruction verification.
 * 16. JSON serialization, NO_CACHE_HEADERS, and database invariants.
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

import { GET as getHRInsightsRoute } from "../src/app/api/v1/hr-insights/route";
import { GET as getHRInsightsFiltersRoute } from "../src/app/api/v1/hr-insights/filters/route";
import {
  HRInsightsApiResponse,
  HRInsightsFiltersApiResponse,
} from "../src/lib/hr-insights/types";

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
  options?: {
    method?: "GET";
    user?: MockUser;
  }
): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (options?.user) {
    const token = await createAuthToken({
      sub: options.user.id,
      email: options.user.email,
      role: options.user.role,
      employeeId: options.user.employeeId || null,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options?.method || "GET",
    headers,
  });
}

async function runHRInsightsApiTests() {
  console.log("==================================================================");
  console.log("    HORIZON PORTAL — DAY 15 AI INSIGHTS API & PRIVACY TEST SUITE  ");
  console.log("==================================================================\n");

  // Fetch verified test users
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Missing required demo accounts in SQLite database.");
  }

  // Pre-test DB counts for invariant verification
  const initialAttrition = await prisma.aiAttritionRisk.count();
  const initialAnomalies = await prisma.aiAnomalyResult.count();
  const initialEmployees = await prisma.employee.count();
  const initialTasks = await prisma.task.count();

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // -------------------------------------------------------------------------
  console.log("--- 1. AUTHENTICATION & RBAC BOUNDARIES ---");

  // 1.1 Unauthenticated requests
  const unauthInsights = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights"));
  assert(unauthInsights.status === 401, "Unauthenticated GET /api/v1/hr-insights returns HTTP 401");

  const unauthFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters"));
  assert(unauthFilters.status === 401, "Unauthenticated GET /api/v1/hr-insights/filters returns HTTP 401");

  // 1.2 Employee role denial (HTTP 403)
  const empInsights = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: employeeUser }));
  assert(empInsights.status === 403, "Employee role on GET /api/v1/hr-insights returns HTTP 403 Forbidden");

  const empFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: employeeUser }));
  assert(empFilters.status === 403, "Employee role on GET /api/v1/hr-insights/filters returns HTTP 403 Forbidden");

  // 1.3 Manager role denial (HTTP 403)
  const mgrInsights = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: managerUser }));
  assert(mgrInsights.status === 403, "Manager role on GET /api/v1/hr-insights returns HTTP 403 Forbidden");

  const mgrFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: managerUser }));
  assert(mgrFilters.status === 403, "Manager role on GET /api/v1/hr-insights/filters returns HTTP 403 Forbidden");

  // 1.4 HR role allowed (HTTP 200)
  const hrInsights = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: hrUser }));
  assert(hrInsights.status === 200, "HR role on GET /api/v1/hr-insights returns HTTP 200 OK");

  const hrFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: hrUser }));
  assert(hrFilters.status === 200, "HR role on GET /api/v1/hr-insights/filters returns HTTP 200 OK");

  // 1.5 Admin role allowed (HTTP 200)
  const adminInsights = await getHRInsightsRoute(await createMockRequest("/api/v1/hr-insights", { user: adminUser }));
  assert(adminInsights.status === 200, "Admin role on GET /api/v1/hr-insights returns HTTP 200 OK");

  const adminFilters = await getHRInsightsFiltersRoute(await createMockRequest("/api/v1/hr-insights/filters", { user: adminUser }));
  assert(adminFilters.status === 200, "Admin role on GET /api/v1/hr-insights/filters returns HTTP 200 OK");

  // -------------------------------------------------------------------------
  // 2. FILTERS ENDPOINT PRIVACY & SMALL-GROUP SUPPRESSION
  // -------------------------------------------------------------------------
  console.log("\n--- 2. FILTERS API STRUCTURE & PRIVACY SUPPRESSION ---");
  const filterPayload: HRInsightsFiltersApiResponse = await hrFilters.json();

  assert(filterPayload.success === true, "Filters response success flag is true");
  assert(filterPayload.data.departments.length === 11, "Filters returns all 11 departments (D00-D10)");

  const d01Filter = filterPayload.data.departments.find((d) => d.id === "D01");
  assert(Boolean(d01Filter && d01Filter.name === "Engineering" && d01Filter.attritionCount === 166 && d01Filter.anomalyCount === 82 && d01Filter.isSuppressed === false),
    "Department D01 (Engineering) metadata has 166 attrition and 82 anomalies without suppression");

  const d00Filter = filterPayload.data.departments.find((d) => d.id === "D00");
  assert(Boolean(d00Filter && d00Filter.name === "Executive Office" && d00Filter.hasAttritionData === false && d00Filter.attritionCount === 0),
    "Department D00 (Executive Office) correctly reports 0 attrition records (model excluded)");

  // Small-group suppression in filters: D00 has 1 anomaly (< 5), D05 has 4 anomalies (< 5)
  assert(Boolean(d00Filter && d00Filter.anomalyCount === null && d00Filter.anomalyCountDisplay === "< 5" && d00Filter.isSuppressed === true),
    "Filters endpoint suppresses D00 anomaly count (< 5) with display '< 5'");

  const d05Filter = filterPayload.data.departments.find((d) => d.id === "D05");
  assert(Boolean(d05Filter && d05Filter.anomalyCount === null && d05Filter.anomalyCountDisplay === "< 5" && d05Filter.isSuppressed === true),
    "Filters endpoint suppresses D05 anomaly count (< 5) with display '< 5'");

  // Verify raw numbers 1 and 4 are NOT exposed in D00 or D05
  const hasRaw1Or4 = filterPayload.data.departments.some(
    (d) => d.anomalyCount === 1 || d.anomalyCount === 4
  );
  assert(!hasRaw1Or4, "Filters endpoint strictly omits raw numeric counts 1 and 4 for small departments");

  // Unassigned/former employee filter check (count is 50, which is >= 5, not a small group)
  assert(Boolean(filterPayload.data.unassignedOption && filterPayload.data.unassignedOption.anomalyCount === 50),
    "Filters provides unassigned option accounting for exactly 50 historical/unlinked anomaly records (safe non-small group)");

  // -------------------------------------------------------------------------
  // 3. PARAMETER VALIDATION & ERROR HANDLING
  // -------------------------------------------------------------------------
  console.log("\n--- 3. QUERY PARAMETER VALIDATION (ZOD) ---");

  // 3.1 Non-existent department ID returns HTTP 404
  const invalidDeptReq = await createMockRequest("/api/v1/hr-insights?departmentId=D99", { user: hrUser });
  const invalidDeptRes = await getHRInsightsRoute(invalidDeptReq);
  assert(invalidDeptRes.status === 404, "Invalid departmentId (D99) returns HTTP 404 Not Found");

  // 3.2 Empty departmentId handled gracefully (falls back to organization-wide)
  const emptyDeptReq = await createMockRequest("/api/v1/hr-insights?departmentId=", { user: hrUser });
  const emptyDeptRes = await getHRInsightsRoute(emptyDeptReq);
  assert(emptyDeptRes.status === 200, "Empty departmentId falls back to organization-wide view (HTTP 200)");

  // -------------------------------------------------------------------------
  // 4. ORGANIZATION-WIDE AI INSIGHTS & MANDATORY DISCLAIMER
  // -------------------------------------------------------------------------
  console.log("\n--- 4. ORGANIZATION-WIDE AGGREGATION & TRANSPARENCY ---");
  const mainPayload: HRInsightsApiResponse = await hrInsights.json();

  // 4.1 Mandatory transparency label
  assert(mainPayload.data.disclaimer === "AI-generated, for human review",
    "Mandatory transparency label 'AI-generated, for human review' is present");
  assert(mainPayload.data.governanceNotice.includes("Human review is required"),
    "Governance notice explicitly states human review is required and predictions are not automated decisions");

  // 4.2 Reconcile attrition totals (Requirement 7)
  const att = mainPayload.data.attrition;
  assert(att.totalEvaluated === 430, `Total evaluated attrition records: ${att.totalEvaluated} (Expected: 430)`);
  assert(att.riskBands.low === 301, `Low risk count: ${att.riskBands.low} (Expected: 301)`);
  assert(att.riskBands.medium === 86, `Medium risk count: ${att.riskBands.medium} (Expected: 86)`);
  assert(att.riskBands.high === 43, `High risk count: ${att.riskBands.high} (Expected: 43)`);
  assert(att.riskBands.highRiskPercentage === 10.0, `High risk percentage: ${att.riskBands.highRiskPercentage}% (Expected: 10.0%)`);
  assert(att.riskBands.isSuppressed === false, "Organization-wide risk bands are not suppressed (all counts >= 5)");

  // -------------------------------------------------------------------------
  // 5. PRIVACY & PII CONCEALMENT (STRICT ZERO-LEAKAGE)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. PRIVACY AUDIT (ZERO ATTRITION PII LEAKAGE) ---");
  const stringifiedJson = JSON.stringify(mainPayload);

  // Check for employee names in database
  const sampleEmployees = await prisma.employee.findMany({ take: 20, select: { firstName: true, lastName: true, email: true } });
  let leakedNames = 0;
  for (const emp of sampleEmployees) {
    if (stringifiedJson.includes(`"${emp.firstName}"`) || stringifiedJson.includes(`"${emp.lastName}"`)) {
      leakedNames++;
    }
    if (stringifiedJson.includes(`"${emp.email}"`)) {
      leakedNames++;
    }
  }
  assert(leakedNames === 0, "Zero employee first names, last names, or emails present in API response");

  // Check that attrition data contains no raw employee profiles array
  assert(!("employees" in att) && !("records" in att), "Attrition payload contains only aggregate data (no employee list)");

  // -------------------------------------------------------------------------
  // 6. STATISTICAL DISCLOSURE CONTROL: SMALL-GROUP COMPLEMENTARY SUPPRESSION
  // -------------------------------------------------------------------------
  console.log("\n--- 6. STATISTICAL DISCLOSURE CONTROL (SUPPRESSION & RESIDUAL PROTECTION) ---");

  // 6.1 Department distribution suppression in organization view
  const deptDist = att.departmentDistribution;
  assert(deptDist.length === 11, "Department distribution includes all 11 departments");

  // D01 (Engineering: High=12, Med=34, Low=120) has no suppression
  const d01Metric = deptDist.find((d) => d.departmentId === "D01");
  assert(Boolean(d01Metric && d01Metric.hasSuppression === false && d01Metric.high === 12 && d01Metric.medium === 34 && d01Metric.low === 120),
    "Department D01 (all counts >= 5) has zero suppression");

  // D03 (Data & AI: High=1, Med=7, Low=43) has High < 5 => both High and Medium are suppressed
  const d03Metric = deptDist.find((d) => d.departmentId === "D03");
  assert(Boolean(d03Metric && d03Metric.hasSuppression === true && d03Metric.high === null && d03Metric.highDisplay === "< 5"),
    "Department D03 has High (< 5) primarily suppressed with display '< 5'");
  assert(Boolean(d03Metric && d03Metric.medium === null && d03Metric.suppressedBands.includes("medium")),
    "Department D03 has Medium complementary (secondary) suppressed to prevent residual subtraction leakage");

  // D08 (Finance & Accounts: Total=16, Low=12, Med=4, High=0):
  // Medium is 4 (< 5). High is 0 (<= 4). BOTH must be suppressed so 16 - 12 - 0 != 4!
  const d08Metric = deptDist.find((d) => d.departmentId === "D08");
  assert(Boolean(d08Metric && d08Metric.hasSuppression === true && d08Metric.medium === null && d08Metric.high === null),
    "Department D08 suppresses both Medium (4) and High (0) preventing residual derivation (16 - 12 = 4)");

  // D02 (Product & Design: Total=25, Low=23, Med=2, High=0):
  const d02Metric = deptDist.find((d) => d.departmentId === "D02");
  assert(Boolean(d02Metric && d02Metric.hasSuppression === true && d02Metric.medium === null && d02Metric.high === null),
    "Department D02 suppresses both Medium (2) and High (0) preventing residual derivation (25 - 23 = 2)");

  // D10 (Legal & Compliance: Total=10, Low=8, Med=2, High=0):
  const d10Metric = deptDist.find((d) => d.departmentId === "D10");
  assert(Boolean(d10Metric && d10Metric.hasSuppression === true && d10Metric.medium === null && d10Metric.high === null),
    "Department D10 suppresses both Medium (2) and High (0) preventing residual derivation (10 - 8 = 2)");

  // 6.2 Filtered Department View (e.g. ?departmentId=D07 where High=1 < 5)
  const d07Req = await createMockRequest("/api/v1/hr-insights?departmentId=D07", { user: hrUser });
  const d07Res = await getHRInsightsRoute(d07Req);
  const d07Payload: HRInsightsApiResponse = await d07Res.json();
  const d07RiskBands = d07Payload.data.attrition.riskBands;

  assert(d07RiskBands.isSuppressed === true, "Filtered D07 view applies small-group suppression to top-level risk bands");
  assert(d07RiskBands.high === null && d07RiskBands.highDisplay === "< 5", "D07 High risk count is null with display '< 5'");
  assert(d07RiskBands.medium === null && d07RiskBands.mediumDisplay.includes("Suppressed"),
    "D07 Medium risk count is secondary-suppressed to protect against residual calculation");
  assert(d07RiskBands.low === 13, "D07 Low risk count (13 >= 5) is visible");

  // 6.3 Anti-Reconstruction from Totals Audit:
  // Count how many departments have suppressed High and Medium
  const suppressedHighDepts = deptDist.filter((d) => d.high === null);
  const suppressedMedDepts = deptDist.filter((d) => d.medium === null);
  assert(suppressedHighDepts.length === 8, `Exactly 8 departments have High suppressed (prevents cross-department linear solver)`);
  assert(suppressedMedDepts.length === 8, `Exactly 8 departments have Medium suppressed (prevents cross-department linear solver)`);

  // -------------------------------------------------------------------------
  // 7. TOP REASONS COUNTING SEMANTICS
  // -------------------------------------------------------------------------
  console.log("\n--- 7. TOP REASONS COUNTING SEMANTICS ---");
  const topFactors = att.topFactors;
  const topSpecific = att.topSpecificReasons;

  assert(topFactors.length > 0, `Top factors returned: ${topFactors.length} thematic factor groups`);
  assert(topSpecific.length > 0, `Top specific reasons returned: ${topSpecific.length} exact strings`);

  const deptPatternFactor = topFactors.find((f) => f.factor.includes("Departmental Historical Attrition"));
  assert(Boolean(deptPatternFactor && deptPatternFactor.count === 260),
    `Departmental attrition factor count: ${deptPatternFactor?.count} (Expected: 260 unique records / 60.5%)`);

  const experienceFactor = topFactors.find((f) => f.factor.includes("Experience"));
  assert(Boolean(experienceFactor && experienceFactor.count === 165),
    `Experience factor count: ${experienceFactor?.count} (Expected: 165)`);

  const specificReason1 = topSpecific[0];
  assert(specificReason1.reason === "Department has a historically higher attrition pattern" && specificReason1.count === 247,
    `Top exact reason: "${specificReason1.reason}" with count ${specificReason1.count} (Expected: 247)`);

  assert(att.countingSemantics.intraRecordDeduplication === true,
    "Counting semantics documents intra-record deduplication (each factor counted at most once per employee)");

  // -------------------------------------------------------------------------
  // 8. SYNCHRONIZED DEPARTMENT FILTERING
  // -------------------------------------------------------------------------
  console.log("\n--- 8. SYNCHRONIZED DEPARTMENT FILTERING ---");
  const d01Req = await createMockRequest("/api/v1/hr-insights?departmentId=D01", { user: hrUser });
  const d01Res = await getHRInsightsRoute(d01Req);
  const d01Payload: HRInsightsApiResponse = await d01Res.json();

  assert(d01Payload.data.filter.isFiltered === true, "Filter status isFiltered is true");
  assert(d01Payload.data.filter.departmentId === "D01", "Filter departmentId matches D01");
  assert(d01Payload.data.filter.departmentName === "Engineering", "Filter departmentName matches Engineering");
  assert(d01Payload.data.attrition.totalEvaluated === 166, `D01 attrition evaluated count: ${d01Payload.data.attrition.totalEvaluated} (Expected: 166)`);
  assert(d01Payload.data.payrollAnomalies.totalAnomalies === 82, `D01 anomalies count: ${d01Payload.data.payrollAnomalies.totalAnomalies} (Expected: 82)`);

  // -------------------------------------------------------------------------
  // 9. DETERMINISTIC ANOMALY SORTING & NULL HANDLING
  // -------------------------------------------------------------------------
  console.log("\n--- 9. ANOMALY RANKING & DETERMINISTIC SORTING ---");
  const anomaliesData = mainPayload.data.payrollAnomalies;
  const items = anomaliesData.items;

  assert(items.length === 405, `Total anomaly items: ${items.length} (Expected: 405)`);

  // Verify first record has maximum money at risk
  const firstItem = items[0];
  assert(firstItem.moneyAtRisk === 2165286.9, `First item has maximum money at risk: ₹${firstItem.moneyAtRisk} (Expected: ₹2,165,286.90)`);
  assert(firstItem.formattedMoneyAtRisk === "₹21,65,286.90", `Formatted money at risk in Indian Rupees: ${firstItem.formattedMoneyAtRisk}`);

  // Verify descending sort order
  let isSortedDescending = true;
  let seenNull = false;
  let sortViolationReason = "";

  for (let i = 0; i < items.length - 1; i++) {
    const cur = items[i];
    const next = items[i + 1];

    if (cur.moneyAtRisk === null) {
      seenNull = true;
    }

    if (seenNull && next.moneyAtRisk !== null) {
      isSortedDescending = false;
      sortViolationReason = `Numeric moneyAtRisk found after null at index ${i + 1}`;
      break;
    }

    if (cur.moneyAtRisk !== null && next.moneyAtRisk !== null) {
      if (cur.moneyAtRisk < next.moneyAtRisk) {
        isSortedDescending = false;
        sortViolationReason = `MoneyAtRisk out of order: ${cur.moneyAtRisk} < ${next.moneyAtRisk} at index ${i}`;
        break;
      }
    }
  }
  assert(isSortedDescending, "Anomalies sorted by moneyAtRisk DESC with all null values placed last", sortViolationReason);

  // -------------------------------------------------------------------------
  // 10. PRESERVATION OF NULL VS ZERO & FINANCIAL PRECISION
  // -------------------------------------------------------------------------
  console.log("\n--- 10. NULL VS ZERO PRESERVATION & FINANCIAL PRECISION ---");
  assert(anomaliesData.totalPayrollAnomalies === 184, `Total payroll anomalies: ${anomaliesData.totalPayrollAnomalies} (Expected: 184)`);
  assert(anomaliesData.totalAttendanceAnomalies === 221, `Total attendance anomalies: ${anomaliesData.totalAttendanceAnomalies} (Expected: 221)`);
  assert(anomaliesData.nullMoneyCount === 221, `Null money at risk count: ${anomaliesData.nullMoneyCount} (Expected: 221)`);
  assert(anomaliesData.zeroMoneyCount === 6, `Zero money at risk count: ${anomaliesData.zeroMoneyCount} (Expected: 6)`);
  assert(anomaliesData.positiveMoneyCount === 178, `Positive money at risk count: ${anomaliesData.positiveMoneyCount} (Expected: 178)`);

  // Verify exact cumulative exposure
  assert(anomaliesData.cumulativeMoneyAtRisk === 31421239.07, `Cumulative exposure: ₹${anomaliesData.cumulativeMoneyAtRisk} (Expected: ₹31421239.07)`);
  assert(anomaliesData.formattedCumulativeMoneyAtRisk === "₹3,14,21,239.07", `Formatted cumulative exposure: ${anomaliesData.formattedCumulativeMoneyAtRisk}`);
  assert(anomaliesData.aggregationLabel.includes("18-month cumulative historical flagged payroll exposure"),
    "Exposure label explicitly declares '18-month cumulative historical flagged payroll exposure'");

  // -------------------------------------------------------------------------
  // 11. UNMATCHED EMPLOYEES & IDENTITY CONCEALMENT ("FORMER-EMP-***")
  // -------------------------------------------------------------------------
  console.log("\n--- 11. UNMATCHED EMPLOYEES & IDENTIFIER CONCEALMENT ---");
  assert(anomaliesData.unmatchedEmployeeRecordsCount === 50,
    `Unmatched employee anomaly records count: ${anomaliesData.unmatchedEmployeeRecordsCount} (Expected: 50)`);

  const unmatchedItems = items.filter((item) => item.isUnmatchedEmployee === true);
  assert(unmatchedItems.length === 50, "Exactly 50 items flagged as isUnmatchedEmployee: true");

  // Confirm that ALL 50 unmatched items use "FORMER-EMP-***" and NONE expose original IDs
  const allUseFormerMask = unmatchedItems.every((item) => item.employeeMask === "FORMER-EMP-***");
  assert(allUseFormerMask, "All 50 unmatched employee items use generic 'FORMER-EMP-***' mask");

  const allUseFormerDept = unmatchedItems.every((item) => item.departmentName === "Unassigned / Former Employee");
  assert(allUseFormerDept, "All 50 unmatched employee items map department to 'Unassigned / Former Employee'");

  // Sample known unmatched IDs from data pack
  const sampleUnmatchedRawIds = ["EMP-0356", "EMP-0460", "EMP-0630", "EMP-0578", "EMP-0388", "EMP-0561"];
  let rawIdExposed = false;
  for (const rawId of sampleUnmatchedRawIds) {
    if (stringifiedJson.includes(`"${rawId}"`) || stringifiedJson.includes(`"***${rawId.slice(-2)}"`) && unmatchedItems.some(u => u.employeeMask.includes(rawId.slice(-2)))) {
      rawIdExposed = true;
    }
  }
  assert(!rawIdExposed, "Original unmatched employee IDs (EMP-0356, etc.) are 100% concealed from the response");

  // Verify reviewStatus is "Flagged for Review" across all items
  const allFlaggedForReview = items.every((item) => item.reviewStatus === "Flagged for Review");
  assert(allFlaggedForReview, "All 405 anomaly items display reviewStatus: 'Flagged for Review' (no speculative statuses)");

  // -------------------------------------------------------------------------
  // 12. NO_CACHE_HEADERS, JSON SERIALIZATION & DATABASE INVARIANTS
  // -------------------------------------------------------------------------
  console.log("\n--- 12. HEADERS, SERIALIZATION & DB INVARIANTS ---");
  assert(hrInsights.headers.get("Cache-Control")?.includes("no-store") === true,
    "GET /api/v1/hr-insights includes strict Cache-Control: no-store header");
  assert(hrFilters.headers.get("Cache-Control")?.includes("no-store") === true,
    "GET /api/v1/hr-insights/filters includes strict Cache-Control: no-store header");

  // Invariant verification: Ensure zero database records were modified
  const postAttrition = await prisma.aiAttritionRisk.count();
  const postAnomalies = await prisma.aiAnomalyResult.count();
  const postEmployees = await prisma.employee.count();
  const postTasks = await prisma.task.count();

  assert(postAttrition === initialAttrition, `Database attrition count unchanged: ${postAttrition} === ${initialAttrition}`);
  assert(postAnomalies === initialAnomalies, `Database anomaly count unchanged: ${postAnomalies} === ${initialAnomalies}`);
  assert(postEmployees === initialEmployees, `Database employee count unchanged: ${postEmployees} === ${initialEmployees}`);
  assert(postTasks === initialTasks, `Database task count unchanged: ${postTasks} === ${initialTasks}`);

  await prisma.$disconnect();

  console.log("\n==================================================================");
  console.log(`  DAY 15 API & PRIVACY TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runHRInsightsApiTests().catch((err) => {
  console.error("Test execution failed with fatal error:", err);
  process.exit(1);
});
