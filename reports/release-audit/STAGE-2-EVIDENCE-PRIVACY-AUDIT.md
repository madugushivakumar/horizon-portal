# Stage 2 — Screenshot, PDF, Evidence and Document Privacy Review Audit Report

**Project:** Horizon Portal  
**Date:** 2026-11-21  
**Auditor:** Principal Software Architect & DevSecOps Engineer  
**Workspace:** `C:\HorizonPortal-Development\horizon-portal`  
**Status:** PASS (Comprehensive Evidence & Privacy Review Complete)

---

## 1. Executive Summary

A complete inventory and privacy audit was performed on all 165 evidence, document, screenshot, and media artifacts across the Horizon Portal repository. 

- **Total Media & Document Files Analyzed:** 165
  - PNG Images: 136
  - PDF Documents: 8
  - SVG Vectors: 20
  - CSV Templates: 1
- **Unique Artifacts (by SHA-256):** 80 (85 files represent redundant or historical stage duplicates)
- **Primary Finding on Phase 4 Reports:**
  - `FullStack_YourName_Phase4_Report.pdf` was determined through binary forensic analysis to be an exact duplicate placeholder of `FullStack_MaduguShivaKumar_Phase4_Report.pdf`, differing by exactly **2 bytes** (internal creation timestamps generated 4 seconds apart by Headless Chrome).
- **Privacy Assessment:** All evaluated screenshots and reports reflect synthetic mock data from the Horizon Portal Data Pack (ZNova / Aura Workforce simulation). No real employee PII, production tokens, browser session cookies, or unauthorized live connection strings were detected.
- **Evidence Pack Inspection:** `04_Evidence_Pack/` contains solely governance templates and intake guidelines with zero actual banking, GL, tax, or payroll customer records.

---

## 2. Priority Phase 4 Screenshot Privacy Inspection

The 7 designated Phase 4 screenshots were evaluated in detail:

| # | Relative Path | Resolution | Format | Size | SHA-256 | Privacy Findings | Classification |
|---|---------------|------------|--------|------|---------|------------------|----------------|
| 1 | `phase-4/reports/day17-evidence/01_production_admin_dashboard.png` | 1440x900 | PNG | 275,141 B | `EFF5CD01E4EE...` | Synthetic admin metrics, mock department counts; no PII | `PUBLIC_SAFE` |
| 2 | `phase-4/reports/day17-evidence/02_production_employee_dashboard.png` | 1440x900 | PNG | 231,668 B | `901E85BB33CF...` | Synthetic employee persona (EMP-0188); mock leave quota | `PUBLIC_SAFE` |
| 3 | `phase-4/reports/day17-evidence/03_production_login_mobile.png` | 390x844 | PNG | 78,480 B | `E2F2DFBE5973...` | Mobile viewport; empty input fields; no credentials | `PUBLIC_SAFE` |
| 4 | `phase-4/reports/day17-evidence/04_production_admin_workforce_directory.png` | 1440x900 | PNG | 237,539 B | `4FC8654E13F2...` | Synthetic employee roster from Data Pack; no real PII | `PUBLIC_SAFE` |
| 5 | `phase-4/reports/task-16/general-faq-conversation.png` | 1440x950 | PNG | 80,841 B | `9BB46FD073D8...` | Conversational HR assistant answering handbook policies | `PUBLIC_SAFE` |
| 6 | `phase-4/reports/task-16/personal-leave-payslip-conversation.png` | 1440x950 | PNG | 80,827 B | `2FCD98E70A79...` | Synthetic leave and self payslip navigation; no breach | `PUBLIC_SAFE` |
| 7 | `phase-4/reports/task-16/unauthorized-salary-refusal.png` | 1440x950 | PNG | 83,773 B | `B756E98A790B...` | Demonstrates security defense: refusal to disclose salary | `PUBLIC_SAFE` |

---

## 3. Forensic PDF Investigation

All 8 committed PDF documents were examined for text, metadata, hidden layers, and binary diffs:

### 3.1 PDF Catalog

