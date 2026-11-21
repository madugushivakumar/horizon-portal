# 04_Evidence_Intake: Controlled Evidence Intake Workspace

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Phase:** Phase 3 — Teams and Insight  
**Workstream:** Gate 1 Governance Blocker Closure  
**Current Governance State:** `GATE 1 LOCKED — FINANCIAL EXECUTION NOT AUTHORIZED`  
**Stage 4B Status:** `NOT AUTHORIZED`  
**Workspace Status:** `INFRASTRUCTURE ESTABLISHED — NO PHYSICAL EVIDENCE INGESTED`  

---

## 1. Purpose & Scope

This directory (`04_Evidence_Intake/`) serves as the dedicated, segregated, and auditable intake repository for external financial, banking, statutory tax, human resources, and corporate governance evidence required to close Gate 1 prerequisites.

Under Policy E (`docs/DAY11-STAGE3-POLICY-E-AUDIT-ACCOUNTING-AND-SETTLEMENT-EVIDENCE.md`) and standard statutory audit principles, internal database records (`prisma/dev.db`) cannot substantiate third-party financial settlement or regulatory compliance. Genuine primary source artifacts issued by external institutions (enterprise ERP, commercial banks, government tax portals, and corporate board bodies) must be deposited here and verified before Gate 1 can be considered for unlocking.

---

## 2. Directory Architecture

The workspace is organized into **category-specific intake vaults** and **lifecycle-stage staging areas**:

```
04_Evidence_Intake/
├── README.md                                             # This directory specification
├── EVIDENCE-SUBMISSION-GUIDE.md                          # Comprehensive submission & verification guide
├── EVIDENCE-INTAKE-TRACKER-TEMPLATE.csv                  # 14-artifact intake ledger (initial status: NOT_PROVIDED)
├── EVIDENCE-RECEIPT-AND-CHAIN-OF-CUSTODY-TEMPLATE.md     # Individual artifact receipt & custody form
├── GL/                                                   # Category Vault: General Ledger Accounting (EVID-GL-01..03)
│   └── README.md
├── Banking/                                              # Category Vault: Commercial Treasury & Banking (EVID-BNK-01..04)
│   └── README.md
├── Tax/                                                  # Category Vault: Statutory Tax Remittance (EVID-TAX-01..03)
│   └── README.md
├── HR/                                                   # Category Vault: Human Resources Master Data (EVID-HR-02)
│   └── README.md
├── Governance/                                           # Category Vault: Corporate Governance & Audit (EVID-GOV-01, 02, 05)
│   └── README.md
├── Received/                                             # Lifecycle Staging: Newly deposited raw artifacts (read-only)
│   └── README.md
├── Under_Review/                                         # Lifecycle Staging: Artifacts undergoing active verification
│   └── README.md
├── Verified/                                             # Lifecycle Staging: Formally verified artifacts (verified custody)
│   └── README.md
└── Rejected_or_Superseded/                               # Lifecycle Staging: Failed, incomplete, or superseded artifacts
    └── README.md
```

---

## 3. Fourteen Canonical Evidence Artifacts

| Canonical ID | Category | Artifact Name | Primary Issuing Authority | Designated Reviewer | Status |
|---|---|---|---|---|---|
| `EVID-GL-01` | General Ledger | Official Corporate ERP Chart of Accounts | Corporate Controller (`FIN-CTRL`) | Financial Controls Specialist (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-GL-02` | General Ledger | Historical ERP GL Trial Balances & Journal Vouchers | Corporate Controller (`FIN-CTRL`) | Financial Controls Specialist (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-GL-03` | General Ledger | Wage Expense Postings (Mapped Accounts; `GL-6100` Illustrative) | Corporate Controller (`FIN-CTRL`) | Corporate Controller (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-BNK-01` | Banking | Commercial Bank Account Statements (Consolidated) | Corporate Treasurer (`TREAS-CORP`) | Corporate Treasurer (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-BNK-02` | Banking | Beneficiary Payment Instruction, Clearing & Settlement Records | Corporate Treasurer (`TREAS-CORP`) | Financial Controls Specialist (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-BNK-03` | Banking | Treasury Returned / Bounced Payment Records (Bank Advices + Log) | Corporate Treasurer (`TREAS-CORP`) & Commercial Bank | Corporate Treasurer (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-BNK-04` | Banking | Corporate Treasurer Banking Model Formal Sign-Off | Corporate Treasurer (`TREAS-CORP`) | Head of Internal Audit (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-TAX-01` | Statutory Tax | EPFO Electronic Challan cum Return (ECR) & TRRN | Head of Tax Operations (`TAX-HEAD`) | Head of Tax Operations (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-TAX-02` | Statutory Tax | ESIC Monthly Contribution Challans & Receipts (`PENDING CONFIRMATION`) | Head of Tax Operations (`TAX-HEAD`) | Head of Tax Operations (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-TAX-03` | Statutory Tax | Income Tax TDS Form 24Q & ITNS 281 Challans | Head of Tax Operations (`TAX-HEAD`) | Head of Tax Operations (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-HR-02` | HR Master | VP HR Authoritative Status Source Directive | VP of Human Resources (`HR-VPHR`) | Corporate Controller (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-GOV-01` | Governance | Corporate Policy Voting Artifacts (Policies A–E) | Corporate Governance Committee | Head of Internal Audit (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-GOV-02` | Governance | Signed Joint Monetary Threshold Determination Paper | Controller & CFO (`FIN-CTRL`/`CFO`) | Head of Internal Audit (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |
| `EVID-GOV-05` | Governance | Independent Audit Committee Concurrence Record | Audit Committee Chair (`AUD-COMM`) | Governance Committee (`PROPOSED — NOT VERIFIED`) | `NOT_PROVIDED` |

---

## 4. Invariant Evidentiary Rules

1. **No Synthetic Evidence:** Do not place synthetic, mock, sample, or placeholder data into this workspace that could be mistaken for authentic evidence.
2. **Immediate Cryptographic Checksum:** Calculate SHA-256 immediately upon receipt and log in `EVIDENCE-INTAKE-TRACKER-TEMPLATE.csv`.
3. **Original Immutability:** Deposited raw files must be marked read-only. Working copies must be created for analysis.
4. **Data Privacy & PII Protection:** Do not commit confidential employee bank account numbers, PANs, Aadhaar numbers, or corporate bank statements to public Git remotes. Keep raw artifacts strictly untracked and protected under enterprise access controls.
5. **Separation of Custody:** The presence of a file does **not** equal verification. Verification requires independent mathematical tie-out and human reviewer sign-off under [`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md).

---

*End of Evidence Intake Workspace Specification.*

