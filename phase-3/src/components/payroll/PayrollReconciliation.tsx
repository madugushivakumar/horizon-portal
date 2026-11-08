"use client";

import React from "react";
import { formatMoney } from "@/lib/payroll/formatters";
import { Badge } from "@/components/ui/badge";

export interface ReconciliationData {
  runId: string;
  payrollPeriod: string;
  reconciliationStatus: "MATCHED" | "MISMATCH" | "NO_ITEMS";
  storedGross: number;
  storedNet: number;
  storedDeductions: number;
  storedEmployeeCount: number;
  calculatedGross: number;
  calculatedNet: number;
  calculatedDeductions: number;
  actualPayslipCount: number;
  grossDifference: number;
  netDifference: number;
  deductionsDifference: number;
  employeeCountDifference: number;
  internalArithmeticBalanced: boolean;
  internalDiscrepancy: number;
  discrepancyDetails: string[];
}

interface PayrollReconciliationProps {
  reconciliation: ReconciliationData | null | undefined;
}

export default function PayrollReconciliation({ reconciliation }: PayrollReconciliationProps) {
  if (!reconciliation) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500">
        Reconciliation data is not available for this run.
      </div>
    );
  }

  const {
    reconciliationStatus,
    storedGross,
    calculatedGross,
    grossDifference,
    storedNet,
    calculatedNet,
    netDifference,
    storedDeductions,
    calculatedDeductions,
    deductionsDifference,
    storedEmployeeCount,
    actualPayslipCount,
    employeeCountDifference,
    internalArithmeticBalanced,
    discrepancyDetails,
  } = reconciliation;

  const isMatched = reconciliationStatus === "MATCHED";
  const isNoItems = reconciliationStatus === "NO_ITEMS";
  const isMismatch = reconciliationStatus === "MISMATCH";

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/60 dark:bg-zinc-900/60">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Financial Reconciliation & Tie-Out</span>
            {isMatched && (
              <Badge variant="success" dot size="sm">
                Matched & Verified
              </Badge>
            )}
            {isMismatch && (
              <Badge variant="danger" dot size="sm">
                Discrepancy Detected
              </Badge>
            )}
            {isNoItems && (
              <Badge variant="default" size="sm">
                Historical / No Items
              </Badge>
            )}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Independent tie-out verification comparing stored run header totals against itemized payslip sums.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {internalArithmeticBalanced ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Formula Balanced (Net = Gross - Deductions)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              Arithmetic Variance Detected
            </span>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-6">Financial Dimension</th>
              <th className="py-3 px-6 text-right">Stored Header Total</th>
              <th className="py-3 px-6 text-right">Payslips Sum (Calculated)</th>
              <th className="py-3 px-6 text-right">Variance (Stored - Calculated)</th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
            {/* Gross Earnings */}
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
              <td className="py-3.5 px-6 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Gross Earnings
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-medium">
                {formatMoney(storedGross)}
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-medium">
                {isNoItems ? "—" : formatMoney(calculatedGross)}
              </td>
              <td className={`py-3.5 px-6 text-right font-mono font-semibold ${
                grossDifference !== 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {isNoItems ? "—" : (grossDifference > 0 ? `+${formatMoney(grossDifference)}` : formatMoney(grossDifference))}
              </td>
              <td className="py-3.5 px-6 text-center">
                {isNoItems ? (
                  <Badge variant="default" size="sm">No Items</Badge>
                ) : grossDifference === 0 ? (
                  <Badge variant="success" size="sm">Tie-out</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Diff</Badge>
                )}
              </td>
            </tr>

            {/* Total Deductions */}
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
              <td className="py-3.5 px-6 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Total Deductions (PF, ESI, TDS, PT)
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-medium">
                {formatMoney(storedDeductions)}
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-medium">
                {isNoItems ? "—" : formatMoney(calculatedDeductions)}
              </td>
              <td className={`py-3.5 px-6 text-right font-mono font-semibold ${
                deductionsDifference !== 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {isNoItems ? "—" : (deductionsDifference > 0 ? `+${formatMoney(deductionsDifference)}` : formatMoney(deductionsDifference))}
              </td>
              <td className="py-3.5 px-6 text-center">
                {isNoItems ? (
                  <Badge variant="default" size="sm">No Items</Badge>
                ) : deductionsDifference === 0 ? (
                  <Badge variant="success" size="sm">Tie-out</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Diff</Badge>
                )}
              </td>
            </tr>

            {/* Net Payable */}
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors bg-zinc-50/30 dark:bg-zinc-800/20">
              <td className="py-3.5 px-6 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Net Payable
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatMoney(storedNet)}
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {isNoItems ? "—" : formatMoney(calculatedNet)}
              </td>
              <td className={`py-3.5 px-6 text-right font-mono font-bold ${
                netDifference !== 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {isNoItems ? "—" : (netDifference > 0 ? `+${formatMoney(netDifference)}` : formatMoney(netDifference))}
              </td>
              <td className="py-3.5 px-6 text-center">
                {isNoItems ? (
                  <Badge variant="default" size="sm">No Items</Badge>
                ) : netDifference === 0 ? (
                  <Badge variant="success" size="sm">Tie-out</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Diff</Badge>
                )}
              </td>
            </tr>

            {/* Employee Headcount */}
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
              <td className="py-3.5 px-6 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Employee Headcount
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-medium">
                {storedEmployeeCount} Employees
              </td>
              <td className="py-3.5 px-6 text-right font-mono font-medium">
                {isNoItems ? "0 Payslips" : `${actualPayslipCount} Payslips`}
              </td>
              <td className={`py-3.5 px-6 text-right font-mono font-semibold ${
                employeeCountDifference !== 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {isNoItems ? "—" : (employeeCountDifference > 0 ? `+${employeeCountDifference} missing` : `${employeeCountDifference}`)}
              </td>
              <td className="py-3.5 px-6 text-center">
                {isNoItems ? (
                  <Badge variant="default" size="sm">No Items</Badge>
                ) : employeeCountDifference === 0 ? (
                  <Badge variant="success" size="sm">Tie-out</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Diff</Badge>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Discrepancy Callout / Policy Notice */}
      {isMismatch && discrepancyDetails.length > 0 && (
        <div className="p-5 bg-rose-50/70 dark:bg-rose-950/20 border-t border-rose-200 dark:border-rose-900/40">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Financial Reconciliation Discrepancy Detected
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                The stored run header totals do not match the itemized payslip sums. Under enterprise governance policy, approval is locked until all variances are resolved.
              </p>
              <ul className="mt-2.5 space-y-1 text-xs text-rose-800 dark:text-rose-300 font-mono">
                {discrepancyDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isNoItems && (
        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Historical run archived without item-level payslips. Financial summary represents authoritative ledger figures.
            </span>
          </div>
        </div>
      )}

      {isMatched && (
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            All financial totals tie out exactly with zero variance. Eligible for administrative approval.
          </span>
        </div>
      )}
    </div>
  );
}

