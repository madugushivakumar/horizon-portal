"use client";

/**
 * Horizon Portal — Payslip Document Component (A4 Printable Statement)
 * src/components/payroll/PayslipDocument.tsx
 *
 * Implements a pixel-perfect, professional, audit-ready payslip statement.
 * Strictly adheres to A4 print constraints:
 * - Dual-column layout for itemized Earnings vs. itemized Deductions
 * - Exact INR formatting via Intl.NumberFormat and Indian numbering words
 * - Employer legal metadata and Employee demographic credentials
 * - Print action button triggering browser print dialog
 */

import React, { useState } from "react";
import Link from "next/link";
import { formatMoney, formatDisplayDate, formatPayPeriodLabel, amountInWords } from "@/lib/payroll/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PayslipDetailData {
  id: string;
  payrollRunId: string;
  periodStart: string | null;
  periodEnd: string | null;
  paymentDate: string | null;
  status: string;
  currency: string;
  calendarDays: number;
  payableDays: number;
  lopDays: number;
  employee: {
    id: string;
    fullName: string;
    email: string;
    department: string;
    role: string;
    workLocation: string;
    workMode: string;
    employmentType: string;
  };
  employer: {
    companyName: string;
    legalEntity: string;
    address: string;
    taxRegistration: string;
  };
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    medical: number;
    specialAllowance: number;
    overtimePay: number;
    variablePay: number;
    grossPay: number;
  };
  deductions: {
    pfEmployee: number;
    esiEmployee: number;
    professionalTax: number;
    tds: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  netPay: number;
}

export interface PayslipDocumentProps {
  payslip: PayslipDetailData;
}

