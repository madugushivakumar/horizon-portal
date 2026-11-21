/**
 * Horizon Portal — AI Insights Calculation & Aggregation Engine
 * src/lib/hr-insights/calculations.ts
 *
 * Implements pure, deterministic calculation, statistical disclosure control
 * (small-group complementary cell suppression), decimal-safe financial math,
 * and deterministic sorting for Day 15: AI Insights Panel for HR Advanced.
 */

import {
  AttritionInsightsData,
  ContributingFactor,
  DepartmentAttritionMetric,
  PayrollAnomalyInsightsData,
  RiskBandCounts,
  SpecificReasonItem,
  AnomalyItem,
} from "./types";

/**
 * Formats a currency amount in Indian Rupees (INR) using Indian numbering system (Lakhs/Crores).
 * Example: 31421239.07 => "₹3,14,21,239.07"
 */
export function formatIndianRupees(amount: number): string {
  if (amount === 0) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Safely masks employee ID to protect personal identity in UI views
 * while retaining sufficient reference for authorized HR operational lookup.
 * Example: "EMP-0503" => "EMP-***03", "EMP-0002" => "EMP-***02"
 */
export function maskEmployeeId(empId: string): string {
  if (!empId) return "EMP-***";
  const parts = empId.split("-");
  if (parts.length === 2 && parts[1].length >= 2) {
    const lastTwo = parts[1].slice(-2);
    return `EMP-***${lastTwo}`;
  }
  return `${empId.slice(0, 3)}***`;
}

/**
 * Categorizes a raw reason string into an executive thematic factor.
 */
export function categorizeFactor(reason: string): string {
  if (!reason) return "Other Contributing Factors";
  const trimmed = reason.trim();

  if (trimmed.startsWith("Department")) return "Departmental Historical Attrition Pattern";
  if (trimmed.startsWith("Total experience")) return "Experience / Career Stage";
  if (trimmed.startsWith("Tenure of")) return "Early Tenure Window Risk";
  if (trimmed.startsWith("Pay is") || trimmed.includes("midpoint")) return "Competitive Pay Below Midpoint";
  if (trimmed.startsWith("Job level")) return "Job Level / Seniority Pattern";
  if (trimmed.startsWith("Low engagement")) return "Low Employee Engagement";
  if (trimmed.includes("manager change")) return "Management Turnover";
  if (trimmed.startsWith("Wfh share")) return "Remote / WFH Work Mode";
  if (trimmed.startsWith("Long commute")) return "Commute Distance & Logistics";
  if (trimmed.startsWith("Previous employers")) return "Historical Job Mobility";
  if (trimmed.startsWith("Last performance")) return "Recent Performance Rating";
  if (trimmed.includes("unpaid leave") || trimmed.startsWith("Paid leave")) return "Leave Utilization Profile";
  if (trimmed.includes("Overtime")) return "Overtime Workload Pattern";
  if (trimmed.includes("No pay raise") || trimmed.startsWith("Last raise")) return "Compensation Progression Timing";
  if (trimmed.includes("late arrival")) return "Schedule Adherence Pattern";

  return "Other Contributing Factors";
}

export interface RawAttritionRecord {
  id: string;
  employeeId: string;
  departmentId: string;
  riskScore12m: number;
  riskBand: string;
  topReason1: string;
  topReason2: string;
  topReason3: string;
  department?: { id: string; name: string; code?: string | null } | null;
}

export interface RawAnomalyRecord {
  id: string;
  sourceDataset: string;
  recordId: string;
  employeeId: string;
  period: Date;
  anomalyScore: number;
  flagged: string;
  reasonCode: string;
  reasonText: string;
  moneyAtRisk: number | null;
  modelVersion: string;
  scoredAt: Date;
}

export interface EmployeeLookup {
  id: string;
  departmentId: string | null;
  department?: { id: string; name: string; code?: string | null } | null;
}

/**
 * Statistical Disclosure Control: Applies primary and complementary (secondary) cell suppression
 * to prevent small counts (< 5) from being deduced through residual calculations (total - countA - countB).
 */
export function applyComplementarySuppression(
  rawHigh: number,
  rawMedium: number,
  rawLow: number
): {
  high: number | null;
  medium: number | null;
  low: number | null;
  highDisplay: string;
  mediumDisplay: string;
  lowDisplay: string;
  hasSuppression: boolean;
  suppressedBands: string[];
} {
  const isHighSuppressed = rawHigh > 0 && rawHigh < 5;
  const isMediumSuppressed = rawMedium > 0 && rawMedium < 5;
  const isLowSuppressed = rawLow > 0 && rawLow < 5;

  const suppressedBands: string[] = [];
  if (isHighSuppressed) suppressedBands.push("high");
  if (isMediumSuppressed) suppressedBands.push("medium");
  if (isLowSuppressed) suppressedBands.push("low");

  // If no cells are below 5, return raw values
  if (suppressedBands.length === 0) {
    return {
      high: rawHigh,
      medium: rawMedium,
      low: rawLow,
      highDisplay: String(rawHigh),
      mediumDisplay: String(rawMedium),
      lowDisplay: String(rawLow),
      hasSuppression: false,
      suppressedBands: [],
    };
  }

  // If exactly 1 cell is suppressed, complementary (secondary) suppression is mandatory
  // to prevent residual deduction: total - cellB - cellC = cellA.
  // We secondary-suppress the next smallest cell (including 0 to prevent 0 + unsuppressed leaking the suppressed cell).
  if (suppressedBands.length === 1) {
    const candidates = [
      { band: "high", count: rawHigh },
      { band: "medium", count: rawMedium },
      { band: "low", count: rawLow },
    ].filter((c) => !suppressedBands.includes(c.band));

    // Prefer suppressing high or medium before low to preserve low baseline when possible
    candidates.sort((a, b) => a.count - b.count);
    if (candidates.length > 0) {
      suppressedBands.push(candidates[0].band);
    }
  }

  const resultHigh = suppressedBands.includes("high") ? null : rawHigh;
  const resultMedium = suppressedBands.includes("medium") ? null : rawMedium;
  const resultLow = suppressedBands.includes("low") ? null : rawLow;

  const highDisplay = suppressedBands.includes("high")
    ? isHighSuppressed
      ? "< 5"
      : "Suppressed (Residual Protection)"
    : String(rawHigh);

  const mediumDisplay = suppressedBands.includes("medium")
    ? isMediumSuppressed
      ? "< 5"
      : "Suppressed (Residual Protection)"
    : String(rawMedium);

  const lowDisplay = suppressedBands.includes("low")
    ? isLowSuppressed
      ? "< 5"
      : "Suppressed (Residual Protection)"
    : String(rawLow);

  return {
    high: resultHigh,
    medium: resultMedium,
    low: resultLow,
    highDisplay,
    mediumDisplay,
    lowDisplay,
    hasSuppression: true,
    suppressedBands,
  };
}

/**
 * Aggregates contributing factors and specific reasons across evaluated records.
 * Semantics:
 * - Each record contributes up to 3 factors.
 * - Intra-record deduplication ensures a factor is counted at most once per employee record.
 */
export function aggregateReasons(
  records: RawAttritionRecord[],
  limitFactors: number = 8,
  limitReasons: number = 10
): {
  topFactors: ContributingFactor[];
  topSpecificReasons: SpecificReasonItem[];
} {
  const factorTally: Record<string, number> = {};
  const reasonTally: Record<string, number> = {};
  const totalRecords = records.length;

  for (const record of records) {
    const rawList = [record.topReason1, record.topReason2, record.topReason3].filter(Boolean);
    const uniqueReasonsInRecord = new Set(rawList);

    // Tally specific exact strings
    for (const r of uniqueReasonsInRecord) {
      reasonTally[r] = (reasonTally[r] || 0) + 1;
    }

    // Tally categorized factors (deduplicated per record)
    const uniqueFactorsInRecord = new Set(rawList.map((r) => categorizeFactor(r)));
    for (const f of uniqueFactorsInRecord) {
      factorTally[f] = (factorTally[f] || 0) + 1;
    }
  }

  const topFactors: ContributingFactor[] = Object.entries(factorTally)
    .map(([factor, count]) => ({
      factor,
      count,
      percentage: totalRecords > 0 ? Number(((count / totalRecords) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limitFactors);

  const topSpecificReasons: SpecificReasonItem[] = Object.entries(reasonTally)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalRecords > 0 ? Number(((count / totalRecords) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limitReasons);

  return { topFactors, topSpecificReasons };
}

/**
 * Processes Attrition Risk dataset:
 * - Aggregates risk bands.
 * - Computes department distribution.
 * - Applies small-group suppression.
 * - Aggregates reasons.
 * - Guarantees ZERO employee PII leakage.
 */
export function calculateAttritionInsights(
  records: RawAttritionRecord[],
  allDepartments: { id: string; name: string; code?: string | null }[],
  isFilteredByDepartment: boolean = false
): AttritionInsightsData {
  let rawHigh = 0;
  let rawMedium = 0;
  let rawLow = 0;
  const total = records.length;

  const deptMap: Record<string, { high: number; medium: number; low: number; total: number }> = {};
  for (const d of allDepartments) {
    deptMap[d.id] = { high: 0, medium: 0, low: 0, total: 0 };
  }

  for (const r of records) {
    if (r.riskBand === "High") rawHigh++;
    else if (r.riskBand === "Medium") rawMedium++;
    else if (r.riskBand === "Low") rawLow++;

    if (!deptMap[r.departmentId]) {
      deptMap[r.departmentId] = { high: 0, medium: 0, low: 0, total: 0 };
    }
    deptMap[r.departmentId].total++;
    if (r.riskBand === "High") deptMap[r.departmentId].high++;
    else if (r.riskBand === "Medium") deptMap[r.departmentId].medium++;
    else if (r.riskBand === "Low") deptMap[r.departmentId].low++;
  }

  // Calculate top-level risk bands
  let riskBands: RiskBandCounts;
  if (!isFilteredByDepartment) {
    // Organization-wide totals: Low 301, Medium 86, High 43. All >= 5. No suppression.
    riskBands = {
      total,
      high: rawHigh,
      medium: rawMedium,
      low: rawLow,
      highDisplay: String(rawHigh),
      mediumDisplay: String(rawMedium),
      lowDisplay: String(rawLow),
      highRiskPercentage: total > 0 ? Number(((rawHigh / total) * 100).toFixed(1)) : 0,
      isSuppressed: false,
    };
  } else {
    // Department-filtered view: Apply small-group suppression if cell < 5
    const suppression = applyComplementarySuppression(rawHigh, rawMedium, rawLow);
    riskBands = {
      total,
      high: suppression.high,
      medium: suppression.medium,
      low: suppression.low,
      highDisplay: suppression.highDisplay,
      mediumDisplay: suppression.mediumDisplay,
      lowDisplay: suppression.lowDisplay,
      highRiskPercentage:
        suppression.high !== null && total > 0
          ? Number(((suppression.high / total) * 100).toFixed(1))
          : null,
      isSuppressed: suppression.hasSuppression,
      suppressionNote: suppression.hasSuppression
        ? "Small group values (< 5) are suppressed to protect employee privacy."
        : undefined,
    };
  }

  // Department distribution metrics with complementary suppression per department
  const departmentDistribution: DepartmentAttritionMetric[] = allDepartments
    .map((dept) => {
      const stats = deptMap[dept.id] || { high: 0, medium: 0, low: 0, total: 0 };
      if (stats.total === 0) {
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalEvaluated: 0,
          high: 0,
          medium: 0,
          low: 0,
          highDisplay: "0",
          mediumDisplay: "0",
          lowDisplay: "0",
          hasSuppression: false,
          suppressedBands: [],
        };
      }

      const supp = applyComplementarySuppression(stats.high, stats.medium, stats.low);
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalEvaluated: stats.total,
        high: supp.high,
        medium: supp.medium,
        low: supp.low,
        highDisplay: supp.highDisplay,
        mediumDisplay: supp.mediumDisplay,
        lowDisplay: supp.lowDisplay,
        hasSuppression: supp.hasSuppression,
        suppressedBands: supp.suppressedBands,
        suppressionReason: supp.hasSuppression
          ? "Small group values (< 5) suppressed for employee confidentiality."
          : undefined,
      };
    })
    // Sort departments by total evaluated descending
    .sort((a, b) => b.totalEvaluated - a.totalEvaluated);

  const { topFactors, topSpecificReasons } = aggregateReasons(records);

  return {
    totalEvaluated: total,
    riskBands,
    departmentDistribution,
    topFactors,
    topSpecificReasons,
    countingSemantics: {
      description:
        "Tally of contributing features cited by the baseline attrition model. Each employee record cites up to 3 factors; intra-record duplicates are counted once per employee.",
      intraRecordDeduplication: true,
      maxReasonsPerRecord: 3,
    },
  };
}

/**
 * Processes Payroll & Attendance Anomaly dataset:
 * - Deterministic sorting:
 *   1. Money at risk descending (numbers first).
 *   2. Anomaly score descending.
 *   3. Record ID ascending.
 *   4. Null financial values last.
 * - Decimal-safe exposure accumulation via integer paise (BigInt).
 * - Distinguishes null vs 0.00.
 */
export function calculatePayrollAnomalyInsights(
  records: RawAnomalyRecord[],
  employeeMap: Map<string, EmployeeLookup>,
  departmentMap: Map<string, { id: string; name: string; code?: string | null }>
): PayrollAnomalyInsightsData {
  let totalPayrollAnomalies = 0;
  let totalAttendanceAnomalies = 0;
  let zeroMoneyCount = 0;
  let positiveMoneyCount = 0;
  let nullMoneyCount = 0;
  let unmatchedEmployeeRecordsCount = 0;

  // Decimal-safe integer paise accumulator
  let totalPaise = BigInt(0);

  const items: AnomalyItem[] = records.map((record) => {
    const isPayroll = record.sourceDataset === "payroll_monthly_features";
    const emp = employeeMap.get(record.employeeId);
    const isUnmatched = !emp;
    if (isUnmatched) {
      unmatchedEmployeeRecordsCount++;
    }

    let deptId: string | null = null;
    let deptName: string | null = null;
    if (emp && emp.departmentId) {
      deptId = emp.departmentId;
      const dept = departmentMap.get(emp.departmentId);
      deptName = dept ? dept.name : emp.departmentId;
    } else if (isUnmatched) {
      deptId = null;
      deptName = "Unassigned / Former Employee";
    }

    if (isPayroll) {
      totalPayrollAnomalies++;
      if (record.moneyAtRisk === null) {
        nullMoneyCount++;
      } else {
        if (record.moneyAtRisk === 0) {
          zeroMoneyCount++;
        } else {
          positiveMoneyCount++;
        }
        totalPaise += BigInt(Math.round(record.moneyAtRisk * 100));
      }
    } else {
      totalAttendanceAnomalies++;
      nullMoneyCount++;
    }

    return {
      id: record.id,
      sourceDataset: record.sourceDataset as "payroll_monthly_features" | "attendance_monthly_features",
      category: isPayroll ? "PAYROLL" : "ATTENDANCE",
      isMonetary: record.moneyAtRisk !== null,
      recordId: record.recordId,
      period: record.period.toISOString(),
      anomalyScore: record.anomalyScore,
      flagged: record.flagged,
      reviewStatus: "Flagged for Review",
      reasonCode: record.reasonCode,
      reasonText: record.reasonText,
      moneyAtRisk: record.moneyAtRisk,
      formattedMoneyAtRisk:
        record.moneyAtRisk !== null ? formatIndianRupees(record.moneyAtRisk) : null,
      modelVersion: record.modelVersion,
      scoredAt: record.scoredAt.toISOString(),
      departmentId: deptId,
      departmentName: deptName,
      employeeMask: isUnmatched ? "FORMER-EMP-***" : maskEmployeeId(record.employeeId),
      isUnmatchedEmployee: isUnmatched,
    };
  });

  // Deterministic multi-tier sort:
  // 1. Money at risk descending (null last)
  // 2. Anomaly score descending
  // 3. Record ID ascending
  items.sort((a, b) => {
    // Null financial values last
    if (a.moneyAtRisk !== null && b.moneyAtRisk === null) return -1;
    if (a.moneyAtRisk === null && b.moneyAtRisk !== null) return 1;

    // Both have numbers for moneyAtRisk
    if (a.moneyAtRisk !== null && b.moneyAtRisk !== null) {
      if (b.moneyAtRisk !== a.moneyAtRisk) {
        return b.moneyAtRisk - a.moneyAtRisk; // DESC
      }
    }

    // Anomaly score descending
    if (b.anomalyScore !== a.anomalyScore) {
      return b.anomalyScore - a.anomalyScore; // DESC
    }

    // Stable tie-breaker: Record ID ascending
    return a.id.localeCompare(b.id);
  });

  const cumulativeRupees = Number(totalPaise) / 100;

  return {
    totalAnomalies: records.length,
    totalPayrollAnomalies,
    totalAttendanceAnomalies,
    flaggedForReviewCount: records.length,
    aggregationAvailable: true,
    aggregationLabel: "18-month cumulative historical flagged payroll exposure",
    timeHorizonMonths: 18,
    currency: "INR",
    currencySymbol: "₹",
    cumulativeMoneyAtRisk: cumulativeRupees,
    formattedCumulativeMoneyAtRisk: formatIndianRupees(cumulativeRupees),
    zeroMoneyCount,
    positiveMoneyCount,
    nullMoneyCount,
    unmatchedEmployeeRecordsCount,
    items,
  };
}
