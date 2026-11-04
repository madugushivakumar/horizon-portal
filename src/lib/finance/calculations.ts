/**
 * Horizon Portal — Core Financial Calculation Layer
 * src/lib/finance/calculations.ts
 *
 * Implements pure, deterministic financial arithmetic and validation:
 * - Integer paise arithmetic to eliminate IEEE-754 floating point drift
 * - Strict operational invoice eligibility predicates
 * - Dynamic ageing distribution across open receivables
 * - Financial reconciliation invariants verification
 * - Individual invoice tie-out auditing (with 1-paise tolerance)
 */

import {
  AgeingBucket,
  AgeingBucketSummary,
  ExpenseLike,
  FinanceInvariantsValidation,
  FinanceSummary,
  IndividualInvoiceReconciliationResult,
  InvoiceLike,
  InvoiceTieOutDiscrepancy,
} from "./types";
import {
  calculateDaysOverdue,
  classifyAgeingBucket,
  createEmptyAgeingBreakdown,
  parseUtcDateOnly,
} from "./ageing";

// =============================================================================
// 1. Currency & Paise Utilities
// =============================================================================

/**
 * Converts a rupee amount (number) into integer paise.
 * Safely validates inputs against NaN, Infinity, and non-number types.
 */
export function toPaise(amount: number): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError(
      `Invalid monetary amount: expected finite number, got ${typeof amount === "number" ? String(amount) : typeof amount}`
    );
  }
  return Math.round(amount * 100);
}

/**
 * Converts integer paise back into floating rupee amount.
 */
export function fromPaise(paise: number): number {
  if (typeof paise !== "number" || !Number.isFinite(paise)) {
    throw new TypeError(
      `Invalid paise amount: expected finite number, got ${typeof paise === "number" ? String(paise) : typeof paise}`
    );
  }
  return paise / 100;
}

// =============================================================================
// 2. Invoice Eligibility Predicates
// =============================================================================

/**
 * Eligible statuses for issued revenue accounting (Billed & Collected).
 * Excludes DRAFT and CANCELLED records.
 */
