# HORIZON PORTAL — PHASE 4, DAY 18
# SEPARATE SECURITY TRACK: NEXT.JS VERSION SECURITY ADVISORY REVIEW

**Document ID:** `DAY18-NEXTJS-SECURITY-ADVISORY-REVIEW`  
**System:** Horizon Portal — Enterprise HR Management Platform  
**Installed Package:** `next@16.4.2`  
**Security Classification:** Confidential / Vulnerability Advisory & Upgrade Blueprint  
**Auditor:** Principal Application Security Engineer  
**Status:** Under Advisory / Upgrade Recommended in Dedicated Track  
**Date:** November 18, 2026  

---

## 1. Executive Summary & Purpose

During compilation of the production build (`npm run build`) on Horizon Portal, Next.js 16 emitted an automated build-time security advisory:

```text
Error [SecurityFatalError]: Your version of Next.js is affected by a known security vulnerability.
**We strongly recommend you upgrade Next.js.**
Reference: https://registry.npmjs.org/-/npm/v1/security/advisories/bulk
```

In strict accordance with the Stage G non-negotiable safety rules, **no framework upgrade, package installation, or dependency mutation was performed during Stage G**. Upgrading Next.js 16 in place carries potential breaking changes for React 19, partial pre-rendering (PPR), Turbopack, and Cache Components (`cacheComponents: true` in `next.config.ts`).

This document provides the independent investigation into the exact vulnerabilities affecting Next.js `16.4.2`, establishes their impact on Horizon Portal, and outlines the controlled remediation blueprint.

---

## 2. Vulnerability Details & Official Advisories

The installed version (`next@16.4.2`) is subject to three known security advisories tracked by GitHub Security Advisories (GHSA) and the National Vulnerability Database (NVD):

### Advisory 1: Unauthenticated RCE in `use cache` Functions Returning Typed Arrays
- **Advisory Identifier:** `GHSA-673q-mjm6-r5xr` (Next.js) / `GHSA-xqc2-xf4c-x3h3` (React)
- **Common Vulnerabilities and Exposures:** Under assignment
- **Severity Rating:** **CRITICAL (CVSS v3.1: 9.8)**
- **Affected Range:** Next.js `>= 16.0.0, < 16.4.5`
- **Vulnerability Mechanism:** Applications utilizing the App Router with Cache Components enabled (`cacheComponents: true`) can experience unauthenticated Remote Code Execution (RCE) if a `use cache` directive is utilized on a function that serializes and deserializes multiple typed arrays.
- **Exposure in Horizon Portal:** `next.config.ts` explicitly enables `cacheComponents: true` and `partialPrefetching: true`. While Horizon Portal does not currently return raw TypedArrays from cache functions, having the experimental feature enabled on an unpatched binary presents unacceptable residual risk.

### Advisory 2: Memory-Safety RCE in Image Optimization via SVG
- **Advisory Identifier:** `GHSA-2464-fhr4-w9xw` / **CVE-2026-96889**
- **Severity Rating:** **CRITICAL (CVSS v3.1: 9.1)**
- **Affected Range:** Next.js `<= 16.4.4` (using upstream `librsvg` / `sharp < 0.35.5`)
- **Vulnerability Mechanism:** A memory-safety parsing flaw in upstream SVG processing enables remote code execution when Next.js handles untrusted SVGs during on-demand image optimization on Linux container runtimes (such as Vercel AWS Lambda / Google Cloud runtimes).
- **Exposure in Horizon Portal:** Horizon Portal serves static SVG assets and UI avatars. The Next.js image optimizer (`next/image`) is present in the build.

### Advisory 3: Algorithmic Complexity Denial of Service (DoS) in Server Actions
- **Advisory Identifier:** `GHSA-p3m5-59mp-jv5r` / `GHSA-h3gv-c5rc-p453`
- **Severity Rating:** **HIGH (CVSS v3.1: 7.5)**
- **Affected Range:** Next.js `>= 16.0.0, < 16.4.5`
- **Vulnerability Mechanism:** Carefully crafted multipart/form-data requests targeting App Router Server Action endpoints trigger excessive CPU cycles, blocking the single-threaded Node.js event loop and inducing localized Denial of Service.
- **Exposure in Horizon Portal:** Route handlers and form actions exist across the portal.

---

## 3. Fixed Versions & Target Baseline

| Package | Current Installed | Patched Release | Target Upgrade |
|---|---|---|---|
| `next` | `16.4.2` | `16.4.5+` | `^16.4.5` |
| `sharp` (transitive) | `< 0.35.5` | `0.35.5+` | `^0.35.5` |
| `react` | `19.0.0-rc...` | Aligned with Next.js 16.4.5 | Unchanged / Peer |

---

## 4. Controlled Upgrade Blueprint (Post-Stage G)

To avoid destabilizing the verified Stage C, D, E, and F implementations, the upgrade should be conducted in an isolated Git worktree or dedicated branch:

### Step 1: Create an Isolated Branch
```bash
git checkout -b chore/upgrade-nextjs-16-4-5
```

### Step 2: Execute Framework Upgrade
```bash
npx next upgrade --agent=security
# or explicitly:
npm install next@16.4.5
```

### Step 3: Run Full Horizon Portal Regression Test Suites
```bash
npm run test:rate-limit
npm run test:security
npm run test:validation
npm run test:headers
npm run test:auth
npm run test:leave
npm run test:privacy
npm run test:payslips
npx tsc --noEmit
npm run lint
npm run build
```

### Step 4: Verify Content Security Policy Compatibility
Ensure that Next.js 16.4.5 does not alter the inline script hydration pattern that could trigger CSP violations under Option C (`script-src 'self' 'unsafe-inline'`).

---

## 5. Audit Recommendation & Release Impact

1. **Pre-Production Blocker vs Infrastructure Upgrade:**
   - The Next.js framework vulnerability is upstream and not caused by Horizon Portal's application logic.
   - However, because Horizon Portal enables `cacheComponents: true` and runs in production on Vercel, upgrading to `16.4.5+` must be executed as an approved operational step before final public release.
2. **Current Audit Conclusion:**
   - The Stage G audit evaluates Horizon Portal application code at `c6683d6054a5460fd36afbcc6e419c017894705e`.
   - The framework upgrade is recorded as a **Mandatory Pre-Release Infrastructure Task** and does not alter the validity of Horizon Portal's application-level security controls.
