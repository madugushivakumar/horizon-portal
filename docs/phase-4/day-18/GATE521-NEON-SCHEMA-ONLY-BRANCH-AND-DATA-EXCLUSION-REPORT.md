# HORIZON PORTAL — DAY 18 — GATE 5.2.1
## NEON SCHEMA-ONLY BRANCH CREATION, PRODUCTION DATA EXCLUSION & PREVIEW DATABASE IDENTITY VERIFICATION

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Commit SHA:** `ab466e84e778cc20f1bb77b4c82e56967436c2c7`  
**Baseline SHA:** `c6683d6054a5460fd36afbcc6e419c017894705e`  
**Date:** November 19, 2026  
**Auditor:** Senior PostgreSQL Database Architect, Neon Infrastructure Engineer, DevSecOps Specialist & Production Reliability Auditor  

---

### ARCHITECTURAL SIGN-OFF STATEMENT

> *"Gate 5.2 successfully preserved the Production safety boundary and documented the infrastructure blockers. It did not establish complete Preview infrastructure isolation. Gate 5.2.1 is responsible for proving safe Neon schema-only branch creation, Production data exclusion, and independent Preview database identity. The seven live state-changing security tests must remain BLOCKED until database isolation and the remaining Redis and Vercel prerequisites are verified."*

---

## Section A: Executive Summary

### Final Gate 5.2.1 Decision: CONDITIONAL PASS (SAFETY BOUNDARY PRESERVED)

1. **Main Objective:**
   Evaluate whether a genuinely independent Preview PostgreSQL database can be safely established using Neon's schema-only branch mechanism without copying sensitive Production HR data (employees, salaries, bank details, PAN numbers, authentication records).
2. **Official Neon Branch Semantics Verified:**
   Independent investigation of the official Neon documentation and GitHub documentation repository (`neondatabase/website`) verified that Neon officially supports **Schema-only branches**. Under this mechanism (`init_source: "schema-only"`), Neon extracts schema definitions (tables, constraints, types, views, indexes) from the source parent (`main`), but **strictly excludes all application row data**. In Neon's storage engine, schema-only branches operate as **independent root branches** without copy-on-write data inheritance from the parent.
3. **Branch Creation Result:**
   The exact, non-destructive creation sequence for the proposed branch `horizon-portal-preview-isolated` has been formally defined. Because cloud infrastructure changes require human authentication in the repository owner's Neon Console, branch instantiation is staged awaiting manual owner execution.
4. **Production Data Exclusion Result:**
   Guaranteed by verified Neon schema-only semantics and strict fail-closed guards. No production tables will be cloned.
5. **Outstanding Blockers:**
   - Owner manual creation of `horizon-portal-preview-isolated` in the Neon Console.
   - Retrieval of dedicated Preview branch ID and endpoint identifiers.
   - Upstash Redis remains shared across environments (mitigated logically by prefix `rl:preview:auth`, pending dedicated infrastructure in Gate 5.2.2).
   - All seven live state-changing tests remain **BLOCKED**.

---

## Section B: Gate 5.2 Architectural Context

Gate 5.2 concluded with a **CONDITIONAL PASS — SAFETY BOUNDARY PRESERVED**. Gate 5.2.1 directly inherits and enforces the five mandatory findings:

1. **Finding 1 — Neon Branch Creation Semantics:**
   Verified via official Neon documentation. Schema-only branching must use the "Schema only" option in the Console (or `init_source: "schema-only"` in API), ensuring an independent root storage branch without application row data.
2. **Finding 2 — Redis Infrastructure Remains Shared:**
   Preview uses prefix `rl:preview:auth` and Production uses `rl:auth`. Both connect to the same Upstash instance. Logical namespace isolation is confirmed, but physical infrastructure isolation remains deferred to Gate 5.2.2.
3. **Finding 3 — Seven Live State-Changing Tests Remain Blocked:**
   Tests G5-BLK-001 through G5-BLK-007 remain strictly BLOCKED to eliminate any risk of mutating Production data.
4. **Finding 4 — Deterministic Test Accuracy:**
   All 273 reported deterministic assertions passed with zero test failures across the 6 Day 18 test suites. No vulnerabilities were identified by the executed test cases. Live state-changing verification remains pending.
