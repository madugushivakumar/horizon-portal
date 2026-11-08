/**
 * Horizon Portal — Enterprise Financial Reconciliation Service
 * src/lib/payroll/reconciliation-service.ts
 *
 * Implements exact financial arithmetic (integer paise calculations) for payroll tie-outs:
 * - Compares stored PayrollRun header figures against itemized Payslip aggregations
 * - Transparently tracks and reports discrepancies without modifying underlying records
 * - Categorizes runs into MATCHED, MISMATCH, or NO_ITEMS
 * - Computes Month-over-Month (MoM) trend variances across consecutive periods
 */

import { prisma } from "@/lib/prisma";

export type ReconciliationStatus = "MATCHED" | "MISMATCH" | "NO_ITEMS";

export interface ReconciliationResult {
  runId: string;
  payrollPeriod: string;
  status: string; // Operational lifecycle status (e.g. POSTED - PAYMENT PENDING, PAID)
  approvalStatus: string; // Approval status (e.g. Pending, Approved, Rejected)
  reconciliationStatus: ReconciliationStatus;
  
  // Stored Header Totals
  storedGross: number;
  storedNet: number;
  storedDeductions: number; // Implied: storedGross - storedNet
  storedEmployeeCount: number;

  // Calculated Item-Level Aggregates
  calculatedGross: number;
  calculatedNet: number;
  calculatedDeductions: number;
  actualPayslipCount: number;

  // Differences (Stored - Calculated) in standard currency & integer paise
  grossDifference: number;
  netDifference: number;
  deductionsDifference: number;
  employeeCountDifference: number;

  // Exact paise values for audit & precision verification
  paise: {
    storedGross: number;
    calculatedGross: number;
    grossDiff: number;
    storedNet: number;
    calculatedNet: number;
    netDiff: number;
    storedDeductions: number;
    calculatedDeductions: number;
    deductionsDiff: number;
  };

  // Internal Arithmetic Verification (Items Net == Items Gross - Items Deductions)
  internalArithmeticBalanced: boolean;
  internalDiscrepancy: number;

  // Descriptive Details & Discrepancy Items
  discrepancyDetails: string[];
}

export interface MonthOverMonthResult {
  isAvailable: boolean;
  message?: string;
  currentPeriod: string;
  previousPeriod?: string;
  previousRunId?: string;
  currentNet: number;
  previousNet?: number;
  difference?: number;
  percentageChange?: number;
  direction?: "increase" | "decrease" | "neutral";
  basis: "stored" | "calculated";
}

/**
 * Converts a floating-point rupee value to exact integer paise (1 INR = 100 paise)
 * to avoid IEEE-754 floating point inaccuracies.
 */
export function toPaise(amount: number | null | undefined): number {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 0;
  }
  return Math.round(amount * 100);
}

/**
 * Converts integer paise back to a 2-decimal floating point rupee value.
 */
