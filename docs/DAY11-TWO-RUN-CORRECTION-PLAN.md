# DAY 11 — TWO-RUN CORRECTION & FINANCIAL RESOLUTION PLAN
**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Day 11: Admin Payroll Run Console  
**Date:** November 7, 2026 (Updated)  
**Auditor:** Senior Payroll Systems Architect, Financial Data Auditor & QA Lead  
**Repository:** `horizon-portal`  
**Current Branch:** `main`  
**Release Tag:** `phase-3` (Commit: `57ebcba5237d18eb053b1165a6e9795080ed907b`)  
**Canonical Classification:** **Category 4 — Upstream Planning or Reporting Variance**  

---

## 1. Executive Summary

This document outlines the architectural and accounting resolution plan for reconciling August 2026 (`PR-2026-08`) and September 2026 (`PR-2026-09`).

In accordance with strict prompt instructions, this plan is **DOCUMENTATION-ONLY**. No financial mutations are authorized or executed. Execution is permanently halted at Gate 1 pending formal corporate executive approval.

### Mandatory Legal Characterization Safeguard:
> **"Payslips are individual employee compensation records in the supplied dataset. Their formal legal and accounting authority for historical reconciliation has not been independently established by the available project evidence."**

---

## 2. Discrepancy Classification Under Canonical Standard

Classified under [`docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md`](file:///c:/Users/Madugu Shiva Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-DISCREPANCY-CLASSIFICATION-STANDARD.md):

| Run ID | Canonical Classification | Detailed Forensic Description & Required Evidence | Governance Blocker |
|---|---|---|---|
| `PR-2026-08` (August) | **Category 4 — Upstream Planning or Reporting Variance** | The stored payroll header reports 429 employees, while the itemized payslip dataset contains 424 employees. This produces an unexplained header-to-roster headcount difference of five. The available evidence does not independently establish that these represent approved budgeted vacancies.<br>`Budgeted-vacancy explanation: NOT VERIFIED` | **BLOCKED:** Requires formal signed approval of Policy A and Policy C. |
| `PR-2026-09` (September) | **Category 4 — Upstream Planning or Reporting Variance** | The stored payroll header reports 444 employees, while the itemized payslip dataset contains 441 employees. This produces an unexplained header-to-roster headcount difference of three. The available evidence does not independently establish that these represent approved budgeted vacancies.<br>`Budgeted-vacancy explanation: NOT VERIFIED` | **BLOCKED:** Requires formal signed approval of Policy A and Policy B. |

---

## 3. Architecture of the Correction Engine (Prepared but Gated)

A robust backend architecture was previously established in Step 1 and Step 2A to support audited corrections once authorized:

1. **`PayrollAdjustment` Ledger Model:**
   - Supports immutable, auditable adjustment entries linked to a `payrollRunId`.
   - Records `adjustmentType`, `amountPaise`, `reason`, `proposedById`, `approvedById`, `status`, and `auditReference`.
2. **Maker-Checker Separation of Duties:**
   - The user who proposes a correction voucher cannot approve or execute it (`proposedById !== approvedById`).
3. **Point-in-Time Snapshot Isolation:**
   - Reads original values and applies adjustments within a single serializable Prisma transaction (`prisma.$transaction`).
4. **Optimistic Concurrency Guards:**
   - Protects against simultaneous duplicate approvals.

---

## 4. Execution Roadmap (Frozen at Gate 1)

If and only if written corporate executive approval is granted by the CFO, Controller, and Compliance:
1. **Stage 1 (Policy Sign-Off):** Document signatures on Policies A through E.
2. **Stage 2 (Voucher Proposal):** A financial analyst proposes adjustment entries in `PayrollAdjustment` for PR-2026-08 (-₹837,598.52 gross) and PR-2026-09 (-₹358,328.51 gross).
3. **Stage 3 (Dual-Control Approval):** An independent Finance Manager approves the vouchers.
4. **Stage 4 (Atomic Posting):** Database updates execute in a single Prisma transaction with full audit logging.

### **GOVERNANCE GATE 1 STATUS:**
# **`GATE 1: LOCKED — NO FINANCIAL EXECUTION AUTHORIZED`**
**ZERO DATABASE MUTATIONS EXECUTED.**
