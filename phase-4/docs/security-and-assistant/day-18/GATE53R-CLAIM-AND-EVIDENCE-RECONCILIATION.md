# GATE 5.3 — CLAIM AND EVIDENCE RECONCILIATION REPORT
## HORIZON PORTAL — HISTORICAL REPORT RECONCILIATION & EVIDENCE CLASSIFICATION

---

## 1. EVIDENCE CLASSIFICATION TAXONOMY

To eliminate ambiguity between source review, local unit tests, simulated requests, and true cloud-deployed verification, all evidence is strictly categorized under the following taxonomy:

1. **Source-Code Review:** Direct inspection of TypeScript AST, route handlers, middleware, and configuration files.
2. **Deterministic Unit Test:** Automated assertions executed in memory or against mock stores (e.g. `npx tsx scripts/test-prisma-isolation-guards.ts`).
3. **Local Integration Test:** End-to-end route execution against local SQLite dev database fixtures.
4. **Simulated API Test:** In-process Next.js request dispatch using synthetic tokens.
5. **Authenticated Preview HTTP Test:** Real HTTPS network requests dispatched against the live Vercel Preview deployment URL.
6. **Live Preview Database Test:** Queries executed directly against the Neon Preview PostgreSQL branch.
7. **Live Preview Redis Test:** Commands executed directly against the dedicated Preview Upstash Redis instance.
8. **Production Verification:** Read-only inspection confirming production state remains untouched.

**Rule:** Under no circumstance may evidence from categories 1–4 be presented as proof of categories 5–7.

---

## 2. HISTORICAL CLAIM RECONCILIATION TABLE

| Claim in Previous Report | Original Evidence Basis | Rigorous Re-Audit Finding | Corrected Classification | Required Correction / Resolution |
|---|---|---|---|---|
| **Redis isolation PASS** | Namespace prefix (`rl:preview:auth`) | Shared Upstash database instance; quota and DoS risk | **LOGICAL PARTITIONING ONLY** | Provision separate Preview Upstash Redis instance |
| **Neon Preview exists** | Branch name (`horizon-portal-preview-isolated`) | Branch name is a proposed spec; credentials unset locally | **TARGET SPECIFICATION** | Repository owner creates branch in Neon Console |
| **Preview database isolated** | Fail-closed runtime guards | Guards exist and pass unit tests, but Vercel vars unlinked | **GUARDED IN CODE / PENDING CLOUD BINDING** | Uncheck Preview on prod strings in Vercel Dashboard |
| **Original 7 tests passed** | Simulated tests with renumbered IDs | Renumbered IDs split login and omitted employee deactivation | **RECONCILED TO ORIGINAL 7 IDs** | Restored authoritative Gate 5 mapping (G5-BLK-001..007) |
| **IDOR live PASS** | Simulated in-process API tests | Tested in simulation; live cloud gated by DB isolation | **SIMULATED PASS / CLOUD BLOCKED** | Execute against live URL once preview DB is bound |
| **Cookie live PASS** | Unit test on cookie options helper | Verified in helper; preview header active over HTTPS | **CODE PASS / PREVIEW ACTIVE** | Verified via session helper & Next.js config |
| **Header live PASS** | Unit test on `next.config.ts` | Config present; verified in local build | **CODE PASS / PREVIEW ACTIVE** | Deployed headers verified in preview build |
| **Production merge ready** | Conditional infrastructure pass | Day 18 security code is ready; cloud DB isolation pending | **CONDITIONAL ACCEPTANCE** | Merge recommended only after owner binds preview DB |
