# DAY 11 — EXTERNAL EVIDENCE VERIFICATION PROCEDURES
## Aura Workforce by Growmar — Horizon Portal
### Phase 3 — Teams and Insight | Day 11: Admin Payroll Run Console
### Post Gate 1 Quality Control | Step-by-Step Evidence Verification Procedures

---

## Document Metadata

| Attribute | Specification |
|---|---|
| **Document ID** | `DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES` |
| **Document Title** | Standard Operating Procedures for Independent Human Verification of External Financial Evidence |
| **Project & Phase** | Aura Workforce by Growmar — Horizon Portal / Phase 3 — Day 11 |
| **Governing Baseline** | Policy E (`DAY11-STAGE3-POLICY-E-*`), Evidence Tracker (`DAY11-EXTERNAL-EVIDENCE-COLLECTION-TRACKER.md`) |
| **Execution Mode** | Evidentiary Verification Specification (Strictly Read-Only Documentation) |
| **Evidence Categories** | **5 Core Pillars** (General Ledger, Treasury/Banking, Statutory Tax, HRMS, Corporate Governance) |
| **Auditor Invariant** | Verification must be performed by human reviewers; zero automated or self-attested approvals |
| **Gate 1 Status** | **`GATE 1: LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`** |
| **Stage 4B Status** | **`STAGE 4B: NOT AUTHORIZED`** |
| **Date of Execution** | November 7, 2026 |

---

## 1. Executive Summary & Verification Standards

This document establishes the official **Standard Operating Procedures (SOP)** for human reviewers, financial controllers, internal auditors, and systems engineers verifying external evidentiary artifacts submitted to Horizon Portal.

### Mandatory Verification Principles:
1. **Third-Party Primary Substantiation:** Internal application reports, database tables, or JSON seeds cannot substantiate external transactions. Evidence must originate from authoritative external enterprise platforms (SAP/Oracle ERP, Commercial Banks, RBI Clearing, EPFO/ESIC/Income Tax portals).
2. **Negative Proof Invariant:** The presence of `'PAID'` in a database table or batch debit on a bank statement does **not** prove individual employee receipt of funds without beneficiary credit UTR manifests.
3. **Statutory Non-Inference:** Statutory tax compliance cannot be declared based on calculated deductions; official government payment receipts with unique challan numbers (TRRN, CPIN, CIN) are strictly mandatory.
4. **No Unsigned Governance:** Unsigned drafts, mock schemas, or proposed policies cannot be treated as binding corporate procedure.

---

## 2. Category 1: General Ledger Accounting Evidence Verification SOP

### 2.1. Target Artifacts:
- `EVID-GL-01`: Official Corporate ERP Chart of Accounts
- `EVID-GL-02`: Historical ERP General Ledger Trial Balances & Journal Vouchers
- `EVID-GL-03`: Wage Expense Postings (`GL-6100` Payroll Expense Journals)

### 2.2. Step-by-Step Human Verification Procedure:
```text
Step 1: Authenticate Issuing Source
        Confirm artifact is extracted directly from production ERP (SAP S/4HANA / Oracle Cloud ERP)
        and bears an official export header or digital certification by Corporate Controller.

Step 2: Accounting Period Verification
        Verify that trial balances and journal vouchers correspond to the relevant payroll
        periods (Scope note: 18-month coverage is not an approved requirement; reporting
        period requires authorized Controller confirmation — either the 6 discrepancy months
        Apr 2026 – Sep 2026 or all 18 historical months per DAY11-EVIDENCE-REPORTING-PERIOD-CLARIFICATION.md).

Step 3: Account Identifier Validation
        Cross-reference all account numbers against the official ERP Chart of Accounts:
        - Basic & Gross Wages Expense: Verify debit account mapping (e.g., GL-6100 series).
        - Statutory Withholding Liabilities: Verify credit accounts for PF, ESIC, and TDS.
        - Net Salaries Clearing / Payable: Verify credit account for bank disbursement (e.g., GL-2120).

Step 4: Journal Reference & Transaction Audit
        Extract unique ERP Journal Voucher (JV) numbers for each monthly payroll run.
        Verify that journal vouchers are in status "POSTED" and "FINAL" (not parked or draft).

Step 5: Double-Entry Mathematical Tie-Out
        Calculate sum of debits and credits:
        Confirm: Total Debits == Total Credits (Zero paise out-of-balance).
        Compare posted gross wage debit against:
        (a) Itemized Payslip Total: Sum(payslips.gross_pay_paise)
        (b) Batch Header Total: payroll_runs.gross_pay_paise
        Document exact delta.

Step 6: Completeness & Audit Trail Traceability
        Verify that adjusting entries, reversals, or true-up vouchers are linked to original JVs
        with documented business rationale.
```

