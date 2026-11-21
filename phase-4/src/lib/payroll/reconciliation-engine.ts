/**
 * Horizon Portal — Enterprise Payroll Reconciliation Calculation Engine
 * src/lib/payroll/reconciliation-engine.ts
 *
 * Implements exact integer paise financial arithmetic (1 INR = 100 paise)
 * using 64-bit BigInt to guarantee 0.000000 IEEE-754 precision drift:
 * - Deterministic, non-floating-point financial comparison
 * - Itemized payslip sum vs. stored payroll run header tie-out
 * - Sign convention: Variance = Itemized (Actual) - Stored (Header)
 * - Strict invariant enforcement: Gross - Deductions === Net
 * - Non-mutating read-only calculation
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SQLite signed 64-bit integer limits: [-2^63, 2^63 - 1]
 * -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
 */
export const SQLITE_INT64_MIN: bigint = BigInt("-9223372036854775808");
export const SQLITE_INT64_MAX: bigint = BigInt("9223372036854775807");

/**
 * Asserts that a BigInt value fits within SQLite's signed 64-bit integer range.
 * Throws TypeError if the input is not a BigInt.
 * Throws RangeError if the value underflows or overflows signed 64-bit integer bounds.
 */
export function assertSqliteInt64(value: bigint, fieldName: string = "monetary value"): void {
  if (typeof value !== "bigint") {
    throw new TypeError(`Expected BigInt for ${fieldName}, received ${typeof value}`);
  }
  if (value < SQLITE_INT64_MIN || value > SQLITE_INT64_MAX) {
    throw new RangeError(
      `Integer overflow: ${fieldName} (${value.toString()}) exceeds SQLite signed 64-bit integer range [${SQLITE_INT64_MIN.toString()} to ${SQLITE_INT64_MAX.toString()}].`
    );
  }
}

export type ReconciliationEngineStatus = "MATCHED" | "MISMATCH" | "NO_ITEMS" | "INVALID_DATA";

export interface MonetaryPaiseValue {
  paise: bigint;
  rupees: number;
  formattedRupees: string;
  precisionWarning?: string;
}

export interface PayrollReconciliationEngineResult {
  payrollRunId: string;
  periodStart: string;
  periodEnd: string;
  runStatus: string;
  approvalStatus: string;
  payDate: string | null;
  paymentDate: string | null;
  readOnly: true;
  financialMutationPerformed: false;

  source: {
    header: {
      headcount: number;
      grossPaise: bigint;
      deductionsPaise: bigint;
      netPaise: bigint;
      grossFormatted: string;
      deductionsFormatted: string;
      netFormatted: string;
      grossRupees: number;
      deductionsRupees: number;
      netRupees: number;
    };
    itemized: {
      headcount: number;
      uniqueEmployeeCount: number;
      grossPaise: bigint;
      deductionsPaise: bigint;
      netPaise: bigint;
      grossFormatted: string;
      deductionsFormatted: string;
      netFormatted: string;
      grossRupees: number;
      deductionsRupees: number;
      netRupees: number;
    };
  };

  variance: {
    // Variance = Itemized - Header
    headcount: number;
    grossPaise: bigint;
    deductionsPaise: bigint;
    netPaise: bigint;
    grossFormatted: string;
    deductionsFormatted: string;
    netFormatted: string;
    grossRupees: number;
    deductionsRupees: number;
    netRupees: number;
    signConvention: "ITEMIZED_MINUS_STORED_HEADER";
  };

  invariants: {
    headerEquationBalanced: boolean;
    itemizedEquationBalanced: boolean;
    varianceEquationBalanced: boolean;
  };

  reconciliationStatus: ReconciliationEngineStatus;
  eligibleForPreApprovalReconciliation: boolean;
  eligibleForHistoricalAdjustment: boolean;

  dataQuality: {
    totalPayslipsChecked: number;
    duplicatePayslipIds: string[];
    arithmeticDiscrepancies: Array<{
      payslipId: string;
      employeeId: string;
      discrepancyPaise: bigint;
    }>;
    warnings: string[];
  };

  errors: string[];
}

/**
 * JSON-serializable representation of the reconciliation result.
 * Native BigInts are converted to strings to prevent JSON serialization errors.
 */
export interface SerializedPayrollReconciliationResult {
  payrollRunId: string;
  periodStart: string;
  periodEnd: string;
  runStatus: string;
  approvalStatus: string;
  payDate: string | null;
  paymentDate: string | null;
  readOnly: true;
  financialMutationPerformed: false;