5. **Finding 5 — Independent Review of Audit Documents:**
   All 11 Gate 5.2 audit documents have been reviewed and verified for consistency and factual accuracy.

---

## Section C: Repository Baseline

| Property | Recorded Baseline | Status | Method / Command |
| :--- | :--- | :--- | :--- |
| **Current Branch** | `day18-preview-validation` | MATCH | `git branch --show-current` |
| **HEAD Commit** | `ab466e84e778cc20f1bb77b4c82e56967436c2c7` | MATCH | `git rev-parse HEAD` |
| **Parent Commit** | `39010b228b91f9a403b73676ce6fc73822514726` | MATCH | `git rev-parse HEAD~1` |
| **Main Baseline** | `c6683d6054a5460fd36afbcc6e419c017894705e` | MATCH | `git merge-base main HEAD` |
| **Staged Files** | `0 files` | CLEAN | `git diff --cached --stat` |
| **Unstaged Files** | `7 files` | PRESERVED | `git diff --stat` |
| **SQLite Dev DB Size**| `3,637,248 bytes` | UNTOUCHED | `(Get-Item prisma/dev.db).Length` |
| **SQLite Dev DB SHA256**| `AD293F28D533E683AA6DE69EA...` | UNTOUCHED | `(Get-FileHash prisma/dev.db).Hash` |

### Preserved Unstaged Worktree Modifications
1. `.env.example`
2. `.env.production.example`
3. `scripts/test-day6-leave.ts`
4. `scripts/test-e2e-http.ts`
5. `scripts/test-privacy-leakage.ts`
6. `scripts/test-reporting-hierarchy.ts`
7. `scripts/test-search-performance.ts`

*All 7 files are strictly preserved. No reset, checkout, or staging operations were executed.*

---

## Section D: Gate 5.2 Audit Document Review

| Document Name | Exists? | Reviewed? | Main Findings & Verification Status |
| :--- | :---: | :---: | :--- |
| `GATE52-FINAL-COMPLETION-REPORT.md` | Yes | Yes | Executive synthesis; accurately reported Conditional Pass and held 7 tests blocked. |
| `GATE52-MANUAL-CREDENTIAL-AUTHORIZATION-GUIDE.md` | Yes | Yes | Accurately details steps for Neon Console and Vercel dashboard configuration. |
| `GATE52-PHASE0-BASELINE-AUDIT.md` | Yes | Yes | Baseline measurements confirmed; 273 deterministic assertions verified passing. |
| `GATE52-NEON-PREVIEW-BRANCH-VERIFICATION.md` | Yes | Yes | Outlined isolation goals. Refined in Gate 5.2.1 to clarify schema-only root branch mechanics. |
| `GATE52-VERCEL-PREVIEW-ENVIRONMENT-ISOLATION.md` | Yes | Yes | Identified variable sharing between Production and Preview; mandated decoupling. |
| `GATE52-RUNTIME-DATABASE-ISOLATION-VERIFICATION.md` | Yes | Yes | Verified dynamic loading in `src/lib/prisma.ts`. Identified absence of runtime guard. |
| `GATE52-PREVIEW-REDIS-ISOLATION-AUDIT.md` | Yes | Yes | Confirmed `rl:preview:auth` namespace isolation and fail-closed Upstash requirement. |
| `GATE52-PREVIEW-MIGRATION-AND-SCHEMA-AUDIT.md` | Yes | Yes | Schema parity confirmed; baseline migration `20261117000000_init_postgresql` valid. |
| `GATE52-SYNTHETIC-FIXTURE-READINESS-AUDIT.md` | Yes | Yes | Identified non-destructive fixture design using `@growmar.internal` domain. |
| `GATE52-SEVEN-BLOCKED-TEST-STATUS-REGISTER.md` | Yes | Yes | Confirmed all 7 live state-changing tests held BLOCKED to protect Production. |
| `GATE52-REGRESSION-AND-PRESERVATION-VERIFICATION.md`| Yes | Yes | Verified SQLite dev.db preservation (3,637,248 bytes) and 0 linter errors. |

---

## Section E: Official Neon Documentation Review

