# Treasury & Commercial Banking Evidence Vault

**Vault Category:** Treasury, Cash Management & Commercial Banking  
**Designated Location:** `04_Evidence_Intake/Banking/`  
**Governing Policy:** Policy E (`docs/DAY11-STAGE3-POLICY-E-AUDIT-ACCOUNTING-AND-SETTLEMENT-EVIDENCE.md`)  
**Designated Submitting Authority:** Corporate Treasurer (`TREAS-CORP`) / Commercial Bank Clearing Operations  
**Designated Reviewers:** Corporate Treasurer, Financial Controls Specialist (`PROPOSED — FORMAL APPOINTMENT NOT VERIFIED`), Head of Internal Audit (`PROPOSED — FORMAL APPOINTMENT NOT VERIFIED`)

---

## 1. Scope & Target Artifacts

This vault holds third-party proof of cash disbursement from commercial bank accounts and individual employee clearing records.

| Artifact ID | Artifact Description | Expected Filename Convention | Required Period | Required Data Fields | Current Status |
|---|---|---|---|---|---|
| **EVID-BNK-01** | Commercial Bank Account Statements (Consolidated Debits) | `commercial_bank_statements_FY25_26.pdf` | Apr 2025 – Sep 2026 (18 Months) | Cleared debit dates, transaction descriptions, debit amounts, closing balances, bank routing codes. | `NOT_PROVIDED` |
| **EVID-BNK-02** | Beneficiary Payment Instruction, Clearing and Settlement Reconciliation Records | `beneficiary_payment_reconciliation_records.csv` | Apr 2026 – Sep 2026 (Runs 13–18; 2,469 Payslips) | 14 mapping fields: Payslip ID, employee ref, run ID, payment attempt ID, bank UTR reference (bank-specific format), payment amount in paise, instruction date, bank processing date, value date, native bank status, reversal ref, retry ref, project settlement classification, statement ref (`EVID-BNK-01`). Bank records $\ne$ payslip count. | `NOT_PROVIDED` |
| **EVID-BNK-03** | Treasury Returned / Bounced Payment Exception Records (Compound Provenance) | `treasury_returned_payment_logs.csv` | Apr 2025 – Sep 2026 (18 Months) | Bank return advice notices, `BANK-SPECIFIC RETURN / REJECTION REASON CODES — FORMAT AND DEFINITIONS PENDING ISSUING BANK DOCUMENTATION`, reversal credit dates, re-credit amounts, matching employee payslips, and treasury reconciliation log. | `NOT_PROVIDED` |
| **EVID-BNK-04** | Corporate Treasurer Banking Model Formal Sign-Off | `treasurer_banking_model_signoff.pdf` | Permanent Operating Policy | Formal written determination adopting the hybrid settlement evidence model (batch debit + UTR). | `NOT_PROVIDED` |

---

## 2. Inviolable Banking Evidence Invariants

1. **Database Status is Not Cash Disbursement:** An internal database value of `'PAID'` in `payroll_runs.status` does **not** prove cash left company accounts or was received by employees.
2. **Batch Debit is Not Individual Beneficiary Receipt & Traceable Reconciliation Mandate:** Consolidated debit statements (`EVID-BNK-01`) prove corporate account debits, but payment reconciliation records (`EVID-BNK-02`) from commercial disbursement bank clearing networks (NEFT/RTGS/IMPS) are required to establish traceable outcomes for every one of the 2,469 payslips (Runs 13–18). However, the number of bank transaction records is not assumed to equal the payslip count (due to retries, rejects, returns, or multiple attempts). Furthermore, UTR references alone do not prove beneficiary receipt without confirming absence of return logs in `EVID-BNK-03`. UTR formats must be validated against issuing bank technical documentation (no universal length or regex assumption).
3. **Compound Provenance of Return Logs (`EVID-BNK-03`):** Returned payment logs cannot be classified as purely external bank records if only an internal register is provided. Submission requires both the original commercial bank return advices/reversal credits and the internal treasury reconciliation log. Absence from a return log does not prove settlement unless register completeness and source coverage are independently established.
4. **Execution Protocol:** Execute SOP 2 in [`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md).

---

## 3. Current Vault Status

```
STATUS: EMPTY — NO PHYSICAL ARTIFACTS SUBMITTED
All artifacts (EVID-BNK-01 through EVID-BNK-04) remain NOT_PROVIDED.
Do not insert synthetic bank statements or simulated UTR numbers.
```