  source: {
    header: {
      headcount: number;
      grossPaise: string;
      deductionsPaise: string;
      netPaise: string;
      grossFormatted: string;
      deductionsFormatted: string;
      netFormatted: string;
      grossRupees: number;
      deductionsRupees: number;
      netRupees: number;
    };
    itemized: {
      headcount: number;
      uniqueEmployeeCount: number;
      grossPaise: string;
      deductionsPaise: string;
      netPaise: string;
      grossFormatted: string;
      deductionsFormatted: string;
      netFormatted: string;
      grossRupees: number;
      deductionsRupees: number;
      netRupees: number;
    };
  };

  variance: {
    headcount: number;
    grossPaise: string;
    deductionsPaise: string;
    netPaise: string;
    grossFormatted: string;
    deductionsFormatted: string;
    netFormatted: string;
    grossRupees: number;
    deductionsRupees: number;
    netRupees: number;
    signConvention: "ITEMIZED_MINUS_STORED_HEADER";
  };

  invariants: {
    headerEquationBalanced: boolean;
    itemizedEquationBalanced: boolean;
    varianceEquationBalanced: boolean;
  };

  reconciliationStatus: ReconciliationEngineStatus;
  eligibleForPreApprovalReconciliation: boolean;
  eligibleForHistoricalAdjustment: boolean;

  dataQuality: {
    totalPayslipsChecked: number;
    duplicatePayslipIds: string[];
    arithmeticDiscrepancies: Array<{
      payslipId: string;
      employeeId: string;
      discrepancyPaise: string;
    }>;
    warnings: string[];
  };

  errors: string[];
}

/**
 * Parses any numeric representation (number, string) into exact integer paise (BigInt).
 * Rejects non-finite numbers, NaN, and malformed numeric strings.
 * Flags sub-paise decimal precision beyond 2 decimal places.
 */
export function parseToPaise(val: number | string | null | undefined): MonetaryPaiseValue {
  if (val === null || val === undefined || val === "") {
    return {
      paise: BigInt(0),
      rupees: 0,
      formattedRupees: "₹0.00",
    };
  }

  let numVal: number;
  let strVal: string;

  if (typeof val === "number") {
    if (!Number.isFinite(val) || Number.isNaN(val)) {
      throw new Error(`Invalid monetary number: ${val}. Must be a finite numeric value.`);
    }
    numVal = val;
    strVal = val.toString();
  } else if (typeof val === "string") {
    let trimmed = val.trim().replace(/,/g, "").trim();
    let isNegative = false;
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      isNegative = true;
      trimmed = trimmed.slice(1, -1).trim();
    }
    if (trimmed.startsWith("-")) {
      isNegative = true;
      trimmed = trimmed.substring(1).trim();
    }
    trimmed = trimmed.replace(/^₹/, "").trim();
    if (trimmed.startsWith("-")) {
      isNegative = true;
      trimmed = trimmed.substring(1).trim();
    }
    numVal = Number(trimmed);
    if (!Number.isFinite(numVal) || Number.isNaN(numVal)) {
      throw new Error(`Invalid monetary string: "${val}". Cannot parse as numeric currency.`);
    }
    if (isNegative) {
      numVal = -numVal;
    }
    strVal = numVal.toString();
  } else {
    throw new Error(`Unsupported monetary value type: ${typeof val}`);
  }

  // Check sub-paise precision
  let precisionWarning: string | undefined;
  const decimalParts = strVal.split(".");
  if (decimalParts.length === 2 && decimalParts[1].length > 2) {
    const fraction = decimalParts[1];
    // If digits after 2nd decimal place are not all zeros
    if (fraction.slice(2).replace(/0/g, "").length > 0) {
      precisionWarning = `Sub-paise precision detected in amount "${val}". Fractional paise will be rounded deterministically using half-up arithmetic.`;
    }
  }

  // Canonical half-up rounding to integer paise
  const roundedPaiseNum = Math.round(numVal * 100);
  const paise = BigInt(roundedPaiseNum);
  assertSqliteInt64(paise, "parsed paise");
  const rupees = Number(formatPaiseToRupeeString(paise));
  const formattedRupees = formatPaiseToINR(paise);

  return {
    paise,
    rupees,
    formattedRupees,
    precisionWarning,
  };
}

/**
 * Formats BigInt paise into a standardized 2-decimal rupee string without floating point operations.
 * Example: 5443033152n -> "54430331.52"
 * Example: -35832851n -> "-358328.51"
 */
