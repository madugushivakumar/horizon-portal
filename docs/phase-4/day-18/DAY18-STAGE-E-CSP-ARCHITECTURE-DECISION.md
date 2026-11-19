# HORIZON PORTAL — PHASE 4, DAY 18
# STAGE E: CSP ARCHITECTURE EVALUATION & DECISION RECORD

**Document ID:** `ADR-DAY18-STAGE-E-CSP-001`  
**Date:** November 18, 2026  
**Status:** PROPOSED (Pending Stakeholder Review & Explicit Approval)  
**Authors:** Principal Application Security Engineer, Next.js Infrastructure Architect, Senior QA Engineer  
**Target Application:** Horizon Portal (`horizon-portal`)  
**Deployment Target:** Vercel Production (`https://horizon-portal-sigma.vercel.app`)  

---

## 1. Executive Summary & Context

During the Phase 4 Day 18 independent audit of Stage E (Production Security Headers & Content Security Policy), the initial implementation was evaluated and rejected with a **FAIL** verdict.

Two critical defects were identified:
1. **SEC-E-01 (Fatal Hash Mismatch):** The SHA-256 hash declared in `src/lib/security/headers.ts` (`sha256-7HsLrE5Vi6mu3s9RxWnXPePazDW0CWg58rwzaHd76mo=`) does not match the actual inline theme script in `src/components/ThemeProvider.tsx` (`sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=`).
2. **SEC-E-02 (CSP Level 3 'unsafe-inline' Suppression):** Under W3C CSP Level 2 and Level 3 specifications (§6.7.1.3), user agents **ignore `'unsafe-inline'` whenever a hash-source or nonce-source is present in `script-src`**. Because Next.js App Router relies on **12 distinct inline scripts** per page to deliver React Server Component (RSC) flight payloads (`self.__next_f.push(...)`) and runtime callbacks, adding a static theme script hash caused all Next.js hydration scripts to be blocked by CSP-enforcing browsers.

This Architecture Decision Record (ADR) evaluates the three available architectural pathways (Hash-based CSP, Nonce-based CSP, and Compatible Pure 'unsafe-inline' CSP) against Horizon Portal's actual Next.js 16.4.2 runtime configuration.

---

## 2. Current Architecture & Runtime Configuration

### 2.1 Software Stack
- **Framework:** Next.js `16.4.2` (Next.js App Router)
- **UI Library:** React `19.3.0` (React Server Components, Actions, Streaming Suspense)
- **Language / Typing:** TypeScript 5, Strict mode
- **Bundler / Compiler:** Turbopack / Webpack (`next build --webpack`)
- **Hosting / Edge Environment:** Vercel Serverless / Edge Network

### 2.2 Next.js Rendering & Compiler Flags (`next.config.ts`)
```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { ... },
  async headers() { ... }
}
```
- `cacheComponents: true`: Next.js 16 component-level caching.
- `partialPrefetching: true`: Next.js 16 Partial Prerendering (PPR), generating static HTML shells at build time with dynamic streaming holes filled at runtime.
- Build command: `npm run build:prod` -> `prisma generate --schema=prisma/schema.postgresql.prisma && next build --webpack`.

---

## 3. Evidence from Production Generated HTML

A forensic inspection of the compiled production output was conducted across three distinct route archetypes in `.next/server/app/`:

| Page / Route Archetype | Total `<script>` Tags | External Scripts (`/_next/static/*`) | Inline Scripts Count | Theme Script Present? | RSC Payload Scripts (`__next_f`) |
|---|---|---|---|---|---|
| **`/login`** (Public interactive page) | 23 | 10 | 13 | Yes (218 bytes) | 10 chunks (43 to 5,353 bytes) |
| **`/`** (Root home redirect / landing) | 22 | 9 | 13 | Yes (218 bytes) | 10 chunks (44 to 5,346 bytes) |
| **`/dashboard`** (Authenticated app shell) | 24 | 11 | 13 | Yes (218 bytes) | 10 chunks (45 to 5,357 bytes) |

### 3.1 Forensic Inline Script Breakdown (`/login.html`)
1. **Script #1 (`#hz-theme-script`):**
   - **Content:** `(function(){try{var s=localStorage.getItem('hz-theme');var m=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',(s||( m?'dark':'light'))==='dark');}catch(e){}})();`
   - **Byte Length:** 218 bytes UTF-8
   - **True SHA-256 Digest:** `sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=`
2. **Script #2 (Runtime Performance Marker):**
   - `requestAnimationFrame(function(){$RT=performance.now()});` (57 bytes)