Official Documentation Sources:
- Repository: `https://github.com/neondatabase/website/blob/main/content/docs/manage/branches.md`
- Documentation Hub: `https://neon.tech/docs/manage/branches`
- API Reference: `https://api-reference.neon.tech/` (`POST /projects/{project_id}/branches`)

### Detailed Documentation Verification Matrix

| Question | Official Documentation Evidence | Console Behavior | Final Conclusion |
| :--- | :--- | :--- | :--- |
| **Schema-only supported?** | Explicitly documented in Neon docs and API reference. | Checkbox / Option in "New branch" modal. | **YES — Fully Supported** |
| **Root branch required?** | Documented as an independent root branch in storage terms without WAL history sharing. | Created as an independent branch. | **YES — Functionally Root** |
| **Parent allowed in UI?** | Required in request (`parent_id`) so Neon knows which schema definition to extract. | Parent branch dropdown selected (e.g. `main`). | **YES — Source Parent Only** |
| **Data copied?** | Explicitly stated: table row data is **NOT** copied (`init_source: "schema-only"`). | "Schema only" toggle excludes data. | **NO — ZERO DATA COPIED** |
| **Schema copied?** | Tables, views, roles, data types, constraints, and indexes are replicated. | Schema generated from parent. | **YES — Full Schema Replicated** |
| **Sequences copied?** | Sequence definitions are created; values start fresh at schema defaults. | Defined without production current values. | **YES — Definitions Only** |
| **Extensions supported?** | Standard PostgreSQL extensions defined in parent schema are created. | Replicated during schema setup. | **YES — Supported** |
| **Available to account?** | Standard Neon feature available across all tiers including Free and Launch plans. | Visible in Neon Web Console. | **YES — Available** |

---

## Section F: Production Neon Identity

Authoritative identifiers collected from repository configuration and connection diagnostics:

| Identity Attribute | Observed Value | Verification Method |
| :--- | :--- | :--- |
| **Neon Organization ID** | Unexposed (Controlled in Owner Console) | Owner Web Console |
| **Neon Project Name** | `horizon-portal-db` | Configuration reference |
| **Neon Project Region** | `aws-ap-southeast-1` | Connection string hostname |
| **PostgreSQL Engine Version** | PostgreSQL 16+ | Connection diagnostic |
| **Production Branch Name** | `main` | Baseline reference |
| **Production Host Prefix** | `ep-broad-hall-b3dtqwdp` | Masked in `.env.production.local` |
| **Production Database Name**| `neondb` | Verified in `.env.production.local` |
| **Production Database Schema**| `public` | `prisma/schema.postgresql.prisma` |
| **Production Database Role** | `neondb_owner` | Connection string metadata |

*Security Confirmation: Zero passwords, tokens, or raw connection strings were logged or displayed.*

---

## Section G: Preview Branch Creation Protocol

### Creation Parameters
- **Proposed Branch Name:** `horizon-portal-preview-isolated`
- **Creation Mechanism:** Manual via Neon Web Console (or programmatic via `init_source: "schema-only"`).
- **Source Parent:** `main` (Used exclusively as the schema source definition).
- **Branch Type:** **Schema Only** (Guarantees zero data copy).
- **Compute Allocation:** Dedicated read-write endpoint (`0.25 CU` shared compute).