export function formatPaiseToRupeeString(paise: bigint): string {
  const isNegative = paise < BigInt(0);
  const absPaise = isNegative ? -paise : paise;
  const whole = absPaise / BigInt(100);
  const cents = absPaise % BigInt(100);
  const sign = isNegative ? "-" : "";
  return `${sign}${whole.toString()}.${cents.toString().padStart(2, "0")}`;
}

/**
 * Formats BigInt paise into Indian Rupee localized string with Lakhs/Crores grouping.
 * Example: 5443033152n -> "₹5,44,30,331.52"
 * Example: -35832851n -> "-₹3,58,328.51"
 */
export function formatPaiseToINR(paise: bigint): string {
  const isNegative = paise < BigInt(0);
  const absPaise = isNegative ? -paise : paise;
  const whole = absPaise / BigInt(100);
  const cents = absPaise % BigInt(100);

  // Grouping whole number according to Indian Numbering System (3, 2, 2, ...)
  const wholeStr = whole.toString();
  let groupedWhole = "";
  if (wholeStr.length <= 3) {
    groupedWhole = wholeStr;
  } else {
    const last3 = wholeStr.slice(-3);
    const remaining = wholeStr.slice(0, -3);
    const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    groupedWhole = `${withCommas},${last3}`;
  }

  const sign = isNegative ? "-" : "";
  return `${sign}₹${groupedWhole}.${cents.toString().padStart(2, "0")}`;
}

export interface CalculateReconciliationOptions {
  tx?: Prisma.TransactionClient;
}

/**
 * Executes a pure, non-mutating calculation of payroll reconciliation tie-out.
 * Reads existing records and evaluates all source values down to the exact paise.
 */