export function fromPaise(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

/**
 * Calculates exact reconciliation tie-out for a single PayrollRun by ID.
 * Analyzes stored header figures against all associated payslip records in the database.
 */
export async function reconcilePayrollRun(runId: string): Promise<ReconciliationResult | null> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: runId },
    include: {
      payslips: {
        select: {
          id: true,
          grossPay: true,
          netPay: true,
          totalDeductions: true,
          deductions: true,
          basic: true,
          hra: true,
          specialAllowance: true,
        },
      },
    },
  });

  if (!run) {
    return null;
  }

  const periodStartStr = run.periodStart.toISOString().split("T")[0];
  const periodEndStr = run.periodEnd.toISOString().split("T")[0];
  const payrollPeriod = `${periodStartStr} to ${periodEndStr}`;

  const storedGrossPaise = toPaise(run.totalGross);
  const storedNetPaise = toPaise(run.totalNet);
  const impliedStoredDeductionsPaise = storedGrossPaise - storedNetPaise;
  const storedEmployees = run.employeesPaid ?? 0;

  const actualPayslips = run.payslips;
  const actualCount = actualPayslips.length;

  // Case 1: No item-level payslips available (e.g. historical archived runs)
  if (actualCount === 0) {
    return {
      runId: run.id,
      payrollPeriod,
      status: run.status,
      approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
      reconciliationStatus: "NO_ITEMS",
      storedGross: fromPaise(storedGrossPaise),
      storedNet: fromPaise(storedNetPaise),
      storedDeductions: fromPaise(impliedStoredDeductionsPaise),
      storedEmployeeCount: storedEmployees,
      calculatedGross: 0,
      calculatedNet: 0,
      calculatedDeductions: 0,
      actualPayslipCount: 0,
      grossDifference: fromPaise(storedGrossPaise),
      netDifference: fromPaise(storedNetPaise),
      deductionsDifference: fromPaise(impliedStoredDeductionsPaise),
      employeeCountDifference: storedEmployees,
      paise: {
        storedGross: storedGrossPaise,
        calculatedGross: 0,
        grossDiff: storedGrossPaise,
        storedNet: storedNetPaise,
        calculatedNet: 0,
        netDiff: storedNetPaise,
        storedDeductions: impliedStoredDeductionsPaise,
        calculatedDeductions: 0,
        deductionsDiff: impliedStoredDeductionsPaise,
      },
      internalArithmeticBalanced: true,
      internalDiscrepancy: 0,
      discrepancyDetails: [
        "Item-level payslip records are archived or unavailable for this historical period.",
      ],
    };
  }

  // Case 2: Aggregate payslip items using integer paise arithmetic
  let sumGrossPaise = 0;
  let sumNetPaise = 0;
  let sumDeductionsPaise = 0;

  for (const slip of actualPayslips) {
    sumGrossPaise += toPaise(slip.grossPay);
    sumNetPaise += toPaise(slip.netPay);
    const slipDeductions = slip.totalDeductions ?? slip.deductions ?? 0;
    sumDeductionsPaise += toPaise(slipDeductions);
  }

  // Internal arithmetic check: Sum(Gross) - Sum(Deductions) === Sum(Net)
  const internalNetPaise = sumGrossPaise - sumDeductionsPaise;
  const internalDiscrepancyPaise = sumNetPaise - internalNetPaise;
  const internalArithmeticBalanced = Math.abs(internalDiscrepancyPaise) === 0;

  // Compare Stored Header vs Calculated Items
  const grossDiffPaise = storedGrossPaise - sumGrossPaise;
  const netDiffPaise = storedNetPaise - sumNetPaise;
  const deductionsDiffPaise = impliedStoredDeductionsPaise - sumDeductionsPaise;
  const empDiff = storedEmployees - actualCount;

  // Exact currency differences
  const grossDifference = fromPaise(grossDiffPaise);
  const netDifference = fromPaise(netDiffPaise);
  const deductionsDifference = fromPaise(deductionsDiffPaise);

  const discrepancyDetails: string[] = [];

  if (empDiff !== 0) {
    discrepancyDetails.push(
      `Employee count variance: Stored header lists ${storedEmployees} employees, but ${actualCount} payslips exist (${empDiff > 0 ? `+${empDiff} missing` : `${empDiff} extra`} payslips).`
    );
  }
  if (grossDiffPaise !== 0) {
    discrepancyDetails.push(
      `Gross earnings variance: Stored total ₹${fromPaise(storedGrossPaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} differs from item sum ₹${fromPaise(sumGrossPaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} by ₹${Math.abs(grossDifference).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`
    );
  }
  if (netDiffPaise !== 0) {
    discrepancyDetails.push(
      `Net payable variance: Stored total ₹${fromPaise(storedNetPaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} differs from item sum ₹${fromPaise(sumNetPaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} by ₹${Math.abs(netDifference).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`
    );
  }
  if (deductionsDiffPaise !== 0) {
    discrepancyDetails.push(
      `Deductions variance: Implied stored deductions ₹${fromPaise(impliedStoredDeductionsPaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} differs from item sum ₹${fromPaise(sumDeductionsPaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} by ₹${Math.abs(deductionsDifference).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`
    );
  }

  // Exact tie-out check: zero paise difference across Gross, Net, and Headcount
  const isMatched =
    grossDiffPaise === 0 &&
    netDiffPaise === 0 &&
    deductionsDiffPaise === 0 &&
    empDiff === 0 &&
    internalArithmeticBalanced;

  const reconciliationStatus: ReconciliationStatus = isMatched ? "MATCHED" : "MISMATCH";

  return {
    runId: run.id,
    payrollPeriod,
    status: run.status,
    approvalStatus: run.status.toUpperCase().includes("PAID") ? "Approved" : (run.approvalStatus || "Pending"),
    reconciliationStatus,
    storedGross: fromPaise(storedGrossPaise),
    storedNet: fromPaise(storedNetPaise),
    storedDeductions: fromPaise(impliedStoredDeductionsPaise),
    storedEmployeeCount: storedEmployees,
    calculatedGross: fromPaise(sumGrossPaise),
    calculatedNet: fromPaise(sumNetPaise),
    calculatedDeductions: fromPaise(sumDeductionsPaise),
    actualPayslipCount: actualCount,
    grossDifference,
    netDifference,
    deductionsDifference,
    employeeCountDifference: empDiff,
    paise: {
      storedGross: storedGrossPaise,
      calculatedGross: sumGrossPaise,
      grossDiff: grossDiffPaise,
      storedNet: storedNetPaise,
      calculatedNet: sumNetPaise,
      netDiff: netDiffPaise,
      storedDeductions: impliedStoredDeductionsPaise,
      calculatedDeductions: sumDeductionsPaise,
      deductionsDiff: deductionsDiffPaise,
    },
    internalArithmeticBalanced,
    internalDiscrepancy: fromPaise(internalDiscrepancyPaise),
    discrepancyDetails,
  };
}

