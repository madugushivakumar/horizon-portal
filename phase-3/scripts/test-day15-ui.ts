/**
 * Horizon Portal — Day 15 Frontend AI Insights Dashboard Verification Suite
 * scripts/test-day15-ui.ts
 *
 * Verifies:
 * 1. Page and Component Architecture:
 *    - All 14 components in src/components/hr-insights/ and src/app/hr-insights/page.tsx exist
 *    - Page metadata and export structure
 * 2. Server-Side Page Route Security:
 *    - Unauthenticated users handled
 *    - Role enforcement: Admin/HR permitted, Manager/Employee denied with 403 Forbidden
 * 3. KPI Metrics & Overview Cards:
 *    - 430 evaluated, 43 high, 86 medium, 301 low
 *    - 405 anomalies (184 payroll, 221 attendance)
 *    - ₹3,14,21,239.07 cumulative historical exposure
 *    - Strict label: "18-month cumulative historical flagged payroll exposure"
 * 4. Privacy & Statistical Disclosure Control (SDC):
 *    - Primary suppression (< 5)
 *    - Complementary suppression (Residual Protection)
 *    - Zero employee names, emails, raw IDs, or individual scores
 *    - Masked former employee ID (FORMER-EMP-***)
 * 5. Financial Value Formatting:
 *    - Null -> "N/A — Non-monetary Attendance" (never ₹0)
 *    - Zero -> "₹0.00"
 *    - Positive -> Formatted currency string
 *    - Review status -> strictly "Flagged for Review"
 * 6. Mandatory AI Disclosure:
 *    - Exact text "AI-generated, for human review" verified across all components
 * 7. Department Filter & Synchronization:
 *    - 11 departments with suppression flags (< 5 in D00 and D05)
 *    - Unassigned former employee option (50 anomalies)
 * 8. Database Invariants:
 *    - Zero database mutations
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
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
  name?: string | null;
}

async function createMockRequest(
  url: string,
  options: { user?: MockUser; method?: string; body?: unknown } = {}
): Promise<NextRequest> {
  const reqUrl = new URL(url, "http://localhost:3000");
  const headers = new Headers();
  headers.set("content-type", "application/json");

  if (options.user) {
    const token = await createAuthToken({
      sub: options.user.id,
      email: options.user.email,
      role: options.user.role,
      employeeId: options.user.employeeId || null,
      name: options.user.name || undefined,
    });
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
    headers.set("authorization", `Bearer ${token}`);
  }

  return new NextRequest(reqUrl.toString(), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function runDay15UITestSuite() {
  console.log("==================================================================");
  console.log("   HORIZON PORTAL — DAY 15 FRONTEND AI INSIGHTS VERIFICATION SUITE");
  console.log("==================================================================");

  // -------------------------------------------------------------------------
  // SECTION 1: COMPONENT AND PAGE FILE ARCHITECTURE
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 1: COMPONENT & PAGE ARCHITECTURE ---");

  const requiredFiles = [
    "src/app/hr-insights/page.tsx",
    "src/components/hr-insights/HRInsightsDashboard.tsx",
    "src/components/hr-insights/AIReviewLabel.tsx",
    "src/components/hr-insights/InsightsHeader.tsx",
    "src/components/hr-insights/DepartmentFilter.tsx",
    "src/components/hr-insights/HRInsightsMetrics.tsx",
    "src/components/hr-insights/AttritionRiskOverview.tsx",
    "src/components/hr-insights/DepartmentAttritionTable.tsx",
    "src/components/hr-insights/TopAttritionFactors.tsx",
    "src/components/hr-insights/PayrollAnomalyPanel.tsx",
    "src/components/hr-insights/PayrollAnomalyCard.tsx",
    "src/components/hr-insights/HumanReviewGuidance.tsx",
    "src/components/hr-insights/HRInsightsSkeleton.tsx",
    "src/components/hr-insights/HRInsightsEmptyState.tsx",
    "src/components/hr-insights/HRInsightsErrorState.tsx",
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    assert(fs.existsSync(fullPath), `Required file exists: ${relPath}`);
  }

  // Check Page Metadata
  const pageContent = fs.readFileSync(path.join(process.cwd(), "src/app/hr-insights/page.tsx"), "utf-8");
  assert(
    pageContent.includes('title: "AI Workforce Insights | Horizon Portal"'),
    "Page route exports metadata with title 'AI Workforce Insights | Horizon Portal'"
  );
  assert(
    pageContent.includes("export default async function HRInsightsPage"),
    "Page route exports default async server component HRInsightsPage"
  );
  assert(
    pageContent.includes("AppShell"),
    "Page route wraps content in existing authenticated AppShell"
  );

  // -------------------------------------------------------------------------
  // SECTION 2: SERVER ROUTE ACCESS CONTROL & 403 GUARD
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 2: SERVER PAGE ACCESS CONTROL ---");

  assert(
    pageContent.includes('redirect("/login")'),
    "Page route redirects unauthenticated requests to /login"
  );
  assert(
    pageContent.includes('role !== "ADMIN" && role !== "HR"'),
    "Page route restricts access strictly to ADMIN and HR roles"
  );
  assert(
    pageContent.includes("Access Restricted — 403 Forbidden"),
    "Page route renders explicit 403 Forbidden state for non-HR/non-Admin roles"
  );

  // -------------------------------------------------------------------------
  // SECTION 3: MANDATORY AI DISCLOSURE ("AI-generated, for human review")
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 3: MANDATORY AI DISCLOSURE VERIFICATION ---");

  const mandatoryDisclosure = "AI-generated, for human review";

  const componentsToCheck = [
    "src/components/hr-insights/AIReviewLabel.tsx",
    "src/components/hr-insights/InsightsHeader.tsx",
    "src/components/hr-insights/HRInsightsMetrics.tsx",
    "src/components/hr-insights/AttritionRiskOverview.tsx",
    "src/components/hr-insights/DepartmentAttritionTable.tsx",
    "src/components/hr-insights/TopAttritionFactors.tsx",
    "src/components/hr-insights/PayrollAnomalyPanel.tsx",
  ];

  for (const compPath of componentsToCheck) {
    const content = fs.readFileSync(path.join(process.cwd(), compPath), "utf-8");
    const hasDisclosureOrLabel =
      content.includes(mandatoryDisclosure) || content.includes("AIReviewLabel");
    assert(
      hasDisclosureOrLabel,
      `Component ${path.basename(compPath)} includes mandatory AI disclosure or imports AIReviewLabel`
    );
  }

  // -------------------------------------------------------------------------
  // SECTION 4: API INTEGRATION & BASELINE KPI METRICS
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 4: API INTEGRATION & BASELINE METRICS ---");

  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  if (!hrUser) {
    throw new Error("Missing hr@growmar.com user account in database.");
  }

  const req = await createMockRequest("/api/v1/hr-insights", { user: hrUser });
  const res = await getHRInsightsRoute(req);
  assert(res.status === 200, "HR GET /api/v1/hr-insights returns HTTP 200 OK");

  const payload: HRInsightsApiResponse = await res.json();
  assert(payload.success === true, "Insights response success is true");
  assert(payload.data.disclaimer === "AI-generated, for human review", "API payload disclaimer matches contract");

  const { attrition, payrollAnomalies } = payload.data;

  // Metric 1: Employees Evaluated
  assert(attrition.totalEvaluated === 430, "Total evaluated employees equals 430");

  // Metric 2: High Attrition Risk
  assert(attrition.riskBands.high === 43, "High attrition risk count equals 43");
  assert(attrition.riskBands.highDisplay === "43", "High attrition risk display string equals '43'");
  assert(attrition.riskBands.highRiskPercentage === 10.0, "High risk percentage equals 10.0%");

  // Metric 3: Medium Attrition Risk
  assert(attrition.riskBands.medium === 86, "Medium attrition risk count equals 86");
  assert(attrition.riskBands.mediumDisplay === "86", "Medium attrition risk display string equals '86'");

  // Metric 4: Low Attrition Risk
  assert(attrition.riskBands.low === 301, "Low attrition risk count equals 301");
  assert(attrition.riskBands.lowDisplay === "301", "Low attrition risk display string equals '301'");

  // Metric 5: Flagged Anomalies
  assert(payrollAnomalies.totalAnomalies === 405, "Total anomalies flagged equals 405");
  assert(payrollAnomalies.totalPayrollAnomalies === 184, "Total payroll anomalies equals 184");
  assert(payrollAnomalies.totalAttendanceAnomalies === 221, "Total attendance anomalies equals 221");

  // Metric 6: Historical Exposure
  assert(payrollAnomalies.cumulativeMoneyAtRisk === 31421239.07, "Cumulative exposure equals ₹31,421,239.07");
  assert(payrollAnomalies.formattedCumulativeMoneyAtRisk === "₹3,14,21,239.07", "Formatted exposure equals '₹3,14,21,239.07'");
  assert(
    payrollAnomalies.aggregationLabel === "18-month cumulative historical flagged payroll exposure",
    "Exposure label strictly reads '18-month cumulative historical flagged payroll exposure'"
  );

  // -------------------------------------------------------------------------
  // SECTION 5: PRIVACY AUDIT & STATISTICAL DISCLOSURE CONTROL
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 5: PRIVACY & STATISTICAL DISCLOSURE CONTROL ---");

  // Verify zero employee PII in attrition payload
  const jsonStr = JSON.stringify(attrition);
  assert(!jsonStr.includes("EMP-"), "Zero raw employee IDs in attrition payload");
  assert(!jsonStr.includes("@"), "Zero employee email addresses in attrition payload");
  assert(!jsonStr.includes("riskScore12m"), "Zero individual risk scores in attrition payload");

  // Department Table Suppression
  const deptD03 = attrition.departmentDistribution.find((d) => d.departmentId === "D03");
  assert(Boolean(deptD03), "Department D03 found in department distribution");
  assert(deptD03!.high === null, "Department D03 High risk count is null (primary suppression)");
  assert(deptD03!.highDisplay === "< 5", "Department D03 High risk display string is '< 5'");
  assert(deptD03!.medium === null, "Department D03 Medium risk count is null (complementary suppression)");
  assert(
    deptD03!.mediumDisplay === "Suppressed (Residual Protection)",
    "Department D03 Medium risk display string is 'Suppressed (Residual Protection)'"
  );
  assert(deptD03!.hasSuppression === true, "Department D03 hasSuppression flag is true");

  // Check DepartmentAttritionTable code: ensures null is never replaced with 0
  const deptTableCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/hr-insights/DepartmentAttritionTable.tsx"),
    "utf-8"
  );
  assert(
    deptTableCode.includes("dept.highDisplay") && !deptTableCode.includes("dept.high ?? 0"),
    "DepartmentAttritionTable renders dept.highDisplay and avoids 'dept.high ?? 0'"
  );
  assert(
    deptTableCode.includes("dept.mediumDisplay") && !deptTableCode.includes("dept.medium ?? 0"),
    "DepartmentAttritionTable renders dept.mediumDisplay and avoids 'dept.medium ?? 0'"
  );

  // -------------------------------------------------------------------------
  // SECTION 6: FINANCIAL DISPLAY RULES & UNMATCHED EMPLOYEES
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 6: FINANCIAL FORMATTING & MASKED EMPLOYEES ---");

  const anomalyCardCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/hr-insights/PayrollAnomalyCard.tsx"),
    "utf-8"
  );

  // Null financial values -> "N/A — Non-monetary Attendance" (never ₹0)
  assert(
    anomalyCardCode.includes('financialDisplay = "N/A — Non-monetary Attendance"'),
    "PayrollAnomalyCard renders 'N/A — Non-monetary Attendance' when moneyAtRisk is null"
  );
  assert(
    anomalyCardCode.includes('financialDisplay = "₹0.00"'),
    "PayrollAnomalyCard renders '₹0.00' when moneyAtRisk is 0"
  );

  // Review Status
  assert(
    anomalyCardCode.includes("item.reviewStatus"),
    "PayrollAnomalyCard renders API reviewStatus ('Flagged for Review')"
  );

  // Unmatched Former Employees
  const unmatchedItems = payrollAnomalies.items.filter((i) => i.isUnmatchedEmployee);
  assert(unmatchedItems.length === 50, "Exactly 50 items flagged as isUnmatchedEmployee");
  assert(
    unmatchedItems.every((i) => i.employeeMask === "FORMER-EMP-***"),
    "All 50 unmatched items use masked identifier 'FORMER-EMP-***'"
  );
  assert(
    unmatchedItems.every((i) => i.departmentName === "Unassigned / Former Employee"),
    "All 50 unmatched items map to 'Unassigned / Former Employee'"
  );

  // Deterministic Ranking
  const items = payrollAnomalies.items;
  let isSorted = true;
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i];
    const b = items[i + 1];
    const aMoney = a.moneyAtRisk;
    const bMoney = b.moneyAtRisk;

    if (aMoney !== null && bMoney !== null) {
      if (aMoney < bMoney) {
        isSorted = false;
        break;
      }
    } else if (aMoney === null && bMoney !== null) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, "Anomaly items preserved in deterministic order: moneyAtRisk DESC with null last");

  // -------------------------------------------------------------------------
  // SECTION 7: THEMATIC FACTORS & VERBATIM REASONS
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 7: THEMATIC FACTORS & SOURCE REASONS ---");

  assert(attrition.topFactors.length === 8, "Top factors returns exactly 8 thematic categories");
  assert(
    attrition.topFactors[0].factor === "Departmental Historical Attrition Pattern",
    "First thematic factor is 'Departmental Historical Attrition Pattern'"
  );
  assert(attrition.topFactors[0].count === 260, "Departmental factor count is 260 unique employee records");
  assert(attrition.topFactors[0].percentage === 60.5, "Departmental factor percentage is 60.5%");

  assert(attrition.topSpecificReasons.length === 10, "Top specific reasons returns exactly 10 exact strings");
  assert(
    attrition.topSpecificReasons[0].reason === "Department has a historically higher attrition pattern",
    "Top specific reason is 'Department has a historically higher attrition pattern'"
  );
  assert(attrition.topSpecificReasons[0].count === 247, "Top specific reason count is 247 citations");

  const factorsCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/hr-insights/TopAttritionFactors.tsx"),
    "utf-8"
  );
  assert(
    factorsCode.includes("Thematic Factor Groups") && factorsCode.includes("Specific Source Reasons"),
    "TopAttritionFactors component provides separate visual tabs for thematic factors and verbatim source reasons"
  );
  assert(
    factorsCode.includes("deduplicated per employee record"),
    "TopAttritionFactors clarifies deduplication methodology"
  );

  // -------------------------------------------------------------------------
  // SECTION 8: FILTERS API INTEGRATION & SYNCHRONIZATION
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 8: FILTERS API INTEGRATION ---");

  const filterReq = await createMockRequest("/api/v1/hr-insights/filters", { user: hrUser });
  const filterRes = await getHRInsightsFiltersRoute(filterReq);
  assert(filterRes.status === 200, "HR GET /api/v1/hr-insights/filters returns HTTP 200 OK");

  const filterPayload: HRInsightsFiltersApiResponse = await filterRes.json();
  assert(filterPayload.success === true, "Filter options success is true");
  assert(filterPayload.data.departments.length === 11, "Filter options include all 11 departments");

  const d00 = filterPayload.data.departments.find((d) => d.id === "D00");
  const d05 = filterPayload.data.departments.find((d) => d.id === "D05");
  assert(d00?.anomalyCountDisplay === "< 5", "Department D00 filter displays anomaly count '< 5'");
  assert(d05?.anomalyCountDisplay === "< 5", "Department D05 filter displays anomaly count '< 5'");
  assert(
    filterPayload.data.unassignedOption?.anomalyCount === 50,
    "Filter options include unassignedOption with 50 anomalies"
  );

  // Check Dashboard AbortController race condition protection
  const dashboardCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/hr-insights/HRInsightsDashboard.tsx"),
    "utf-8"
  );
  assert(
    dashboardCode.includes("new AbortController()") && dashboardCode.includes("controller.abort()"),
    "HRInsightsDashboard uses AbortController to cancel in-flight requests and prevent race conditions"
  );
  assert(
    dashboardCode.includes('selectedDepartmentId === "UNASSIGNED"'),
    "HRInsightsDashboard supports UNASSIGNED former employees filter option cleanly"
  );

  // -------------------------------------------------------------------------
  // SECTION 9: RESPONSIBLE AI & HUMAN REVIEW GUIDANCE
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 9: RESPONSIBLE AI GUIDANCE ---");

  const guidanceCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/hr-insights/HumanReviewGuidance.tsx"),
    "utf-8"
  );
  assert(
    guidanceCode.includes("How HR should use these insights"),
    "Guidance component contains authoritative heading 'How HR should use these insights'"
  );
  assert(
    guidanceCode.includes("Mandatory Human Validation"),
    "Guidance component emphasizes Mandatory Human Validation"
  );
  assert(
    guidanceCode.includes("No Individual Retaliation"),
    "Guidance component prohibits automated adverse employment outcomes"
  );
  assert(
    guidanceCode.includes("Recommended Supportive Interventions"),
    "Guidance component highlights supportive review areas (workload, career progression, manager check-ins)"
  );

  // -------------------------------------------------------------------------
  // SECTION 10: DATABASE INVARIANTS CHECK
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 10: DATABASE INVARIANTS CHECK ---");

  const [attritionCount, anomalyCount, employeeCount, taskCount, sprintCount, deptCount] =
    await Promise.all([
      prisma.aiAttritionRisk.count(),
      prisma.aiAnomalyResult.count(),
      prisma.employee.count(),
      prisma.task.count(),
      prisma.sprint.count(),
      prisma.department.count(),
    ]);

  assert(attritionCount === 430, `Database attrition records unchanged: 430 === ${attritionCount}`);
  assert(anomalyCount === 405, `Database anomaly records unchanged: 405 === ${anomalyCount}`);
  assert(employeeCount === 441, `Database employee count unchanged: 441 === ${employeeCount}`);
  assert(taskCount === 4844, `Database task count unchanged: 4,844 === ${taskCount}`);
  assert(sprintCount === 38, `Database sprint count unchanged: 38 === ${sprintCount}`);
  assert(deptCount === 11, `Database department count unchanged: 11 === ${deptCount}`);

  // Summary
  console.log("\n==================================================================");
  console.log(`  DAY 15 FRONTEND UI SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay15UITestSuite()
  .catch((err) => {
    console.error("Unexpected error during Day 15 UI test suite execution:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