---

## 3. Category 2: Banking & Treasury Settlement Evidence Verification SOP

### 3.1. Target Artifacts:
- `EVID-BNK-01`: Commercial Bank Account Statements (Consolidated Debits)
- `EVID-BNK-02`: Beneficiary Credit UTR Clearing Numbers (RBI Manifests)
- `EVID-BNK-03`: Treasury Returned / Bounced Payment Exception Logs
- `EVID-BNK-04`: Corporate Treasurer Banking Model Sign-Off

### 3.2. Step-by-Step Human Verification Procedure:
```text
Step 1: Authenticate Bank Source Documentation
        Verify statement originates directly from the corporate operating bank (HDFC, ICICI, SBI).
        Ensure PDF is watermarked/digitally certified by bank or electronic MT940/CAMT.053 file
        matches bank cryptographic signature.

Step 2: Transaction Date & Value Date Alignment
        Compare bank statement debit date against payroll run payment date.
        Verify value date falls within authorized disbursement window (last business day of month).

Step 3: Consolidated Debit Reconciliation
        Match consolidated statement debit amount against payroll run net total:
        Bank Statement Debit == payroll_runs.net_pay_paise (to exact paise).
        If variance exists, inspect bank statement line items for embedded bank charges or bulk fees.

Step 4: Beneficiary Credit UTR Verification (Crucial Anti-Theft Step)
        Ingest clearing manifest from RBI NEFT/RTGS/NACH network.
        Verify each of the 2,469 itemized payslips against the manifest:
        - Beneficiary Account Number (masked last 4 digits match employee profile).
        - Beneficiary IFSC Code matches employee banking master.
        - Beneficiary Credit Amount == payslips.net_pay_paise.
        - UTR Number format matches RBI standards (16 to 22 alphanumeric characters).
        PROHIBITION: NEVER infer beneficiary settlement from consolidated debit alone.

Step 5: Returned & Bounced Payment Analysis
        Inspect Treasury Return Logs for rejected transactions (e.g., account frozen, invalid IFSC).
        Verify that for every bounced transaction:
        - Undisbursed amount is credited to an undisbursed salary escrow liability account.
        - Re-disbursement is cross-referenced with a second valid UTR.

Step 6: Treasury Sign-Off Authentication
        Verify written adoption of hybrid settlement model signed by Corporate Treasurer.
```

---

## 4. Category 3: Statutory & Tax Remittance Evidence Verification SOP

### 4.1. Target Artifacts:
- `EVID-TAX-01`: EPFO Electronic Challan cum Return (ECR) & TRRN Receipts
- `EVID-TAX-02`: ESIC Monthly Contribution Challans & CPIN
- `EVID-TAX-03`: Income Tax TDS Form 24Q Quarterly Returns & ITNS 281 Challans

### 4.2. Step-by-Step Human Verification Procedure:
```text
Step 1: Identify Statutory Authority
        Confirm challan originates from official government portals:
        - EPFO: Unified Employer Portal (epfindia.gov.in)
        - ESIC: ESIC Insurance Portal (esic.gov.in)
        - Income Tax: NSDL / TRACES / e-Filing Portal (incometax.gov.in)
        PROHIBITION: NEVER accept internal HRMS payroll summaries as tax compliance proof.

Step 2: Verify Statutory Remittance Period
        Ensure challan receipt covers the exact wage month for which deductions were withheld.
        Verify deposit date satisfies Indian statutory deadlines:
        - EPFO: Remitted on or before 15th of following month.
        - ESIC: Remitted on or before 15th of following month.
        - TDS (Section 192): Remitted on or before 7th of following month (30th April for March).

Step 3: Challan Identifier & Portal Verification
        - EPFO: Verify 13-digit Temporary Return Reference Number (TRRN) and Challan Receipt Number (CRN).
          Execute TRRN status enquiry on EPFO portal confirming "Payment Confirmed".
        - ESIC: Verify 17-digit Common Portal Identification Number (CPIN) and bank transaction ref.
          Execute CPIN status enquiry confirming "Realized".
        - TDS: Verify Challan Identification Number (CIN) comprising 7-digit BSR code, deposit date,
          and 5-digit challan serial number. Execute OLTAS status enquiry.

Step 4: Mathematical Contribution Tie-Out
        - PF: Verify Challan Total == (Employee PF 12% + Employer PF 3.67% + Employer EPS 8.33% + Admin 0.50%).
        - ESIC: Verify Challan Total == (Employee ESIC 0.75% + Employer ESIC 3.25%).
        - TDS: Verify Form 24Q Annexure Total == Sum(payslips.tax_deductions_paise).

Step 5: Form 24Q Filing Status
        Verify Form 24Q Quarterly Return Provisional Receipt issued by TIN-FC / Protean.
        Confirm zero late-filing fees under Section 234E or interest under Section 201(1A).
```