export const ELIGIBLE_ISSUED_STATUSES = [
  "PAID",
  "SENT",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

/**
 * Eligible statuses for open receivables accounting.
 */
export const OPERATIONALLY_OPEN_STATUSES = [
  "SENT",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

/**
 * Determines whether an invoice status represents an issued invoice
 * that counts toward Billed and Collected financial metrics.
 */
export function isEligibleIssuedInvoice(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  return s === "PAID" || s === "SENT" || s === "PARTIALLY_PAID" || s === "OVERDUE";
}

/**
 * Determines whether an invoice is operationally open:
 * 1. Status must be SENT, PARTIALLY_PAID, or OVERDUE (PAID, DRAFT, CANCELLED are never open).
 * 2. balanceDue must be strictly greater than 0.
 */
export function isOperationallyOpenInvoice(invoice: {
  status: string | null | undefined;
  balanceDue: number;
}): boolean {
  if (!invoice || typeof invoice.balanceDue !== "number" || !Number.isFinite(invoice.balanceDue)) {
    return false;
  }
  if (!invoice.status) return false;
  const s = invoice.status.toUpperCase().trim();
  const isOpenStatus = s === "SENT" || s === "PARTIALLY_PAID" || s === "OVERDUE";
  return isOpenStatus && invoice.balanceDue > 0;
}

// =============================================================================
// 3. Individual Invoice Tie-Out Auditing
// =============================================================================

/**
 * Reconciles line-by-line monetary tie-out:
 *   totalAmount - amountPaid - balanceDue == 0 (with 1-paise tolerance).
 *
 * NOTE ON CANCELLED RECORDS:
 * Cancelled invoices have their balances intentionally zeroed out in accounting systems.
 * They are categorized under `cancelledCount` and not flagged as arithmetic errors.
 */
export function reconcileIndividualInvoices(
  invoices: InvoiceLike[]
): IndividualInvoiceReconciliationResult {
  let reconciledCount = 0;
  let errorCount = 0;
  let cancelledCount = 0;
  const discrepancies: InvoiceTieOutDiscrepancy[] = [];

  for (const inv of invoices) {
    const statusUpper = (inv.status || "").toUpperCase().trim();

    if (statusUpper === "CANCELLED") {
      cancelledCount++;
      continue;
    }

    const totalPaise = toPaise(inv.totalAmount || 0);
    const paidPaise = toPaise(inv.amountPaid || 0);
    const balPaise = toPaise(inv.balanceDue || 0);

    const diffPaise = totalPaise - paidPaise - balPaise;
    if (Math.abs(diffPaise) <= 1) {
      reconciledCount++;
    } else {
      errorCount++;
      discrepancies.push({
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        balanceDue: inv.balanceDue,
        difference: fromPaise(diffPaise),
      });
    }
  }

  return {
    totalInvoicesChecked: invoices.length,
    reconciledCount,
    errorCount,
    cancelledCount,
    discrepancies,
  };
}

// =============================================================================
// 4. Financial Invariants Validation
// =============================================================================

/**
 * Verifies that calculated financial metrics conform to fundamental accounting equations.
 */
export function validateFinanceInvariants(summary: FinanceSummary): FinanceInvariantsValidation {
  const billedPaise = toPaise(summary.billedAmount);
  const collectedPaise = toPaise(summary.collectedAmount);
  const outstandingPaise = toPaise(summary.outstandingAmount);
  const overduePaise = toPaise(summary.overdueAmount);
  const notOverduePaise = toPaise(summary.notOverdueOutstandingAmount);
  const totalExpPaise = toPaise(summary.totalExpenses);
  const paidExpPaise = toPaise(summary.paidExpenses);
  const unpaidExpPaise = toPaise(summary.unpaidExpenses);

  const billedEquationValid = collectedPaise + outstandingPaise === billedPaise;
  const overdueEquationValid = overduePaise + notOverduePaise === outstandingPaise;

  let sumBucketCount = 0;
  let sumBucketPaise = 0;
  for (const bucket of Object.values(summary.ageingBreakdown)) {
    sumBucketCount += bucket.count;
    sumBucketPaise += bucket.amountPaise;
  }

  const ageingCountValid = sumBucketCount === summary.openInvoiceCount;
  const ageingAmountValid = sumBucketPaise === outstandingPaise;
  const expenseEquationValid = paidExpPaise + unpaidExpPaise === totalExpPaise;

  const discrepancies: string[] = [];
  if (!billedEquationValid) {
    discrepancies.push(
      `Billed Equation Failed: Billed (₹${summary.billedAmount}) != Collected (₹${summary.collectedAmount}) + Outstanding (₹${summary.outstandingAmount})`
    );
  }
  if (!overdueEquationValid) {
    discrepancies.push(
      `Overdue Equation Failed: Outstanding (₹${summary.outstandingAmount}) != Overdue (₹${summary.overdueAmount}) + Not Overdue (₹${summary.notOverdueOutstandingAmount})`
    );
  }
  if (!ageingCountValid) {
    discrepancies.push(
      `Ageing Count Failed: Sum of Ageing Buckets (${sumBucketCount}) != Open Invoice Count (${summary.openInvoiceCount})`
    );
  }
  if (!ageingAmountValid) {
    discrepancies.push(
      `Ageing Amount Failed: Sum of Ageing Buckets (₹${fromPaise(sumBucketPaise)}) != Outstanding (₹${summary.outstandingAmount})`
    );
  }
  if (!expenseEquationValid) {
    discrepancies.push(
      `Expense Equation Failed: Total Expenses (₹${summary.totalExpenses}) != Paid (₹${summary.paidExpenses}) + Unpaid (₹${summary.unpaidExpenses})`
    );
  }

  return {
    billedEquationValid,
    overdueEquationValid,
    ageingCountValid,
    ageingAmountValid,
    expenseEquationValid,
    allValid:
      billedEquationValid &&
      overdueEquationValid &&
      ageingCountValid &&
      ageingAmountValid &&
      expenseEquationValid,
    discrepancies,
  };
}

// =============================================================================
// 5. Master Finance Summary Aggregation
// =============================================================================

/**
 * Pure aggregation function calculating complete financial metrics from invoice
 * and expense collections.
 *
 * @param invoices Raw or filtered invoice records
 * @param expenses Raw or filtered expense records
 * @param reportingDateInput Optional deterministic cutoff (defaults to today's UTC midnight)
 */
export function calculateFinanceSummary(
  invoices: InvoiceLike[],
  expenses: ExpenseLike[],
  reportingDateInput?: string | Date
): FinanceSummary {
  // Normalize reporting date to UTC midnight representation
  const reportingDateUtc = reportingDateInput
    ? parseUtcDateOnly(reportingDateInput)
    : parseUtcDateOnly(new Date());

  const reportingDateStr = new Date(reportingDateUtc).toISOString().split("T")[0];

  // Invoice aggregation accumulators (all in integer paise)
  let billedPaise = 0;
  let collectedPaise = 0;
  let outstandingPaise = 0;
  let overduePaise = 0;
  let notOverduePaise = 0;
  let openInvoiceCount = 0;
  let overdueInvoiceCount = 0;

  const ageingBreakdown = createEmptyAgeingBreakdown();

  for (const inv of invoices) {
    const isEligible = isEligibleIssuedInvoice(inv.status);
    if (!isEligible) {
      continue;
    }

    const totalPaise = toPaise(inv.totalAmount || 0);
    const paidPaise = toPaise(inv.amountPaid || 0);

    billedPaise += totalPaise;
    collectedPaise += paidPaise;

    // Check operational open condition
    if (isOperationallyOpenInvoice(inv)) {
      openInvoiceCount++;
      const balPaise = toPaise(inv.balanceDue || 0);
      outstandingPaise += balPaise;

      const daysOverdue = calculateDaysOverdue(inv.dueDate, reportingDateStr);
      const bucket = classifyAgeingBucket(daysOverdue);

      ageingBreakdown[bucket].count++;
      ageingBreakdown[bucket].amountPaise += balPaise;

      if (daysOverdue > 0) {
        overdueInvoiceCount++;
        overduePaise += balPaise;
      } else {
        notOverduePaise += balPaise;
      }
    }
  }

  // Convert ageing breakdown amounts back to rupees
  for (const key of Object.keys(ageingBreakdown) as AgeingBucket[]) {
    ageingBreakdown[key].amount = fromPaise(ageingBreakdown[key].amountPaise);
  }

  // Expense aggregation accumulators (all in integer paise)
  let totalExpensePaise = 0;
  let paidExpensePaise = 0;
  let unpaidExpensePaise = 0;

  for (const exp of expenses) {
    const expPaise = toPaise(exp.totalAmount || 0);
    totalExpensePaise += expPaise;

    const s = (exp.status || "").toUpperCase().trim();
    if (s === "PAID") {
      paidExpensePaise += expPaise;
    } else {
      unpaidExpensePaise += expPaise;
    }
  }

  const individualInvoices = reconcileIndividualInvoices(invoices);

  const summaryWithoutInvariants: Omit<FinanceSummary, "reconciliation"> = {
    billedAmount: fromPaise(billedPaise),
    collectedAmount: fromPaise(collectedPaise),
    outstandingAmount: fromPaise(outstandingPaise),
    overdueAmount: fromPaise(overduePaise),
    notOverdueOutstandingAmount: fromPaise(notOverduePaise),
    totalExpenses: fromPaise(totalExpensePaise),
    paidExpenses: fromPaise(paidExpensePaise),
    unpaidExpenses: fromPaise(unpaidExpensePaise),
    invoiceCount: invoices.length,
    openInvoiceCount,
    overdueInvoiceCount,
    expenseCount: expenses.length,
    reportingDate: reportingDateStr,
    ageingBreakdown,
  };

  const dummySummaryForValidation: FinanceSummary = {
    ...summaryWithoutInvariants,
    reconciliation: {
      invariants: {
        billedEquationValid: false,
        overdueEquationValid: false,
        ageingCountValid: false,
        ageingAmountValid: false,
        expenseEquationValid: false,
        allValid: false,
        discrepancies: [],
      },
      individualInvoices,
    },
  };

  const invariants = validateFinanceInvariants(dummySummaryForValidation);

  return {
    ...summaryWithoutInvariants,
    reconciliation: {
      invariants,
      individualInvoices,
    },
  };
}