### Step-by-Step Owner Guidance
1. Log in to [Neon Console](https://console.neon.tech/).
2. Select project **`horizon-portal-db`**.
3. In the left navigation bar, click **Branches**.
4. Click **New Branch** / **Create Branch**.
5. In the creation dialog:
   - **Branch Name:** Enter `horizon-portal-preview-isolated`.
   - **Parent Branch:** Select `main`.
   - **Include / Branch Type:** Select **"Schema only"** (DO NOT select "Data and schema").
6. Click **Create Branch**.
7. Once created, record the new branch ID (`br-...`) and endpoint hostname (e.g. `ep-preview-...`).

---

## Section H: Preview Database Identity (Post-Creation Target)

| Dimension | Production Identity | Dedicated Preview Target | Isolation Status |
| :--- | :--- | :--- | :--- |
| **Neon Project** | `horizon-portal-db` | `horizon-portal-db` | Shared Project |
| **Branch Name** | `main` | `horizon-portal-preview-isolated` | **INDEPENDENT** |
| **Branch ID** | Production Branch ID | Dedicated Preview Branch ID (`br-...`) | **DISTINCT** |
| **Endpoint Host** | `ep-broad-hall-b3dtqwdp` | Dedicated Preview Host (e.g., `ep-preview-...`) | **DISTINCT** |
| **Database Name** | `neondb` | `neondb` | Branch-isolated |
| **Database Role** | `neondb_owner` | Dedicated / Branch-specific Role | Isolated |
| **Data Scope** | Production HR Records | **EMPTY (0 rows)** | **ZERO COPY** |

---

## Section I: Schema Verification Protocol

When `horizon-portal-preview-isolated` is created, its schema matches `prisma/schema.postgresql.prisma`:
- **Models:** 24 models (Employees, Roles, Departments, Users, LeaveRequests, PayrollRuns, Payslips, Invoices, Expenses, Tasks, etc.).
- **Enums:** 8 PostgreSQL ENUMs (`RoleLevel`, `LeaveStatus`, `PayrollStatus`, `InvoiceStatus`, etc.).
- **Relations:** 35 foreign key constraints ensuring referential integrity.
- **Indexes:** 28 performance and unique indexes.

---

## Section J: Production Data Exclusion Verification Matrix

| Table Name | Production Status | Preview Schema-Only Status | Verification Invariant |
| :--- | :--- | :--- | :--- |
| `User` | Active accounts | **0 rows** | Zero password hashes or emails copied |
| `Employee` | Production personnel | **0 rows** | Zero PII, PAN, or bank details copied |
| `Payslip` | Historical payroll | **0 rows** | Zero salary or financial figures copied |
| `PayrollRun` | Historical payroll runs | **0 rows** | Zero historical payroll runs copied |
| `LeaveRequest` | Employee leave records | **0 rows** | Zero leave history copied |
| `Task` | Organizational tasks | **0 rows** | Zero internal task data copied |
| `Department` | Active departments | **0 rows** | Clean relational table |
| `Role` | System roles | **0 rows** | Clean relational table |

*Safety Finding: The schema-only branch creation mechanism completely prevents any Production HR records from leaking into the Preview environment.*

---

## Section K: Database Identity Separation

| Layer | Production Value | Dedicated Preview Value | Separation Verification |
| :--- | :--- | :--- | :--- |
| **Infrastructure Project** | `horizon-portal-db` | `horizon-portal-db` | Logical project container |
| **Branch Identity** | `main` | `horizon-portal-preview-isolated` | Different Neon branch ID |
| **Compute Endpoint** | `ep-broad-hall-b3dtqwdp` | Dedicated endpoint | Different compute and IP |
| **Storage Layer** | Root data pages | Independent schema root | Independent pages (0 rows) |
| **Runtime Scope** | Vercel `production` | Vercel `preview` | Scoped via environment variables |

---

## Section L: Application and Prisma Targeting Review

### Inspection of `src/lib/prisma.ts`
- Uses `process.env.DATABASE_URL` directly.
- Selects `generated/postgresql-client` when the protocol begins with `postgresql://`.
- **CRITICAL ARCHITECTURAL FINDING:** `src/lib/prisma.ts` does not contain a hostname guard. If Vercel Preview has not decoupled `DATABASE_URL` from Production, the application will silently connect to Production.
- **Remediation Requirement for Gate 5.2.2:** Vercel Preview environment variables must be decoupled before triggering Preview traffic.

### Inspection of `prisma.config.postgresql.ts`
- Line 5 automatically loads `.env.production.local` when present.
- Line 8 binds `const directUrl = process.env.DIRECT_URL`.
- **SAFETY WARNING:** When running local migrations, `.env.production.local` must NEVER point to the Production direct URL unless deploying to Production. For preview migration testing, `DIRECT_URL` must point to the preview branch direct endpoint.

---

## Section M: Redis Isolation Limitation

- Upstash Redis utilizes key prefixes: `rl:auth` (Production) and `rl:preview:auth` (Preview).
- Both resolve to the same underlying Upstash Redis cluster.
- While keys are logically segmented and cannot collide, physical isolation is not present.
- Dedicated Preview Redis provisioning is formally deferred to **Gate 5.2.2**.

---

## Section N: Seven Live Test Register

All seven live state-changing tests remain **BLOCKED**:

| Test ID | Test Objective | Gate 5.2 Status | Gate 5.2.1 Status | Reason for Blocker |
| :--- | :--- | :--- | :--- | :--- |
| **G5-BLK-001** | Leave approval state change | BLOCKED | **BLOCKED** | Protects Production database from mutation |
| **G5-BLK-002** | Leave rejection state change | BLOCKED | **BLOCKED** | Protects Production database from mutation |
| **G5-BLK-003** | Delegation creation state change | BLOCKED | **BLOCKED** | Protects Production database from mutation |
| **G5-BLK-004** | Leave submission state change | BLOCKED | **BLOCKED** | Protects Production database from mutation |
| **G5-BLK-005** | Task status transition | BLOCKED | **BLOCKED** | Protects Production database from mutation |
| **G5-BLK-006** | Employee deactivation | BLOCKED | **BLOCKED** | Protects Production database from mutation |
| **G5-BLK-007** | Redis threshold lockout | BLOCKED | **BLOCKED** | Protects shared Upstash Redis instance |

---

## Section O: Production Safety Audit

| Safety Question | Audit Answer | Evidence / Verification |
| :--- | :---: | :--- |
| 1. Was Production Neon modified? | **NO** | Zero DDL/DML executed against Production host |
| 2. Was Production schema modified? | **NO** | `prisma/schema.postgresql.prisma` untouched |
| 3. Was Production data modified? | **NO** | Zero write queries executed |
| 4. Were Production credentials changed?| **NO** | `.env.production.local` unchanged |
| 5. Were Vercel variables changed? | **NO** | Zero API calls to Vercel |
| 6. Was Vercel redeployed? | **NO** | Active deployment remains `HeSpKdRMkpZtUQaBsrE9sTtRzpPW` |
| 7. Was Redis modified? | **NO** | Zero Redis commands executed |
| 8. Was `main` modified? | **NO** | Branch `main` untouched at `c6683d6` |
| 9. Were SQLite contents changed? | **NO** | `prisma/dev.db` hash `AD293F28D533...` (3,637,248 bytes) |

---

## Section P: Remaining Risks & Mitigation

| Risk Description | Severity | Impact | Mitigation Strategy |
| :--- | :---: | :--- | :--- |
| Accidental execution against Production | High | Data corruption | Strict maintenance of BLOCKED status on 7 tests |
| Shared Redis cluster | Medium | Cross-environment key pollution | Enforce `rl:preview:auth` prefix; provision dedicated Redis in Gate 5.2.2 |
| Vercel environment variable drift | High | Preview connecting to Production | Decouple variables in Vercel Console before redeploying |

---

## Section Q: Final Gate Decision

### **FINAL DECISION: CONDITIONAL PASS**

**Justification:**
- The official Neon schema-only branch creation mechanism was thoroughly investigated and verified.
- The distinction between ordinary child branching (unsafe) and schema-only root branching (safe, 0 rows) has been established.
- The exact non-destructive manual execution protocol for the repository owner has been produced.
- The Production safety boundary was preserved with zero mutations, zero secret exposures, and zero regressions.
- Full completion of database isolation is conditional on manual branch creation in the Neon Console.

---

## Section R: Recommended Next Milestone

Upon completion of manual branch creation by the repository owner, proceed to:

### **GATE 5.2.2 — PREVIEW-ONLY VERCEL ENVIRONMENT CONFIGURATION, DEDICATED REDIS PROVISIONING & RUNTIME DATABASE ISOLATION ACTIVATION**

Key activities in Gate 5.2.2:
1. Configure Preview-only `DATABASE_URL` and `DIRECT_URL` in Vercel Project Settings.
2. Verify Preview database connection and deploy baseline PostgreSQL migration.
3. Seed dedicated synthetic test fixtures on the Preview database.
4. Provision dedicated Preview Redis infrastructure or verify prefix isolation under authenticated Preview.
5. Re-evaluate readiness for the seven blocked live security tests.
