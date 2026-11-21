/**
 * Horizon Portal — Day 12 Financial Calculation & Ageing Engine Test Suite
 * scripts/test-day12-finance.ts
 *
 * Verifies:
 * 1. Currency & paise utilities (finite validation, floating-point edge cases)
 * 2. Invoice eligibility predicates (PAID, SENT, PARTIALLY_PAID, OVERDUE, DRAFT, CANCELLED)
 * 3. Exact ageing boundary classifications relative to cutoff date
 * 4. Three reference invoices verification against 2026-11-03 cutoff
 * 5. Individual invoice tie-out reconciliation (exact match, tolerance, cancelled records)
 * 6. Financial invariants (Billed = Collected + Outstanding, Overdue + Not Overdue, Expenses)
 * 7. Live database integration verification against all 743 invoices and 501 expenses
 */

import { PrismaClient } from "@prisma/client";
import {
  toPaise,
  fromPaise,
  isEligibleIssuedInvoice,
  isOperationallyOpenInvoice,
  reconcileIndividualInvoices,
  validateFinanceInvariants,
  calculateFinanceSummary,
  calculateDaysOverdue,
  classifyAgeingBucket,
  formatINR,
  InvoiceLike,
  ExpenseLike,
} from "../src/lib/finance";

const prisma = new PrismaClient();

