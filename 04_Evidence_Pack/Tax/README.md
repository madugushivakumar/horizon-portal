# Statutory Tax Remittance Evidence Vault

**Vault Category:** Statutory Compliance & Tax Remittance  
**Designated Location:** `04_Evidence_Intake/Tax/`  
**Governing Policy:** Policy E (`docs/DAY11-STAGE3-POLICY-E-AUDIT-ACCOUNTING-AND-SETTLEMENT-EVIDENCE.md`)  
**Designated Submitting Authority:** Head of Tax Operations (`TAX-HEAD`) / Statutory Portals (EPFO, ESIC, Income Tax TRACES)  
**Designated Reviewer:** Head of Tax Operations (`PROPOSED — FORMAL APPOINTMENT NOT VERIFIED`)

---

## 1. Scope & Target Artifacts

This vault holds official government receipts confirming statutory remittance of employee payroll deductions to statutory authorities.

| Artifact ID | Artifact Description | Expected Filename Convention | Required Period | Required Data Fields | Current Status |
|---|---|---|---|---|---|
| **EVID-TAX-01** | EPFO Electronic Challan cum Return (ECR) & TRRN Receipts | `epfo_ecr_trrn_receipts.pdf` | Apr 2025 – Sep 2026 (Monthly) | 13-digit TRRN, member-wise ECR schedules, 11 contribution dimensions (EE share, ER share, EPS share, pensionable wage, statutory ceiling, member status, age eligibility, admin levies), payment realization timestamp. | `NOT_PROVIDED` |
| **EVID-TAX-02** | ESIC Monthly Contribution Challans & Payment Realization Receipts (`PENDING CONFIRMATION`) | `esic_monthly_challans_receipts.pdf` | Apr 2025 – Sep 2026 (18 Months) | 17-digit ESIC Employer Code, contribution period, covered employee headcount, wage base, contribution amounts (0.75% / 3.25%), challan reference number, bank transaction reference, payment realization date. | `NOT_PROVIDED` |
| **EVID-TAX-03** | Income Tax TDS Form 24Q & ITNS 281 Challans | `tds_form24q_itns281_challans.pdf` | Q1 FY 2025–26 through Q2 FY 2026–27 (6 Quarters) | Provisional receipt numbers, deductee PAN schedules, TDS deducted vs deposited, ITNS 281 challans with BSR codes, tender dates, CINs. | `NOT_PROVIDED` |

---

## 2. Inviolable Statutory Invariants

1. **Statutory Non-Inference:** Statutory tax compliance cannot be assumed from calculated deduction fields (`deductions_pf`, `deductions_tax`) in software payslips. Only government-generated receipts with verified reference numbers constitute valid proof.
2. **Third-Party Live Validation:** Challan reference numbers (TRRN, ESIC Challan Reference, CIN) must be queried and verified against the live government portals (EPFO, ESIC, Income Tax TRACES). Note: "CPIN" is GST terminology; ESIC terminology remains qualified as `OFFICIAL DOCUMENT TERMINOLOGY PENDING SOURCE CONFIRMATION`.
3. **Non-Universal Coverage & Statutory Ceilings:** Statutory coverage under ESIC is subject to a statutory monthly wage ceiling (₹21,000/month). Employees earning above this threshold are legally exempt. Covered headcount on ESIC challans is expected to be less than total payroll run headcount. Reviewers must not assume universal coverage across all payslips.
4. **EPFO Contribution Allocation & Statutory Safeguard:** Contributions under EPF/EPS must be verified from actual member-wise ECR schedules across 11 statutory dimensions (EE share, ER share, EPS share, pensionable salary, statutory wage ceiling, prior membership, excluded employee status, age cutoff $\ge 58$ years, higher-wage arrangements, admin charges, EDLI). Reviewers must not apply simplified formulas as universal acceptance rules. If eligibility or allocation is ambiguous:
   $$\mathbf{STATUTORY\ ELIGIBILITY\ REVIEW\ REQUIRED\ —\ EVIDENCE\ INSUFFICIENT\ FOR\ AUTOMATIC\ CONCLUSION}$$
5. **Execution Protocol:** Execute SOP 3 in [`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md).

---

## 3. Current Vault Status

```
STATUS: EMPTY — NO PHYSICAL ARTIFACTS SUBMITTED
All artifacts (EVID-TAX-01, EVID-TAX-02, EVID-TAX-03) remain NOT_PROVIDED.
Do not insert synthetic tax challans or fabricated statutory receipts.
```