3. **Script #3 (React 19 Suspense Boundary Callback):**
   - `$RX=function(b,c,d,e,f){var a=document.getElementById(b)...}` (214 bytes)
4. **Scripts #4–#13 (Next.js Flight Streaming Payloads):**
   - 10 distinct chunks invoking `self.__next_f.push(...)` transporting serialized React element trees, client component references, and page metadata.
   - **Critical Fact:** The SHA-256 hashes of these payload chunks vary between routes (e.g., chunk #6 in `/login` is `sha256-GXrzRAdmyk8...`, while in `/index` it is `sha256-mVCtCRTM...`, and in `/dashboard` it is `sha256-v8WfS3ei...`).

---

## 4. Evaluation of Architecture Options

### Option A — Static Hash-Based CSP
- **Description:** Retain a hash-based CSP by adding explicit SHA-256 hashes for inline scripts in `script-src`.
- **Feasibility Analysis:**
  - **The Theme Script:** Can be hashed (`sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=`).
  - **Next.js RSC Scripts:** **FATALLY INFEASIBLE.** Next.js App Router emits 10+ dynamic RSC flight payload scripts per page. The content of `self.__next_f.push(...)` depends on the specific page, route parameters, authenticated state, and build hash. It is mathematically and architecturally impossible to maintain a static list of hashes in HTTP response headers that covers dynamic flight payloads across 46 routes.
  - **W3C CSP Level 3 Rule:** Because any hash in `script-src` deactivates `'unsafe-inline'`, all unhashed Next.js payload scripts are blocked, causing total React hydration failure.
- **Verdict for Option A:** ❌ **REJECTED (Technically Infeasible for Next.js App Router).**

---

### Option B — Dynamic Per-Request Nonce-Based CSP
- **Description:** Implement Next.js official cryptographic nonce generation via edge proxy/middleware.
- **Mechanism:**
  1. `src/proxy.ts` generates a cryptographically random nonce per request: `Buffer.from(crypto.randomUUID()).toString("base64")`.
  2. Sets `Content-Security-Policy: ... script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; ...`.
  3. Propagates `x-nonce: ${nonce}` header on the forwarded request.
  4. In `src/app/layout.tsx`, reads `const nonce = (await headers()).get("x-nonce")`.
  5. Passes `nonce` to `<ThemeScript nonce={nonce} />`.
  6. Next.js automatically propagates the request nonce to all runtime scripts, React flight chunks, and client bundles.
- **Feasibility & Tradeoff Analysis:**
  - **Security:** Maximum protection. Eliminates `'unsafe-inline'`. Strict execution control.
  - **Rendering & Cacheability Impact:**
    - Calling `await headers()` in the root layout (`src/app/layout.tsx`) immediately forces **Dynamic Server Rendering** on all routes, converting static routes (`/login`, `/design`, `/`) into dynamic request-bound execution.
    - Directly conflicts with `cacheComponents: true` and `partialPrefetching: true` (PPR) configured in `next.config.ts`, as statically cached HTML shells cannot store per-request dynamic nonces without cache invalidation or hydration mismatch.
    - Requires updating `src/components/ThemeProvider.tsx` to accept and bind the dynamic `nonce` attribute.
  - **Verdict for Option B:** ⚠️ **HIGH SECURITY / HIGHER RUNTIME & CACHING COMPLEXITY.**

---

### Option C — Compatible Hardened Fallback CSP (Pure 'unsafe-inline' without Hashes)
- **Description:** Remove script hashes entirely from `script-src`, relying on `'self'` and `'unsafe-inline'` paired with strict perimeter directives (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, and production `unsafe-eval` exclusion).
- **Mechanism:**
  ```http
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob:;
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  ```
- **Feasibility & Tradeoff Analysis:**
  - **Next.js & React 19 Compatibility:** **100% COMPATIBLE.** Because no hash or nonce is declared in `script-src`, CSP Level 2/3 user agents legitimately honor `'unsafe-inline'`. Both `#hz-theme-script` and all 12 Next.js streaming flight scripts execute without browser interference.
  - **PPR & Caching:** Zero cache invalidation. Compatible with `cacheComponents: true` and `partialPrefetching: true`.
  - **Simplicity & Zero Architecture Risk:** No modification to root layout, no server-rendering conversion, no middleware header forwarding complexity.
  - **Security Posture:**
    - `'unsafe-eval'` is **strictly prohibited in production**, preventing eval-based DOM injection.
    - External script injection is strictly blocked (`script-src` restricts origins to `'self'`).
    - Clickjacking is fully mitigated via `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
    - MIME confusion is mitigated via `X-Content-Type-Options: nosniff`.
    - Base tag hijacking and external form action redirects are strictly blocked (`base-uri 'self'`, `form-action 'self'`).
    - *Residual Risk:* Permits inline `<script>` tags, meaning reflected or stored HTML injection could execute JavaScript if an attacker bypasses React JSX escaping (which automatically escapes text).
  - **Verdict for Option C:** ✅ **STRONGLY RECOMMENDED FOR STAGE E.**

---

## 5. Architectural Comparison Matrix

| Evaluation Criterion | Option A (Static Hash) | Option B (Request Nonce) | Option C (Pure 'unsafe-inline') |
|---|---|---|---|
| **Theme Script Execution** | ❌ Blocked (hash mismatch) | ✅ Authorized via nonce | ✅ Authorized via `'unsafe-inline'` |
| **Next.js RSC Hydration** | ❌ Blocked by CSP Level 3 | ✅ Authorized via nonce | ✅ Authorized via `'unsafe-inline'` |
| **React 19 Streaming** | ❌ Blocked by CSP Level 3 | ✅ Authorized via nonce | ✅ Authorized via `'unsafe-inline'` |
| **Next.js PPR / Caching** | ⚠️ Static headers only | ❌ Incompatible (forces dynamic render) | ✅ 100% Compatible |
| **External Script Lockdown**| ✅ Restricted to `'self'` | ✅ Restricted to `'self'` / strict-dynamic | ✅ Restricted to `'self'` |
| **`unsafe-eval` Protection**| ✅ Excluded in prod | ✅ Excluded in prod | ✅ Excluded in prod |
| **Vercel Edge Compatibility**| ✅ High | ⚠️ Requires edge header rewrite | ✅ High |
| **Code Modification Scope** | 2 files (`headers.ts`, tests) | 5+ files (`headers.ts`, `proxy.ts`, `layout.tsx`, `ThemeProvider.tsx`, tests) | 2 files (`headers.ts`, tests) |
| **Acceptance Feasibility** | ❌ Impossible (Broken app) | ⚠️ High effort & regression risk | ✅ Safe, reliable, fully testable |

---

## 6. Recommended Approach & Action Plan

### Recommendation: **Adopt Option C (Compatible Hardened Fallback CSP)** for Stage E remediation.

**Justification:**
1. **Preserves Application Functionality:** Eliminates the fatal hydration blocker (SEC-E-02) and theme script failure (SEC-E-01) with zero risk of breaking Next.js 16 Partial Prerendering or React 19 streaming chunks.
2. **Maintains Strong Defense-in-Depth:** Retains `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, production HTTPS upgrade, and strictly blocks `unsafe-eval`.
3. **Zero Invasive Code Surgery:** Avoids converting the entire application layout to dynamic server rendering (`await headers()`), preserving Horizon Portal's production performance profile and Vercel edge caching.
4. **Future-Proof Roadmap:** Option B (per-request nonce) can be evaluated in a future architectural sprint if corporate governance mandates eliminating `'unsafe-inline'`.

---

## 7. Scope of Remediation (Phase E3 - Upon Approval)

If Option C is approved, implementation will be strictly confined to:
1. `src/lib/security/headers.ts`:
   - Remove `THEME_SCRIPT_HASH` from production `script-src` directives.
   - Set `script-src: ["'self'", "'unsafe-inline'"]` (plus `'unsafe-eval'` in development only).
   - Evaluate HSTS `includeSubDomains` for deployment safety.
2. `next.config.ts` & `src/proxy.ts`:
   - Verify single-policy consistency across application and proxy layers.
3. `scripts/test-day18-security-headers.ts`:
   - Replace circular hash checks with independent assertions:
     - Verify `script-src` authorizes inline scripts via `'unsafe-inline'` without hash suppression.
     - Verify `script-src` strictly excludes `'unsafe-eval'` in production.
     - Verify HTML script compatibility against compiled output.
4. Documentation:
   - Produce `docs/phase-4/day-18/DAY18-SECURITY-HEADERS-CSP-REMEDIATION-REPORT.md`.

---

## 8. Explicit Stop Notice

**PHASE E1 IS COMPLETE.**  
No code modifications have been made.  
Awaiting stakeholder review and explicit approval of this Architecture Decision Record before proceeding to Phase E3 (Implementation).