export const PayslipDocument: React.FC<PayslipDocumentProps> = ({ payslip }) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const periodTitle = payslip.periodStart
    ? formatPayPeriodLabel(payslip.periodStart, payslip.payrollRunId)
    : payslip.payrollRunId;

  return (
    <div className="space-y-6">
      {/* Interactive Action Toolbar (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-[var(--hz-border)] bg-[var(--hz-bg-surface)] shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/payslips"
            id="back-to-payslips-link"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)] transition-colors"
          >
            ← Back to All Payslips
          </Link>
          <span className="text-[var(--hz-border)]">|</span>
          <span className="text-xs font-mono text-[var(--hz-text-muted)]">
            Run: {payslip.payrollRunId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            id="copy-payslip-link-btn"
          >
            {copySuccess ? "✓ Copied Link" : "🔗 Share Link"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            id="print-payslip-btn"
            leftIcon={<span>🖨️</span>}
          >
            Print / Save A4 PDF
          </Button>
        </div>
      </div>

      {/* Payslip Document Outer Shell (Print-optimized container) */}
      <div
        id="payslip-document-sheet"
        className="payslip-print-container bg-[var(--hz-bg-surface)] border border-[var(--hz-border)] rounded-2xl shadow-md p-6 sm:p-10 max-w-4xl mx-auto space-y-6 text-[var(--hz-text-primary)] transition-all"
      >
        {/* 1. Header Section: Employer Identity & Statement Metadata */}
        <div className="payslip-section border-b border-[var(--hz-border)] pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--hz-primary-600)] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                HZ
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--hz-text-primary)]">
                {payslip.employer.companyName}
              </h1>
            </div>
            <p className="text-xs font-medium text-[var(--hz-text-secondary)]">
              {payslip.employer.legalEntity}
            </p>
            <p className="text-xs text-[var(--hz-text-muted)] max-w-md">
              {payslip.employer.address}
            </p>
            <p className="text-[11px] font-mono text-[var(--hz-text-muted)] pt-0.5">
              {payslip.employer.taxRegistration}
            </p>
          </div>

          <div className="sm:text-right space-y-1 sm:self-center">
            <div className="inline-block px-3 py-1 rounded-md bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)] text-xs font-bold uppercase tracking-wider">
              Salary Statement
            </div>
            <h2 className="text-lg font-bold text-[var(--hz-text-primary)]">
              Payslip for {periodTitle}
            </h2>
            <p className="text-xs text-[var(--hz-text-secondary)]">
              Payment Date: <span className="font-semibold">{formatDisplayDate(payslip.paymentDate)}</span>
            </p>
            <p className="text-xs font-mono text-[var(--hz-text-muted)]">
              Ref ID: {payslip.id}
            </p>
          </div>
        </div>

        {/* 2. Employee Credentials & Attendance Summary Grid */}
        <div className="payslip-summary-grid bg-[var(--hz-bg-subtle)] border border-[var(--hz-border)] rounded-xl p-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Employee Name
              </p>
              <p className="font-bold text-[var(--hz-text-primary)] mt-0.5 text-sm">
                {payslip.employee.fullName}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Employee ID
              </p>
              <p className="font-mono font-bold text-[var(--hz-text-primary)] mt-0.5">
                {payslip.employee.id}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Department
              </p>
              <p className="font-semibold text-[var(--hz-text-primary)] mt-0.5">
                {payslip.employee.department}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Designation
              </p>
              <p className="font-semibold text-[var(--hz-text-primary)] mt-0.5">
                {payslip.employee.role}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Work Location
              </p>
              <p className="text-[var(--hz-text-primary)] mt-0.5">
                {payslip.employee.workLocation} ({payslip.employee.workMode})
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Pay Period
              </p>
              <p className="text-[var(--hz-text-primary)] mt-0.5 font-medium">
                {formatDisplayDate(payslip.periodStart)} – {formatDisplayDate(payslip.periodEnd)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Payable Days
              </p>
              <p className="font-mono font-bold text-[var(--hz-text-primary)] mt-0.5">
                {payslip.payableDays} / {payslip.calendarDays} Days
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                LOP (Loss of Pay)
              </p>
              <p className="font-mono font-bold text-[var(--hz-text-primary)] mt-0.5">
                {payslip.lopDays} Days
              </p>
            </div>
          </div>
        </div>

        {/* 3. Itemized Earnings & Deductions Tables (Side by Side) */}
        <div className="payslip-tables-row grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Breakdown */}
          <div className="border border-[var(--hz-border)] rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-[var(--hz-bg-subtle)] px-4 py-2.5 border-b border-[var(--hz-border)] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--hz-text-primary)]">
                  Earnings Breakdown
                </h3>
                <span className="text-[11px] font-mono text-[var(--hz-text-muted)]">
                  Currency ({payslip.currency})
                </span>
              </div>
              <table className="payslip-table w-full text-xs">
                <tbody className="divide-y divide-[var(--hz-border)]">
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Basic Salary</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.earnings.basic, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">House Rent Allowance (HRA)</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.earnings.hra, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Conveyance Allowance</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.earnings.conveyance, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Medical Allowance</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.earnings.medical, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Special Allowance</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.earnings.specialAllowance, payslip.currency)}
                    </td>
                  </tr>
                  {payslip.earnings.overtimePay > 0 && (
                    <tr>
                      <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Overtime Compensation</td>
                      <td className="px-4 py-2 text-right font-mono font-medium">
                        {formatMoney(payslip.earnings.overtimePay, payslip.currency)}
                      </td>
                    </tr>
                  )}
                  {payslip.earnings.variablePay > 0 && (
                    <tr>
                      <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Variable / Performance Pay</td>
                      <td className="px-4 py-2 text-right font-mono font-medium">
                        {formatMoney(payslip.earnings.variablePay, payslip.currency)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-[var(--hz-bg-subtle)] px-4 py-3 border-t-2 border-[var(--hz-border)] flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[var(--hz-text-primary)]">
                Total Gross Earnings (A)
              </span>
              <span className="text-sm font-bold font-mono text-[var(--hz-text-primary)]">
                {formatMoney(payslip.earnings.grossPay, payslip.currency)}
              </span>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="border border-[var(--hz-border)] rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-[var(--hz-bg-subtle)] px-4 py-2.5 border-b border-[var(--hz-border)] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--hz-text-primary)]">
                  Deductions Breakdown
                </h3>
                <span className="text-[11px] font-mono text-[var(--hz-text-muted)]">
                  Currency ({payslip.currency})
                </span>
              </div>
              <table className="payslip-table w-full text-xs">
                <tbody className="divide-y divide-[var(--hz-border)]">
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Provident Fund (Employee PF)</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.deductions.pfEmployee, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Employee State Insurance (ESI)</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.deductions.esiEmployee, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Professional Tax (PT)</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.deductions.professionalTax, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Tax Deducted at Source (TDS)</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.deductions.tds, payslip.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--hz-text-secondary)]">Other Withholdings</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {formatMoney(payslip.deductions.otherDeductions, payslip.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[var(--hz-bg-subtle)] px-4 py-3 border-t-2 border-[var(--hz-border)] flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[var(--hz-danger)]">
                Total Deductions (B)
              </span>
              <span className="text-sm font-bold font-mono text-[var(--hz-danger)]">
                {formatMoney(payslip.deductions.totalDeductions, payslip.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Net Salary Highlight Banner */}
        <div className="payslip-net-highlight rounded-xl border-2 border-[var(--hz-primary-600)] bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)]">
                Net Take-Home Salary (A - B)
              </span>
              <Badge variant="success" size="sm" dot>
                {payslip.status}
              </Badge>
            </div>
            <p className="text-xs text-[var(--hz-text-secondary)] italic">
              Amount in words: <span className="font-semibold text-[var(--hz-text-primary)]">{amountInWords(payslip.netPay)}</span>
            </p>
          </div>

          <div className="text-center sm:text-right">
            <span
              id="payslip-net-pay-amount"
              className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)]"
            >
              {formatMoney(payslip.netPay, payslip.currency)}
            </span>
            <p className="text-[11px] text-[var(--hz-text-muted)] mt-0.5">
              Credited to registered salary account
            </p>
          </div>
        </div>

        {/* 5. Statutory Footnotes & Signature Note */}
        <div className="payslip-section border-t border-[var(--hz-border)] pt-4 text-[11px] text-[var(--hz-text-muted)] flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>
            * This is an electronically verified system statement generated by Aura Workforce. No physical signature is required.
          </p>
          <p className="font-mono">
            Generated on: {new Date().toISOString().split("T")[0]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayslipDocument;