---

## 5. Category 4: HR Eligibility & Headcount Evidence Verification SOP

### 5.1. Target Artifacts:
- `EVID-HR-01`: Ingested Benchmark Roster (`03_Data_Pack/employees.json`)
- `EVID-HR-02`: Formal VP HR Designation of Authoritative Status Source
- `EVID-HR-03`: Approved Population Taxonomy (Master, Observed, Eligible, etc.)

### 5.2. Step-by-Step Human Verification Procedure:
```text
Step 1: Validate Authority Source Directive
        Inspect formal written directive signed by VP of Human Resources designating the single
        enterprise HRMS of record (e.g., Workday, Darwinbox).
        Confirm directive explicitly binds payroll eligibility to HRMS active status.

Step 2: Effective Date Audit
        Inspect HRMS employee master extract:
        - Verify hire dates are $\le$ period start date for active inclusion.
        - Inspect termination dates: Employees terminated prior to period start must NOT appear in payslips.
        - Inspect leave of absence records: Employees on unpaid leave must reflect 0 payable days or be flagged.

Step 3: Headcount Reconciliation
        Compare HR Master Eligible Count against observed payslip count:
        $\Delta = \text{HR Master Eligible Count} - \text{Observed Payslip Count}$.
        If $\Delta \ne 0$, require employee-by-employee variance ledger explaining each omission.

Step 4: Six-Population Classification
        Assign every employee in `employees.json` to one of 6 mutually exclusive categories:
        1. Master Population (All 441 records in baseline)
        2. Observed Population (Employees with payslips in specific run)
        3. Eligible Active Population (HR confirmed active and entitled to pay)
        4. Paid Population (Net salary disbursed and UTR matched)
        5. Unpaid Eligible Population (Active employee whose payment was withheld)
        6. Terminated / Inactive Population (Former employee not entitled to compensation)
```

---

## 6. Category 5: Corporate Governance & Stakeholder Approval SOP

### 6.1. Target Artifacts:
- `EVID-GOV-01`: Corporate Policy Voting Artifacts (Policies A through E)
- `EVID-GOV-02`: Signed Joint Controller & CFO Monetary Threshold Determination Paper
- `EVID-GOV-03` / `04`: Maker-Checker Empirical Audit & Fail-Closed Remediation Plan
- `EVID-GOV-05`: Independent Audit Committee Concurrence Letter (`COND-16`)
- `EVID-GOV-06`: Cryptographic Baseline Hash Verification

### 6.2. Step-by-Step Human Verification Procedure:
```text
Step 1: Physical Signature & Authority Verification
        Verify that determinations are executed on official letterhead or standardized Template 15.1/15.2.
        Cross-reference signatory against corporate Delegation of Authority to confirm legal standing.
        PROHIBITION: NEVER accept unsigned drafts, mock formats, or AI statements as approval.

Step 2: Quorum Rule & Voting Threshold Verification
        Verify that the applicable corporate governance charter establishing quorum is referenced.
        Confirm voting threshold (e.g., Unanimous, Supermajority) was met during an officially convened meeting.

Step 3: Decision Outcome Code Audit
        Confirm determination is explicitly marked as one of 5 valid codes:
        `APPROVED`, `APPROVED_WITH_CONDITIONS`, `REJECTED`, `DEFERRED`, `RETURNED_FOR_MORE_EVIDENCE`.
        If marked `APPROVED_WITH_CONDITIONS`, verify that every condition is tracked in the Prerequisite Register.

Step 4: Date, Time & Token Sealing
        Verify execution timestamp captures Date, Time, and Timezone.
        Verify that digital verification token ref contains SHA-256 hash of the underlying review pack.

Step 5: Audit Committee Concurrence Verification
        Inspect formal sign-off letter from Independent Audit Committee Chair (`COND-16`).
        Verify letter explicitly concurs with Stage 1–4A findings and Gate 1 lock preservation.
```

---

## 7. Summary & Gate 1 Guard

- **Verification Standard Ready:** Comprehensive, step-by-step human verification procedures established across all 5 evidentiary categories.
- **Gate 1 Status:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED.`
- **Stage 4B Status:** `STAGE 4B NOT AUTHORIZED.`

---

*End of Day 11 External Evidence Verification Procedures.*