| # | Relative Path | Size | SHA-256 | Forensic Assessment |
|---|---------------|------|---------|---------------------|
| 1 | `phase-1/FullStack_MaduguShivaKumar_Phase1_Report.pdf` | 702,560 B | `C9BCD1914B9A...` | Historical Phase 1 Milestone Report |
| 2 | `phase-2/FullStack_MaduguShivaKumar_Phase1_Report.pdf` | 702,560 B | `C9BCD1914B9A...` | Exact byte duplicate of Phase 1 Report |
| 3 | `phase-2/FullStack_MaduguShivaKumar_Phase2_Report.pdf` | 761,364 B | `515EFC03AC43...` | Historical Phase 2 Milestone Report |
| 4 | `phase-3/FullStack_MaduguShivaKumar_Phase3_Report.pdf` | 1,019,577 B | `A4A322DFECFF...` | Historical Phase 3 Milestone Report |
| 5 | `phase-4/FullStack_MaduguShivaKumar_Phase4_Report.pdf` | 473,472 B | `33A4E1C8FD03...` | Phase 4 Submission Report (Root location copy) |
| 6 | `phase-4/reports/phase4/FullStack_MaduguShivaKumar_Phase4_Report.pdf` | 473,472 B | `33A4E1C8FD03...` | Phase 4 Submission Report (Canonical reports location) |
| 7 | `phase-4/reports/phase4/FullStack_YourName_Phase4_Report.pdf` | 473,472 B | `C2ABF629C7A5...` | Template placeholder duplicate (4 sec apart) |
| 8 | `phase-4/reports/consolidated/Horizon_Portal_Consolidated_Project_Report.pdf` | 938,116 B | `C859637D5608...` | Complete 10-page Architecture & Governance Report |

### 3.2 Deep Comparison: `MaduguShivaKumar` vs `YourName` Phase 4 PDFs
- Both files report identical length: `473,472 bytes` (462.38 KB).
- Text extraction across all 3 pages produced zero differences (`Different pages: []`).
- Binary comparison identified exactly **2 differing bytes** across the entire 473 KB payload:
  - Byte 436: Timestamp digit in `/CreationDate` (`17:12:41` vs `17:12:45`)
  - Byte 477: Timestamp digit in `/ModDate` (`17:12:41` vs `17:12:45`)
- **Conclusion:** `FullStack_YourName_Phase4_Report.pdf` was generated as a generic template artifact alongside the named report. It should be excluded from the clean release branch to eliminate redundant confusion.

---

## 4. Complete Repository Evidence Classification

The 165 artifacts across the repository are categorized into the 7 standard audit classifications:

### 4.1 PUBLIC_SAFE (Approved for Release)
- **Application SVGs (20 files):** Next.js icons, Vercel logos, file indicators located in `public/` directories across phases.
- **Phase 4 Visual Proof (7 files):** `phase-4/reports/day17-evidence/*.png` (4) and `phase-4/reports/task-16/*.png` (3).
- **Consolidated Release Report (1 file):** `phase-4/reports/consolidated/Horizon_Portal_Consolidated_Project_Report.pdf`.
- **Phase 4 Author Submission Report (1 file):** `phase-4/reports/phase4/FullStack_MaduguShivaKumar_Phase4_Report.pdf`.
- **Evidence Governance Template (1 file):** `04_Evidence_Pack/EVIDENCE-INTAKE-TRACKER-TEMPLATE.csv`.

### 4.2 DUPLICATE / REDUNDANT (Exclude from Clean Release Branch)
- `phase-4/FullStack_MaduguShivaKumar_Phase4_Report.pdf` (duplicate of canonical file in `phase-4/reports/phase4/`).
- `phase-4/docs/release/v1.0.0/evidence/task-16/*.png` (3 duplicate screenshots of `phase-4/reports/task-16/`).
- Root `reports/day-*-evidence/*.png` (65 screenshots in root `reports/` that duplicate `phase-2/` and `phase-3/`).
- `phase-2/FullStack_MaduguShivaKumar_Phase1_Report.pdf` (duplicate copy in Phase 2 folder).

### 4.3 PLACEHOLDER (Exclude from Clean Release Branch)
- `phase-4/reports/phase4/FullStack_YourName_Phase4_Report.pdf` (redundant generic placeholder).

### 4.4 HISTORICAL_ARCHIVE (Retained in Development Branches, Isolated from Release)
- Historical phase screenshot sets (`phase-2/reports/day-*-evidence/` and `phase-3/reports/day-*-evidence/`) and previous phase PDFs (`Phase1_Report.pdf`, `Phase2_Report.pdf`, `Phase3_Report.pdf`) document past milestone progress and remain preserved in the `day20-final-challenge` branch.

---

## 5. Remediation Plan for Clean Release

1. **Include Only Canonical Phase 4 Evidence in Clean Release:**
   - Retain `phase-4/reports/day17-evidence/` (4 screenshots)
   - Retain `phase-4/reports/task-16/` (3 screenshots)
   - Retain `phase-4/reports/phase4/FullStack_MaduguShivaKumar_Phase4_Report.pdf`
   - Retain `phase-4/reports/consolidated/Horizon_Portal_Consolidated_Project_Report.pdf`
   - Retain `04_Evidence_Pack/` framework templates and markdown guides.
2. **Exclude Redundancies:**
   - Exclude `FullStack_YourName_Phase4_Report.pdf`.
   - Exclude root-level duplicate reports folder (`reports/day-*-evidence`).
3. **Preservation:**
   - All historical files remain intact in the local working copy and the preserved `day20-final-challenge` branch.

---
**Stage 2 Sign-Off:** PASS
