# General Ledger Accounting Evidence Vault

**Vault Category:** General Ledger & ERP Accounting  
**Designated Location:** `04_Evidence_Intake/GL/`  
**Governing Policy:** Policy E (`docs/DAY11-STAGE3-POLICY-E-AUDIT-ACCOUNTING-AND-SETTLEMENT-EVIDENCE.md`)  
**Designated Submitting Authority:** Corporate Controller (`FIN-CTRL`) / Enterprise ERP Administration  
**Designated Reviewers:** Financial Controls Specialist (`PROPOSED — FORMAL APPOINTMENT NOT VERIFIED`), Corporate Controller (`PROPOSED — FORMAL APPOINTMENT NOT VERIFIED`)

---

## 1. Scope & Target Artifacts

This category vault holds official external enterprise General Ledger accounting records extracted directly from the corporate financial system (enterprise ERP systems such as SAP S/4HANA, Oracle Financials, or Microsoft Dynamics Cloud are illustrative examples; actual system identified via export metadata).

| Artifact ID | Artifact Description | Expected Filename Convention | Required Period | Required Data Fields | Current Status |
|---|---|---|---|---|---|
| **EVID-GL-01** | Official Corporate ERP Chart of Accounts | `erp_chart_of_accounts.json` / `.pdf` | Active FY 2025–26 & FY 2026–27 | Account codes, descriptions, hierarchy, wage expense account (mapped from illustrative code `GL-6100`), payroll clearing account (mapped from illustrative code `GL-2100`). | `NOT_PROVIDED` |
| **EVID-GL-02** | Historical ERP GL Trial Balances & Journal Vouchers | `historical_trial_balances_FY25_26.pdf` | Apr 2025 – Sep 2026 (18 Months) | Monthly trial balances, native ERP status mapped to project categories (period status, version, posting status, assurance tier), JV numbers, posting dates, batch references, debit/credit totals. | `NOT_PROVIDED` |
| **EVID-GL-03** | Wage Expense Postings (Payroll Expense Journals) | `wage_expense_postings_Runs13_18.xlsx` / `.pdf` | Apr 2026 – Sep 2026 (6 Itemized Runs) | Line-item debit postings to mapped Wage Expense account (illustratively `GL-6100`), offsetting credits to Payroll Clearing (illustratively `GL-2100`), journal approver IDs. | `NOT_PROVIDED` |

---

## 2. Mandatory Verification Standards

Upon deposit of any GL artifact:
1. **Metadata & Status Verification:** Verify system export metadata, ERP server timestamp, and preserved native ERP status strings mapped to project categories (`CLOSED`, `POST-CLOSING`, `POSTED_FINAL`). If native status cannot be confidently mapped, tag as:
   $$\mathbf{SOURCE\text{-}SYSTEM\ STATUS\ MAPPING\ PENDING\ AUTHORIZED\ ACCOUNTING\ REVIEW}$$
   Do not reject genuine evidence due to ERP-specific terminology differences. (Controller certification is distinct from independent external audit assurance; monthly trial balances are interim management accounts and do not require external auditor engagement).
2. **Account Code Mapping Notice:** `GL-6100` and `GL-2100` are **illustrative/synthetic project placeholder codes**. Engineering does not demand those exact literals from the corporate ERP; the submitter must provide the actual corporate account codes mapped to these functions from `EVID-GL-01`.
3. **Double-Entry Equilibrium & Completeness Caveat:** Confirm double-entry balance tie-out ($\sum \text{Debits} == \sum \text{Credits}$) across all monthly trial balances. Note: Double-entry equilibrium is an arithmetic prerequisite and does **not** autonomously prove:
   - Completeness of payroll interfaces or accruals.
   - Correctness of account classifications or liabilities.
   - Completeness of bank disbursements or statutory tax remittances.
   - Absence of unrecorded or off-ledger liabilities.
   Completeness requires reconciliation against independent bank and statutory records.
4. **Variance Identification:** Compare ERP ledger postings against the known internal net variance of −₹9,014,717.87 across Runs 13–18 to determine whether the variance was recognized externally or remains an unposted internal discrepancy.
5. **Execution Protocol:** Execute SOP 1 in [`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md).

---

## 3. Current Vault Status

```
STATUS: EMPTY — NO PHYSICAL ARTIFACTS SUBMITTED
All artifacts (EVID-GL-01, EVID-GL-02, EVID-GL-03) remain NOT_PROVIDED.
Do not insert synthetic GL exports or mock accounting entries.
```