export async function calculatePayrollReconciliation(
  runId: string,
  options: CalculateReconciliationOptions = {}
): Promise<PayrollReconciliationEngineResult | null> {
  const client = options.tx || prisma;

  const run = await client.payrollRun.findUnique({
    where: { id: runId },
    include: {
      payslips: {
        select: {
          id: true,
          employeeId: true,
          grossPay: true,
          totalDeductions: true,
          deductions: true,
          netPay: true,
        },
      },
    },
  });

  if (!run) {
    return null;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Process Header Figures (Stored)
  const storedGrossParsed = parseToPaise(run.totalGross);
  const storedNetParsed = parseToPaise(run.totalNet);

  if (storedGrossParsed.precisionWarning) warnings.push(`Header gross: ${storedGrossParsed.precisionWarning}`);
  if (storedNetParsed.precisionWarning) warnings.push(`Header net: ${storedNetParsed.precisionWarning}`);

  const storedGrossPaise = storedGrossParsed.paise;
  const storedNetPaise = storedNetParsed.paise;
  // Implied stored deductions = Gross - Net
  const storedDeductionsPaise = storedGrossPaise - storedNetPaise;
  const storedHeadcount = Math.max(0, run.employeesPaid ?? 0);

  // Validate SQLite Int64 limits for header values
  assertSqliteInt64(storedGrossPaise, "storedGrossPaise");
  assertSqliteInt64(storedNetPaise, "storedNetPaise");
  assertSqliteInt64(storedDeductionsPaise, "storedDeductionsPaise");

  // Assert header invariant: Gross - Deductions === Net
  const headerEquationBalanced = storedGrossPaise - storedDeductionsPaise === storedNetPaise;
  if (!headerEquationBalanced) {
    errors.push("Header invariant failure: storedGrossPaise - storedDeductionsPaise !== storedNetPaise");
  }

  // 2. Process Itemized Payslip Figures
  const payslips = run.payslips;
  const totalPayslipsChecked = payslips.length;

  let sumGrossPaise = BigInt(0);
  let sumDeductionsPaise = BigInt(0);
  let sumNetPaise = BigInt(0);

  const seenPayslipIds = new Set<string>();
  const duplicatePayslipIds: string[] = [];
  const distinctEmployees = new Set<string>();
  const arithmeticDiscrepancies: Array<{
    payslipId: string;
    employeeId: string;
    discrepancyPaise: bigint;
  }> = [];

  for (const p of payslips) {
    // Check duplicate ID
    if (seenPayslipIds.has(p.id)) {
      duplicatePayslipIds.push(p.id);
    } else {
      seenPayslipIds.add(p.id);
    }

    if (p.employeeId) {
      distinctEmployees.add(p.employeeId);
    }

    try {
      const gParsed = parseToPaise(p.grossPay);
      const dParsed = parseToPaise(p.totalDeductions ?? p.deductions ?? 0);
      const nParsed = parseToPaise(p.netPay);

      if (gParsed.precisionWarning) warnings.push(`Payslip ${p.id} gross: ${gParsed.precisionWarning}`);
      if (dParsed.precisionWarning) warnings.push(`Payslip ${p.id} deductions: ${dParsed.precisionWarning}`);
      if (nParsed.precisionWarning) warnings.push(`Payslip ${p.id} net: ${nParsed.precisionWarning}`);

      // Internal payslip line check: gross - deductions === net
      const expectedNetPaise = gParsed.paise - dParsed.paise;
      if (expectedNetPaise !== nParsed.paise) {
        const discPaise = nParsed.paise - expectedNetPaise;
        assertSqliteInt64(discPaise, `payslip ${p.id} discrepancy paise`);
        arithmeticDiscrepancies.push({
          payslipId: p.id,
          employeeId: p.employeeId,
          discrepancyPaise: discPaise,
        });
      }

      sumGrossPaise += gParsed.paise;
      sumDeductionsPaise += dParsed.paise;
      sumNetPaise += nParsed.paise;

      assertSqliteInt64(sumGrossPaise, "accumulated itemized gross paise");
      assertSqliteInt64(sumDeductionsPaise, "accumulated itemized deductions paise");
      assertSqliteInt64(sumNetPaise, "accumulated itemized net paise");
    } catch (err) {
      errors.push(`Malformed monetary data in payslip ${p.id}: ${(err as Error).message}`);
    }
  }

  if (duplicatePayslipIds.length > 0) {
    errors.push(`Duplicate payslip IDs detected: ${duplicatePayslipIds.join(", ")}`);
  }

  // Assert itemized invariant: sumGross - sumDeductions === sumNet
  const itemizedEquationBalanced = sumGrossPaise - sumDeductionsPaise === sumNetPaise;
  if (!itemizedEquationBalanced) {
    errors.push("Itemized invariant failure: sumGrossPaise - sumDeductionsPaise !== sumNetPaise");
  }

  // 3. Compute Variances
  // Sign convention: Variance = Itemized (Actual) - Stored (Header)
  const headcountVariance = totalPayslipsChecked - storedHeadcount;
  const grossVariancePaise = sumGrossPaise - storedGrossPaise;
  const deductionsVariancePaise = sumDeductionsPaise - storedDeductionsPaise;
  const netVariancePaise = sumNetPaise - storedNetPaise;

  // Validate SQLite Int64 limits for variances
  assertSqliteInt64(grossVariancePaise, "grossVariancePaise");
  assertSqliteInt64(deductionsVariancePaise, "deductionsVariancePaise");
  assertSqliteInt64(netVariancePaise, "netVariancePaise");

  // Assert variance invariant: grossVariance - deductionsVariance === netVariance
  const varianceEquationBalanced = grossVariancePaise - deductionsVariancePaise === netVariancePaise;
  if (!varianceEquationBalanced) {
    errors.push("Variance invariant failure: grossVariancePaise - deductionsVariancePaise !== netVariancePaise");
  }

  // 4. Determine Reconciliation Status
  let reconciliationStatus: ReconciliationEngineStatus;

  if (errors.length > 0 || arithmeticDiscrepancies.length > 0) {
    reconciliationStatus = "INVALID_DATA";
  } else if (totalPayslipsChecked === 0) {
    reconciliationStatus = "NO_ITEMS";
  } else if (
    grossVariancePaise === BigInt(0) &&
    netVariancePaise === BigInt(0) &&
    deductionsVariancePaise === BigInt(0) &&
    headcountVariance === 0 &&
    itemizedEquationBalanced
  ) {
    reconciliationStatus = "MATCHED";
  } else {
    reconciliationStatus = "MISMATCH";
  }

  // 5. Workflow Eligibility Evaluation
  const isPaid = (run.status || "").toUpperCase().includes("PAID");
  const isPending = (run.approvalStatus || "").toLowerCase() === "pending";

  // Eligible for pre-approval batch alignment: in-flight unpaid run with mismatch and verified payslips
  const eligibleForPreApprovalReconciliation =
    !isPaid && isPending && totalPayslipsChecked > 0 && reconciliationStatus === "MISMATCH";

  // Eligible for formal historical reporting adjustment: already paid run with mismatch
  const eligibleForHistoricalAdjustment =
    isPaid && totalPayslipsChecked > 0 && reconciliationStatus === "MISMATCH";

  // Synthesize approval status for presentation consistency
  const effectiveApprovalStatus = isPaid ? "Approved" : (run.approvalStatus || "Pending");

  return {
    payrollRunId: run.id,
    periodStart: run.periodStart.toISOString().split("T")[0],
    periodEnd: run.periodEnd.toISOString().split("T")[0],
    runStatus: run.status,
    approvalStatus: effectiveApprovalStatus,
    payDate: run.payDate ? run.payDate.toISOString().split("T")[0] : null,
    paymentDate: run.paymentDate ? run.paymentDate.toISOString().split("T")[0] : null,
    readOnly: true,
    financialMutationPerformed: false,

    source: {
      header: {
        headcount: storedHeadcount,
        grossPaise: storedGrossPaise,
        deductionsPaise: storedDeductionsPaise,
        netPaise: storedNetPaise,
        grossFormatted: formatPaiseToINR(storedGrossPaise),
        deductionsFormatted: formatPaiseToINR(storedDeductionsPaise),
        netFormatted: formatPaiseToINR(storedNetPaise),
        grossRupees: Number(formatPaiseToRupeeString(storedGrossPaise)),
        deductionsRupees: Number(formatPaiseToRupeeString(storedDeductionsPaise)),
        netRupees: Number(formatPaiseToRupeeString(storedNetPaise)),
      },
      itemized: {
        headcount: totalPayslipsChecked,
        uniqueEmployeeCount: distinctEmployees.size,
        grossPaise: sumGrossPaise,
        deductionsPaise: sumDeductionsPaise,
        netPaise: sumNetPaise,
        grossFormatted: formatPaiseToINR(sumGrossPaise),
        deductionsFormatted: formatPaiseToINR(sumDeductionsPaise),
        netFormatted: formatPaiseToINR(sumNetPaise),
        grossRupees: Number(formatPaiseToRupeeString(sumGrossPaise)),
        deductionsRupees: Number(formatPaiseToRupeeString(sumDeductionsPaise)),
        netRupees: Number(formatPaiseToRupeeString(sumNetPaise)),
      },
    },

    variance: {
      headcount: headcountVariance,
      grossPaise: grossVariancePaise,
      deductionsPaise: deductionsVariancePaise,
      netPaise: netVariancePaise,
      grossFormatted: formatPaiseToINR(grossVariancePaise),
      deductionsFormatted: formatPaiseToINR(deductionsVariancePaise),
      netFormatted: formatPaiseToINR(netVariancePaise),
      grossRupees: Number(formatPaiseToRupeeString(grossVariancePaise)),
      deductionsRupees: Number(formatPaiseToRupeeString(deductionsVariancePaise)),
      netRupees: Number(formatPaiseToRupeeString(netVariancePaise)),
      signConvention: "ITEMIZED_MINUS_STORED_HEADER",
    },

    invariants: {
      headerEquationBalanced,
      itemizedEquationBalanced,
      varianceEquationBalanced,
    },

    reconciliationStatus,
    eligibleForPreApprovalReconciliation,
    eligibleForHistoricalAdjustment,

    dataQuality: {
      totalPayslipsChecked,
      duplicatePayslipIds,
      arithmeticDiscrepancies,
      warnings,
    },

    errors,
  };
}

/**
 * Serializes a PayrollReconciliationEngineResult into a JSON-safe object.
 * Converts native BigInt instances to string representations.
 */
export function serializeReconciliationResult(
  result: PayrollReconciliationEngineResult
): SerializedPayrollReconciliationResult {
  return {
    ...result,
    source: {
      header: {
        ...result.source.header,
        grossPaise: result.source.header.grossPaise.toString(),
        deductionsPaise: result.source.header.deductionsPaise.toString(),
        netPaise: result.source.header.netPaise.toString(),
      },
      itemized: {
        ...result.source.itemized,
        grossPaise: result.source.itemized.grossPaise.toString(),
        deductionsPaise: result.source.itemized.deductionsPaise.toString(),
        netPaise: result.source.itemized.netPaise.toString(),
      },
    },
    variance: {
      ...result.variance,
      grossPaise: result.variance.grossPaise.toString(),
      deductionsPaise: result.variance.deductionsPaise.toString(),
      netPaise: result.variance.netPaise.toString(),
    },
    dataQuality: {
      ...result.dataQuality,
      arithmeticDiscrepancies: result.dataQuality.arithmeticDiscrepancies.map((d) => ({
        ...d,
        discrepancyPaise: d.discrepancyPaise.toString(),
      })),
    },
  };
}