async function runTests() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — DAY 12 FINANCE ENGINE VERIFICATION SUITE   ");
  console.log("===============================================================\n");

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

  // ===========================================================================
  // 1. Currency & Paise Calculation Tests
  // ===========================================================================
  console.log("--- 1. Currency & Paise Calculation Tests ---");

  assert(toPaise(100) === 10000, "Whole rupee to paise conversion (₹100 -> 10000)");
  assert(fromPaise(10000) === 100, "Paise to whole rupee conversion (10000 -> ₹100)");

  assert(toPaise(10.5) === 1050, "Decimal rupee with 1 decimal (₹10.50 -> 1050)");
  assert(toPaise(10.55) === 1055, "Decimal rupee with 2 decimals (₹10.55 -> 1055)");
  assert(fromPaise(1055) === 10.55, "Paise to decimal rupee (1055 -> ₹10.55)");

  // Floating point edge case: 0.1 + 0.2 in JS is 0.30000000000000004
  const fpSum = 0.1 + 0.2;
  assert(toPaise(fpSum) === 30, "Handles IEEE-754 float drift (0.1 + 0.2 -> 30 paise)");
  assert(fromPaise(toPaise(fpSum)) === 0.3, "Round-trip float conversion recovers 0.30");

  assert(toPaise(0) === 0, "Zero rupee conversion (₹0 -> 0 paise)");
  assert(fromPaise(0) === 0, "Zero paise conversion (0 paise -> ₹0)");

  // Invalid values testing
  let nanThrew = false;
  try {
    toPaise(NaN);
  } catch (e) {
    nanThrew = e instanceof TypeError;
  }
  assert(nanThrew, "toPaise(NaN) throws TypeError");

  let infThrew = false;
  try {
    toPaise(Infinity);
  } catch (e) {
    infThrew = e instanceof TypeError;
  }
  assert(infThrew, "toPaise(Infinity) throws TypeError");

  let nonNumThrew = false;
  try {
    toPaise("100" as any);
  } catch (e) {
    nonNumThrew = e instanceof TypeError;
  }
  assert(nonNumThrew, "toPaise('100') throws TypeError for string input");

  // ===========================================================================
  // 2. Invoice Eligibility Predicate Tests
  // ===========================================================================
  console.log("\n--- 2. Invoice Eligibility Predicate Tests ---");

  // isEligibleIssuedInvoice
  assert(isEligibleIssuedInvoice("PAID"), "PAID is an eligible issued status");
  assert(isEligibleIssuedInvoice("SENT"), "SENT is an eligible issued status");
  assert(isEligibleIssuedInvoice("PARTIALLY_PAID"), "PARTIALLY_PAID is an eligible issued status");
  assert(isEligibleIssuedInvoice("OVERDUE"), "OVERDUE is an eligible issued status");
  assert(!isEligibleIssuedInvoice("DRAFT"), "DRAFT is excluded from eligible issued statuses");
  assert(!isEligibleIssuedInvoice("CANCELLED"), "CANCELLED is excluded from eligible issued statuses");
  assert(!isEligibleIssuedInvoice(""), "Empty string is not an eligible issued status");
  assert(!isEligibleIssuedInvoice(null), "null is not an eligible issued status");

  // isOperationallyOpenInvoice
  assert(
    !isOperationallyOpenInvoice({ status: "PAID", balanceDue: 0 }),
    "PAID with zero balance is NOT operationally open"
  );
  assert(
    !isOperationallyOpenInvoice({ status: "PAID", balanceDue: 500 }),
    "PAID with positive balance is NOT operationally open (PAID is terminal)"
  );
  assert(
    isOperationallyOpenInvoice({ status: "SENT", balanceDue: 15000 }),
    "SENT with positive balance IS operationally open"
  );
  assert(
    !isOperationallyOpenInvoice({ status: "SENT", balanceDue: 0 }),
    "SENT with zero balance is NOT operationally open"
  );
  assert(
    isOperationallyOpenInvoice({ status: "PARTIALLY_PAID", balanceDue: 8500 }),
    "PARTIALLY_PAID with positive balance IS operationally open"
  );
  assert(
    !isOperationallyOpenInvoice({ status: "PARTIALLY_PAID", balanceDue: 0 }),
    "PARTIALLY_PAID with zero balance is NOT operationally open"
  );
  assert(
    isOperationallyOpenInvoice({ status: "OVERDUE", balanceDue: 22000 }),
    "OVERDUE with positive balance IS operationally open"
  );
  assert(
    !isOperationallyOpenInvoice({ status: "OVERDUE", balanceDue: 0 }),
    "OVERDUE with zero balance is NOT operationally open"
  );
  assert(
    !isOperationallyOpenInvoice({ status: "DRAFT", balanceDue: 50000 }),
    "DRAFT with positive balance is NOT operationally open"
  );
  assert(
    !isOperationallyOpenInvoice({ status: "CANCELLED", balanceDue: 0 }),
    "CANCELLED is NOT operationally open"
  );

  // ===========================================================================
  // 3. Exact Ageing Boundary Tests
  // ===========================================================================
  console.log("\n--- 3. Exact Ageing Boundary Tests ---");

  const testReportingDate = "2026-11-03";

  // Due tomorrow (2026-11-04) -> daysOverdue = -1 -> NOT_OVERDUE
  const daysTomorrow = calculateDaysOverdue("2026-11-04", testReportingDate);
  assert(daysTomorrow === -1, "Due tomorrow yields daysOverdue = -1");
  assert(classifyAgeingBucket(daysTomorrow) === "NOT_OVERDUE", "Due tomorrow classifies as NOT_OVERDUE");

  // Due today (2026-11-03) -> daysOverdue = 0 -> NOT_OVERDUE
  const daysToday = calculateDaysOverdue("2026-11-03", testReportingDate);
  assert(daysToday === 0, "Due today yields daysOverdue = 0");
  assert(classifyAgeingBucket(daysToday) === "NOT_OVERDUE", "Due today classifies as NOT_OVERDUE");

  // 1 day overdue (2026-11-02) -> 0_30
  const days1 = calculateDaysOverdue("2026-11-02", testReportingDate);
  assert(days1 === 1, "1 day overdue calculates correctly");
  assert(classifyAgeingBucket(days1) === "0_30", "1 day overdue classifies as 0_30");

  // 30 days overdue (2026-10-04) -> 0_30
  const days30 = calculateDaysOverdue("2026-10-04", testReportingDate);
  assert(days30 === 30, "30 days overdue calculates correctly");
  assert(classifyAgeingBucket(days30) === "0_30", "30 days overdue classifies as 0_30");

  // 31 days overdue (2026-10-03) -> 31_60
  const days31 = calculateDaysOverdue("2026-10-03", testReportingDate);
  assert(days31 === 31, "31 days overdue calculates correctly");
  assert(classifyAgeingBucket(days31) === "31_60", "31 days overdue classifies as 31_60");

  // 60 days overdue (2026-09-04) -> 31_60
  const days60 = calculateDaysOverdue("2026-09-04", testReportingDate);
  assert(days60 === 60, "60 days overdue calculates correctly");
  assert(classifyAgeingBucket(days60) === "31_60", "60 days overdue classifies as 31_60");

  // 61 days overdue (2026-09-03) -> 61_90
  const days61 = calculateDaysOverdue("2026-09-03", testReportingDate);
  assert(days61 === 61, "61 days overdue calculates correctly");
  assert(classifyAgeingBucket(days61) === "61_90", "61 days overdue classifies as 61_90");

  // 90 days overdue (2026-08-05) -> 61_90
  const days90 = calculateDaysOverdue("2026-08-05", testReportingDate);
  assert(days90 === 90, "90 days overdue calculates correctly");
  assert(classifyAgeingBucket(days90) === "61_90", "90 days overdue classifies as 61_90");

  // 91 days overdue (2026-08-04) -> 90_PLUS
  const days91 = calculateDaysOverdue("2026-08-04", testReportingDate);
  assert(days91 === 91, "91 days overdue calculates correctly");
  assert(classifyAgeingBucket(days91) === "90_PLUS", "91 days overdue classifies as 90_PLUS");

  // ===========================================================================
  // 4. Reference Invoices Verification
  // ===========================================================================
  console.log("\n--- 4. Reference Invoices Verification (Cutoff: 2026-11-03) ---");

  // INV/2026-27/0140 (Due: 2026-10-05) -> 29 days -> 0_30
  const ref1Days = calculateDaysOverdue("2026-10-05", testReportingDate);
  assert(ref1Days === 29, "INV/2026-27/0140 has exactly 29 days overdue");
  assert(classifyAgeingBucket(ref1Days) === "0_30", "INV/2026-27/0140 classifies into 0_30 bucket");

  // INV/2026-27/0127 (Due: 2026-09-18) -> 46 days -> 31_60
  const ref2Days = calculateDaysOverdue("2026-09-18", testReportingDate);
  assert(ref2Days === 46, "INV/2026-27/0127 has exactly 46 days overdue");
  assert(classifyAgeingBucket(ref2Days) === "31_60", "INV/2026-27/0127 classifies into 31_60 bucket");

  // INV/2024-25/0007 (Due: 2025-03-31) -> 582 days -> 90_PLUS
  const ref3Days = calculateDaysOverdue("2025-03-31", testReportingDate);
  assert(ref3Days === 582, "INV/2024-25/0007 has exactly 582 days overdue");
  assert(classifyAgeingBucket(ref3Days) === "90_PLUS", "INV/2024-25/0007 classifies into 90_PLUS bucket");

  // ===========================================================================
  // 5. Individual Invoice Tie-Out Reconciliation Tests
  // ===========================================================================
  console.log("\n--- 5. Individual Invoice Tie-Out Reconciliation Tests ---");

  const sampleInvoices: InvoiceLike[] = [
    {
      invoiceNumber: "TEST-01",
      totalAmount: 1000,
      amountPaid: 1000,
      balanceDue: 0,
      status: "PAID",
      dueDate: "2026-10-01",
    },
    {
      invoiceNumber: "TEST-02",
      totalAmount: 5000,
      amountPaid: 2000,
      balanceDue: 3000,
      status: "PARTIALLY_PAID",
      dueDate: "2026-10-15",
    },
    {
      // 1-paise difference within tolerance (5000 - 2000 - 2999.99 = 0.01)
      invoiceNumber: "TEST-03",
      totalAmount: 5000,
      amountPaid: 2000,
      balanceDue: 2999.99,
      status: "PARTIALLY_PAID",
      dueDate: "2026-10-15",
    },
    {
      // Discrepancy exceeding 1-paise tolerance (diff = 100)
      invoiceNumber: "TEST-04",
      totalAmount: 5000,
      amountPaid: 2000,
      balanceDue: 2900,
      status: "PARTIALLY_PAID",
      dueDate: "2026-10-15",
    },
    {
      // CANCELLED invoice: totalAmount > 0, amountPaid = 0, balanceDue = 0
      invoiceNumber: "TEST-05",
      totalAmount: 12000,
      amountPaid: 0,
      balanceDue: 0,
      status: "CANCELLED",
      dueDate: "2026-09-01",
    },
  ];

  const reconResult = reconcileIndividualInvoices(sampleInvoices);
  assert(reconResult.totalInvoicesChecked === 5, "Total invoices checked = 5");
  assert(reconResult.reconciledCount === 3, "3 invoices reconciled (TEST-01, TEST-02, TEST-03 within tolerance)");
  assert(reconResult.errorCount === 1, "1 invoice failed reconciliation (TEST-04)");
  assert(reconResult.cancelledCount === 1, "1 invoice recognized as CANCELLED (TEST-05)");
  assert(reconResult.discrepancies.length === 1, "Discrepancy list contains exactly 1 item");
  assert(reconResult.discrepancies[0].invoiceNumber === "TEST-04", "Discrepancy correctly identifies TEST-04");

  // Empty array handling
  const emptyRecon = reconcileIndividualInvoices([]);
  assert(emptyRecon.totalInvoicesChecked === 0, "Empty invoice list returns 0 checked");
  assert(emptyRecon.errorCount === 0, "Empty invoice list returns 0 errors");

  // ===========================================================================
  // 6. Financial Summary & Invariants Tests
  // ===========================================================================
  console.log("\n--- 6. Financial Summary & Invariants Tests ---");

  const synthInvoices: InvoiceLike[] = [
    {
      invoiceNumber: "INV-1",
      totalAmount: 10000,
      amountPaid: 10000,
      balanceDue: 0,
      status: "PAID",
      dueDate: "2026-10-01",
    },
    {
      invoiceNumber: "INV-2",
      totalAmount: 20000,
      amountPaid: 5000,
      balanceDue: 15000,
      status: "PARTIALLY_PAID",
      dueDate: "2026-11-01", // 2 days overdue relative to 2026-11-03
    },
    {
      invoiceNumber: "INV-3",
      totalAmount: 30000,
      amountPaid: 0,
      balanceDue: 30000,
      status: "SENT",
      dueDate: "2026-11-10", // Not overdue relative to 2026-11-03
    },
    {
      invoiceNumber: "INV-4",
      totalAmount: 5000,
      amountPaid: 0,
      balanceDue: 5000,
      status: "DRAFT", // Excluded from billed
      dueDate: "2026-11-05",
    },
    {
      invoiceNumber: "INV-5",
      totalAmount: 8000,
      amountPaid: 0,
      balanceDue: 0,
      status: "CANCELLED", // Excluded from billed
      dueDate: "2026-09-01",
    },
  ];

  const synthExpenses: ExpenseLike[] = [
    { totalAmount: 4000, status: "PAID" },
    { totalAmount: 6000, status: "UNPAID" },
  ];

  const synthSummary = calculateFinanceSummary(synthInvoices, synthExpenses, "2026-11-03");

  assert(synthSummary.billedAmount === 60000, "Billed = 10000 + 20000 + 30000 = ₹60,000");
  assert(synthSummary.collectedAmount === 15000, "Collected = 10000 + 5000 = ₹15,000");
  assert(synthSummary.outstandingAmount === 45000, "Outstanding = 15000 + 30000 = ₹45,000");
  assert(synthSummary.overdueAmount === 15000, "Overdue = ₹15,000 (INV-2 due 2026-11-01)");
  assert(synthSummary.notOverdueOutstandingAmount === 30000, "Not overdue outstanding = ₹30,000 (INV-3 due 2026-11-10)");
  assert(synthSummary.totalExpenses === 10000, "Total expenses = ₹10,000");
  assert(synthSummary.paidExpenses === 4000, "Paid expenses = ₹4,000");
  assert(synthSummary.unpaidExpenses === 6000, "Unpaid expenses = ₹6,000");
  assert(synthSummary.openInvoiceCount === 2, "Open invoices = 2 (INV-2, INV-3)");
  assert(synthSummary.overdueInvoiceCount === 1, "Overdue invoices = 1 (INV-2)");

  assert(synthSummary.reconciliation.invariants.allValid, "All financial invariants hold for synthetic data");

  // Empty arrays handling
  const emptySummary = calculateFinanceSummary([], [], "2026-11-03");
  assert(emptySummary.billedAmount === 0, "Empty inputs yield billedAmount = 0");
  assert(emptySummary.totalExpenses === 0, "Empty inputs yield totalExpenses = 0");
  assert(emptySummary.reconciliation.invariants.allValid, "Empty inputs invariants pass");

  // ===========================================================================
  // 7. Live Database Integration Verification (Cutoff: 2026-11-03)
  // ===========================================================================
  console.log("\n--- 7. Live Database Integration Verification (Cutoff: 2026-11-03) ---");

  const dbInvoices = await prisma.invoice.findMany();
  const dbExpenses = await prisma.expense.findMany();

  assert(dbInvoices.length === 743, "Live DB contains exactly 743 invoices");
  assert(dbExpenses.length === 501, "Live DB contains exactly 501 expenses");

  const dbSummary = calculateFinanceSummary(dbInvoices, dbExpenses, "2026-11-03");

  // Financial Figures verification
  assert(
    dbSummary.billedAmount === 1558743836,
    `Billed Amount matches: ₹${dbSummary.billedAmount.toLocaleString("en-IN")} === ₹1,558,743,836`
  );
  assert(
    dbSummary.collectedAmount === 1419349558,
    `Collected Amount matches: ₹${dbSummary.collectedAmount.toLocaleString("en-IN")} === ₹1,419,349,558`
  );
  assert(
    dbSummary.outstandingAmount === 139394278,
    `Outstanding Amount matches: ₹${dbSummary.outstandingAmount.toLocaleString("en-IN")} === ₹139,394,278`
  );
  assert(
    dbSummary.overdueAmount === 114981820,
    `Overdue Amount matches: ₹${dbSummary.overdueAmount.toLocaleString("en-IN")} === ₹114,981,820`
  );
  assert(
    dbSummary.notOverdueOutstandingAmount === 24412458,
    `Not Overdue Balance matches: ₹${dbSummary.notOverdueOutstandingAmount.toLocaleString("en-IN")} === ₹24,412,458`
  );

  // Expense Figures verification
  assert(
    dbSummary.totalExpenses === 197476837.9,
    `Total Expenses matches: ₹${dbSummary.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })} === ₹197,476,837.90`
  );
  assert(
    dbSummary.paidExpenses === 185830816.7,
    `Paid Expenses matches: ₹${dbSummary.paidExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })} === ₹185,830,816.70`
  );
  assert(
    dbSummary.unpaidExpenses === 11646021.2,
    `Unpaid Expenses matches: ₹${dbSummary.unpaidExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })} === ₹11,646,021.20`
  );

  // Counts verification
  assert(dbSummary.openInvoiceCount === 62, "Open Invoice Count = 62");
  assert(dbSummary.overdueInvoiceCount === 53, "Overdue Invoice Count = 53");

  // Invariants verification
  assert(
    dbSummary.reconciliation.invariants.billedEquationValid,
    "Billed = Collected + Outstanding (₹1,558,743,836 == ₹1,419,349,558 + ₹139,394,278)"
  );
  assert(
    dbSummary.reconciliation.invariants.overdueEquationValid,
    "Overdue + Not Overdue = Outstanding (₹114,981,820 + ₹24,412,458 == ₹139,394,278)"
  );
  assert(
    dbSummary.reconciliation.invariants.expenseEquationValid,
    "Paid Expenses + Unpaid Expenses = Total Expenses (₹185,830,816.70 + ₹11,646,021.20 == ₹197,476,837.90)"
  );
  assert(
    dbSummary.reconciliation.invariants.ageingCountValid,
    "Ageing Bucket count sum == 62"
  );
  assert(
    dbSummary.reconciliation.invariants.ageingAmountValid,
    "Ageing Bucket amount sum == ₹139,394,278"
  );
  assert(
    dbSummary.reconciliation.invariants.allValid,
    "All master accounting invariants valid"
  );

  // Ageing Breakdown verification
  const b = dbSummary.ageingBreakdown;
  assert(
    b.NOT_OVERDUE.count === 9 && b.NOT_OVERDUE.amount === 24412458,
    "Bucket NOT_OVERDUE: 9 invoices, ₹24,412,458"
  );
  assert(
    b["0_30"].count === 37 && b["0_30"].amount === 79270642,
    "Bucket 0_30: 37 invoices, ₹79,270,642"
  );
  assert(
    b["31_60"].count === 13 && b["31_60"].amount === 30733938,
    "Bucket 31_60: 13 invoices, ₹30,733,938"
  );
  assert(
    b["61_90"].count === 0 && b["61_90"].amount === 0,
    "Bucket 61_90: 0 invoices, ₹0"
  );
  assert(
    b["90_PLUS"].count === 3 && b["90_PLUS"].amount === 4977240,
    "Bucket 90_PLUS: 3 invoices, ₹4,977,240"
  );

  // Individual Invoices tie-out on live DB
  assert(
    dbSummary.reconciliation.individualInvoices.reconciledCount === 739,
    "Live DB: exactly 739 issued/active invoices tie out with 0 discrepancy"
  );
  assert(
    dbSummary.reconciliation.individualInvoices.cancelledCount === 4,
    "Live DB: exactly 4 invoices identified as CANCELLED"
  );
  assert(
    dbSummary.reconciliation.individualInvoices.errorCount === 0,
    "Live DB: exactly 0 individual invoice reconciliation errors"
  );

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
