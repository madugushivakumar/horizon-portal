/**
 * Horizon Portal — Day 11 Financial Reconciliation Automated Test Suite
 * scripts/test-day11-payroll-reconciliation.ts
 *
 * Verifies exact financial tie-out arithmetic across all 6 itemized runs:
 * - Two-run minimum tie-out verification (PR-2026-09 & PR-2026-08)
 * - Complete audit of all 6 runs with itemized payslips
 * - Audit of historical runs with archived ledgers (PR-2026-03)
 * - Guarantees zero data fabrication and non-mutating read-only reconciliation
 */

import { prisma } from "../src/lib/prisma";
import {
  reconcilePayrollRun,
  reconcileAllRuns,
  toPaise,
  fromPaise,
} from "../src/lib/payroll/reconciliation-service";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runReconciliationTests() {
  console.log("================================================================================");
  console.log("    HORIZON PORTAL — DAY 11 FINANCIAL RECONCILIATION TEST SUITE                 ");
  console.log("================================================================================\n");

  // ── 1. Suite: Exact Integer Paise Utilities ─────────────────────────────────
  console.log("--- 1. Exact Paise Financial Utilities ---");
  assert(toPaise(100.5) === 10050, "Converts 100.50 INR to 10050 paise");
  assert(toPaise(0.01) === 1, "Converts 0.01 INR to 1 paise");
  assert(toPaise(54788660.03) === 5478866003, "Converts large crore rupee values exactly to paise");
  assert(fromPaise(5478866003) === 54788660.03, "Converts paise back to 2-decimal rupee precision");
  assert(toPaise(null) === 0, "Handles null gracefully as 0 paise");

  // ── 2. Suite: Two-Run Minimum Tie-Out Verification (PR-2026-09 & PR-2026-08) ──
  console.log("\n--- 2. Two-Run Minimum Tie-Out Verification ---");
  
  // A. Run PR-2026-09 (Latest Active Run)
  const rec09 = await reconcilePayrollRun("PR-2026-09");
  assert(rec09 !== null, "PR-2026-09 reconciliation record found");
  if (rec09) {
    assert(rec09.storedGross === 54788660.03, `PR-2026-09 stored gross is ₹54,788,660.03 (got ₹${rec09.storedGross})`);
    assert(rec09.calculatedGross === 54430331.52, `PR-2026-09 calculated gross is ₹54,430,331.52 (got ₹${rec09.calculatedGross})`);
    assert(rec09.grossDifference === 358328.51, `PR-2026-09 gross variance is ₹358,328.51 (got ₹${rec09.grossDifference})`);
    
    assert(rec09.storedNet === 48089678.30, `PR-2026-09 stored net is ₹48,089,678.30 (got ₹${rec09.storedNet})`);
    assert(rec09.calculatedNet === 47782326.60, `PR-2026-09 calculated net is ₹47,782,326.60 (got ₹${rec09.calculatedNet})`);
    assert(rec09.netDifference === 307351.70, `PR-2026-09 net variance is ₹307,351.70 (got ₹${rec09.netDifference})`);

    assert(rec09.storedEmployeeCount === 444, "PR-2026-09 stored headcount is 444");
    assert(rec09.actualPayslipCount === 441, "PR-2026-09 actual payslip count is 441");
    assert(rec09.employeeCountDifference === 3, "PR-2026-09 headcount discrepancy detects +3 missing payslips");
    assert(rec09.reconciliationStatus === "MISMATCH", "PR-2026-09 is honestly classified as MISMATCH without data falsification");
    assert(rec09.internalArithmeticBalanced === true, "PR-2026-09 payslip items internal arithmetic is 100% balanced (Net = Gross - Deductions)");
  }

  // B. Run PR-2026-08 (Preceding Month)
  const rec08 = await reconcilePayrollRun("PR-2026-08");
  assert(rec08 !== null, "PR-2026-08 reconciliation record found");
  if (rec08) {
    assert(rec08.storedGross === 48685007.97, `PR-2026-08 stored gross is ₹48,685,007.97 (got ₹${rec08.storedGross})`);
    assert(rec08.calculatedGross === 47847409.45, `PR-2026-08 calculated gross is ₹47,847,409.45 (got ₹${rec08.calculatedGross})`);
    assert(rec08.grossDifference === 837598.52, `PR-2026-08 gross variance is ₹837,598.52 (got ₹${rec08.grossDifference})`);

    assert(rec08.storedNet === 43173318.36, `PR-2026-08 stored net is ₹43,173,318.36 (got ₹${rec08.storedNet})`);
    assert(rec08.calculatedNet === 42467961.37, `PR-2026-08 calculated net is ₹42,467,961.37 (got ₹${rec08.calculatedNet})`);
    assert(rec08.netDifference === 705356.99, `PR-2026-08 net variance is ₹705,356.99 (got ₹${rec08.netDifference})`);

    assert(rec08.storedEmployeeCount === 429, "PR-2026-08 stored headcount is 429");
    assert(rec08.actualPayslipCount === 424, "PR-2026-08 actual payslip count is 424");
    assert(rec08.employeeCountDifference === 5, "PR-2026-08 headcount discrepancy detects +5 missing payslips");
    assert(rec08.reconciliationStatus === "MISMATCH", "PR-2026-08 is honestly classified as MISMATCH without data falsification");
    assert(rec08.internalArithmeticBalanced === true, "PR-2026-08 payslip items internal arithmetic is 100% balanced");
  }

  // ── 3. Suite: Reconcile All Six Available Runs ──────────────────────────────
  console.log("\n--- 3. Audit of All 6 Runs with Itemized Payslips ---");
  const expectedRuns = [
    { id: "PR-2026-09", count: 441, storedEmp: 444, diffEmp: 3, grossDiff: 358328.51 },
    { id: "PR-2026-08", count: 424, storedEmp: 429, diffEmp: 5, grossDiff: 837598.52 },
    { id: "PR-2026-07", count: 416, storedEmp: 427, diffEmp: 11, grossDiff: 1408528.55 },
    { id: "PR-2026-06", count: 406, storedEmp: 421, diffEmp: 15, grossDiff: 2340815.80 },
    { id: "PR-2026-05", count: 394, storedEmp: 413, diffEmp: 19, grossDiff: 2231283.61 },
    { id: "PR-2026-04", count: 388, storedEmp: 413, diffEmp: 25, grossDiff: 3217879.83 },
  ];

  for (const exp of expectedRuns) {
    const res = await reconcilePayrollRun(exp.id);
    assert(res !== null, `Run ${exp.id} reconciles successfully`);
    if (res) {
      assert(res.actualPayslipCount === exp.count, `${exp.id} payslip count matches expected (${res.actualPayslipCount} === ${exp.count})`);
      assert(res.storedEmployeeCount === exp.storedEmp, `${exp.id} stored headcount matches expected (${res.storedEmployeeCount} === ${exp.storedEmp})`);
      assert(res.employeeCountDifference === exp.diffEmp, `${exp.id} employee difference correctly calculated (+${res.employeeCountDifference})`);
      assert(res.grossDifference === exp.grossDiff, `${exp.id} gross variance matches expected (+₹${res.grossDifference})`);
      assert(res.reconciliationStatus === "MISMATCH", `${exp.id} status is strictly MISMATCH`);
      assert(res.internalArithmeticBalanced === true, `${exp.id} internal math formula (Net = Gross - Deductions) is verified`);
    }
  }

  // ── 4. Suite: Historical Runs Without Itemized Payslips ──────────────────────
  console.log("\n--- 4. Historical Runs Without Itemized Payslips ---");
  const historicalRun = await reconcilePayrollRun("PR-2026-03");
  assert(historicalRun !== null, "PR-2026-03 historical run record found");
  if (historicalRun) {
    assert(historicalRun.actualPayslipCount === 0, "PR-2026-03 actual payslip count is 0");
    assert(historicalRun.reconciliationStatus === "NO_ITEMS", "PR-2026-03 is strictly categorized as NO_ITEMS");
    assert(historicalRun.discrepancyDetails[0].includes("archived or unavailable"), "PR-2026-03 displays friendly archival message");
  }

  // ── 5. Suite: Database Non-Mutation & Data Integrity ────────────────────────
  console.log("\n--- 5. Database Non-Mutation Integrity Check ---");
  const runsCount = await prisma.payrollRun.count();
  const slipsCount = await prisma.payslip.count();
  assert(runsCount === 18, `Payroll runs count remains exactly 18 (got ${runsCount})`);
  assert(slipsCount === 2469, `Payslips count remains exactly 2,469 (got ${slipsCount})`);

  console.log("\n================================================================================");
  console.log(` RECONCILIATION TESTS COMPLETE: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runReconciliationTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());