/**
 * Reconciles all payroll runs currently present in the database, ordered newest first.
 */
export async function reconcileAllRuns(): Promise<ReconciliationResult[]> {
  const runs = await prisma.payrollRun.findMany({
    orderBy: { periodStart: "desc" },
    select: { id: true },
  });

  const results: ReconciliationResult[] = [];
  for (const r of runs) {
    const res = await reconcilePayrollRun(r.id);
    if (res) {
      results.push(res);
    }
  }

  return results;
}

/**
 * Calculates Month-over-Month (MoM) variance between a current run and its immediately preceding monthly period.
 * Accurately handles edge cases such as missing prior periods, zero denominators, and non-consecutive months.
 */
export async function calculateMonthOverMonth(
  currentRunId: string,
  basis: "stored" | "calculated" = "stored"
): Promise<MonthOverMonthResult> {
  const currentRun = await prisma.payrollRun.findUnique({
    where: { id: currentRunId },
    include: {
      payslips: {
        select: { netPay: true },
      },
    },
  });

  if (!currentRun) {
    return {
      isAvailable: false,
      message: "Current payroll run not found.",
      currentPeriod: "Unknown",
      currentNet: 0,
      basis,
    };
  }

  const currentPeriodStart = new Date(currentRun.periodStart);
  const currentPeriodStr = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(currentPeriodStart);

  // Compute target previous consecutive calendar month:
  // e.g. If current is 2026-09-01, target is 2026-08-01
  const prevMonthDate = new Date(currentPeriodStart);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const targetYear = prevMonthDate.getFullYear();
  const targetMonth = prevMonthDate.getMonth();

  // Find all runs that match the target previous month
  const candidateRuns = await prisma.payrollRun.findMany({
    where: {
      periodStart: {
        gte: new Date(Date.UTC(targetYear, targetMonth, 1)),
        lt: new Date(Date.UTC(targetYear, targetMonth + 1, 1)),
      },
    },
    include: {
      payslips: {
        select: { netPay: true },
      },
    },
  });

  if (candidateRuns.length === 0) {
    return {
      isAvailable: false,
      message: "Previous-period comparison unavailable (no consecutive prior period found).",
      currentPeriod: currentPeriodStr,
      currentNet: currentRun.totalNet ?? 0,
      basis,
    };
  }

  const previousRun = candidateRuns[0];
  const prevPeriodStart = new Date(previousRun.periodStart);
  const prevPeriodStr = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(prevPeriodStart);

  let currentNetValue = 0;
  let previousNetValue = 0;

  if (basis === "calculated" && currentRun.payslips.length > 0 && previousRun.payslips.length > 0) {
    currentNetValue = currentRun.payslips.reduce((sum, p) => sum + p.netPay, 0);
    previousNetValue = previousRun.payslips.reduce((sum, p) => sum + p.netPay, 0);
  } else {
    currentNetValue = currentRun.totalNet ?? 0;
    previousNetValue = previousRun.totalNet ?? 0;
  }

  if (previousNetValue <= 0) {
    return {
      isAvailable: false,
      message: "Previous-period comparison unavailable (previous net total is zero or invalid).",
      currentPeriod: currentPeriodStr,
      previousPeriod: prevPeriodStr,
      previousRunId: previousRun.id,
      currentNet: currentNetValue,
      previousNet: previousNetValue,
      basis,
    };
  }

  // Exact difference calculation
  const currentNetPaise = toPaise(currentNetValue);
  const prevNetPaise = toPaise(previousNetValue);
  const diffPaise = currentNetPaise - prevNetPaise;
  const difference = fromPaise(diffPaise);

  const percentageChange = Number(((diffPaise / prevNetPaise) * 100).toFixed(2));
  const direction: "increase" | "decrease" | "neutral" =
    diffPaise > 0 ? "increase" : diffPaise < 0 ? "decrease" : "neutral";

  return {
    isAvailable: true,
    currentPeriod: currentPeriodStr,
    previousPeriod: prevPeriodStr,
    previousRunId: previousRun.id,
    currentNet: fromPaise(currentNetPaise),
    previousNet: fromPaise(prevNetPaise),
    difference,
    percentageChange,
    direction,
    basis,
  };
}
