# EVIDENCE RECEIPT & CHAIN OF CUSTODY FORM (TEMPLATE)

**Project:** Aura Workforce by Growmar — Horizon Portal  
**Document ID:** `04_Evidence_Intake/EVIDENCE-RECEIPT-AND-CHAIN-OF-CUSTODY-TEMPLATE.md`  
**Purpose:** Standard Chain of Custody & Verification Form for Individual External Evidence Artifacts  
**Status:** BLANK TEMPLATE — TO BE COMPLETED UPON GENUINE EVIDENCE INTAKE  

---

## 1. Intake Identification & Origin

| Ingestion Field | Record Specification | Actual Record (Populate upon Receipt) |
|---|---|---|
| **Evidence Identifier** | Canonical ID (`EVID-GL-01` to `EVID-GOV-05`) | `[                                  ]` |
| **Artifact Description** | Official descriptive title | `[                                  ]` |
| **Original Filename** | Exact filename as transmitted by source | `[                                  ]` |
| **Actual Receipt Timestamp** | ISO 8601 date, time, and timezone | `[                                  ]` |
| **Issuing Source Organization** | External institution / system of record | `[                                  ]` |
| **Submitting Official / Title** | Submitting executive role and department | `[                                  ]` |
| **Transmittal Vector / Method** | Secure portal, encrypted transfer, physical | `[                                  ]` |
| **Intake Custodian / Receiver** | Individual repository custodian receiving file | `[                                  ]` |
| **File Format & MIME Type** | System format (`.pdf`, `.csv`, `.json`, etc.) | `[                                  ]` |
| **File Size (Exact Bytes)** | Exact byte length on disk | `[                                  ]` |
| **Initial SHA-256 Checksum** | Computed immediately upon deposit | `[                                  ]` |
| **Initial Storage Vault** | Storage path in `04_Evidence_Intake/` | `[                                  ]` |
| **Read-Only Lock Confirmed** | File attribute set to read-only (`true`/`false`) | `[                                  ]` |

---

## 2. Chain of Custody & Access History Log

Every access, replication, or transfer of this evidence file must be recorded below:

| Entry # | Access Timestamp | Operator / Reviewer Name | Role / Department | Action Taken (Inspect, Copy, Hash-Check) | Destination / Working Directory | Checksum Match Confirmed? |
|---|---|---|---|---|---|---|
| 01 | `[YYYY-MM-DD HH:MM]` | `[                    ]` | `[               ]` | File received & cryptographic hash computed | `04_Evidence_Intake/Received/` | `[ YES / NO ]` |
| 02 | `[YYYY-MM-DD HH:MM]` | `[                    ]` | `[               ]` | Transferred working copy to review area | `04_Evidence_Intake/Under_Review/` | `[ YES / NO ]` |
| 03 | `[                ]` | `[                    ]` | `[               ]` | `[                                    ]` | `[                             ]` | `[          ]` |
| 04 | `[                ]` | `[                    ]` | `[               ]` | `[                                    ]` | `[                             ]` | `[          ]` |

---

## 3. Authenticity & Completeness Audit Checklist

The assigned reviewer must complete this checklist against the verification SOP in [`DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md`](file:///c:/Users/Madugu%20Shiva%20Kumar/OneDrive/图片/Desktop/horizon-portal/docs/DAY11-EXTERNAL-EVIDENCE-VERIFICATION-PROCEDURES.md):

- [ ] **Third-Party Institutional Origin:** Verified official origin (ERP export metadata, bank digital signature, or government portal reference).
- [ ] **Reporting Period Completeness:** Covers 100% of the required time range without missing months or truncated pages.
- [ ] **Data Boundary Compliance:** Reconciles against known population (18 runs total; 2,469 payslips and 6 itemized runs where applicable).
- [ ] **Mathematical Equilibrium:** All totals, subtotals, debit/credit balances, and net payroll amounts tie out with 0 unexplained variance.
- [ ] **Specimen Signature Authentication:** Signatures match authorized corporate specimen signature cards on file.
- [ ] **Government Portal Live Cross-Check:** TRRN / CPIN / CIN validated via live query against government portal (if statutory tax artifact).

---

## 4. Verification History & Lifecycle Determinations

| Verification Stage | Reviewer Role & ID | Date Executed | Specific SOP Executed | Technical Outcome / Findings | Resulting Status Classification |
|---|---|---|---|---|---|
| **Initial Technical Audit** | `[                    ]` | `[          ]` | `[                    ]` | `[                                  ]` | `[ RECEIVED / UNDER REVIEW ]` |
| **Secondary Peer Review** | `[                    ]` | `[          ]` | `[                    ]` | `[                                  ]` | `[                         ]` |
| **Final Lifecycle Sign-Off** | `[                    ]` | `[          ]` | `[                    ]` | `[                                  ]` | `[ VERIFIED / REJECTED ]` |

---

## 5. Reviewer Notes & Variance Findings

```
[ Enter detailed reviewer notes, discrepancy schedules, variance calculations, or reconciliation tables here. ]
```

---

## 6. Rejection, Clarification & Supersession History

| Event Type (Rejection / Supersession / Clarification) | Date Logged | Authorizing Official | Specific Deficiency or Reason for Action | Superseding Artifact ID & Hash (if applicable) |
|---|---|---|---|---|
| `[                                              ]` | `[        ]` | `[                  ]` | `[                                     ]` | `[                                            ]` |

---

*Form Template Version 1.0 — Aura Workforce Horizon Portal Evidence Custody Framework.*

