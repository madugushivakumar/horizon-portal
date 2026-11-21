# GATE 5.2 — VERCEL PREVIEW ENVIRONMENT ISOLATION AUDIT

**Project:** Horizon Portal  
**Branch:** `day18-preview-validation`  
**Deployment Target:** Vercel Preview  
**Date:** November 19, 2026  
**Auditor:** Senior DevOps Engineer & Cloud Infrastructure Auditor  

---

## 1. Vercel Project & Deployment Identity

- **Project Name:** `horizon-portal`
- **Team / Scope:** `shivakumarmudiraj565-5361s-projects`
- **Active Preview Deployment:** `HeSpKdRMkpZtUQaBsrE9sTtRzpPW`
- **Commit SHA:** `ab466e84e778cc20f1bb77b4c82e56967436c2c7`
- **Preview Host:** `horizon-portal-git-d-fa3be3-shivakumarmudiraj565-5361s-projects.vercel.app`
- **Production Reference:** `horizon-portal-sigma.vercel.app`

---

## 2. Environment Variable Scoping Matrix

To achieve complete runtime isolation, Vercel environment variables must be segmented as follows:

| Variable Name | Production Scope | Preview Scope | Validation Rule |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Production pooled string (`ep-broad-hall-b3dtqwdp`) | Dedicated Preview pooled string (`ep-preview-...`) | **STRICTLY SEPARATED** |
| `DIRECT_URL` | Production direct string (`ep-broad-hall-b3dtqwdp`) | Dedicated Preview direct string (`ep-preview-...`) | **STRICTLY SEPARATED** |
| `AUTH_SECRET` | Production secret key | Dedicated Preview secret key (or shared preview secret) | Active |
| `NEXTAUTH_SECRET` | Production secret key | Dedicated Preview secret key | Active |
| `NEXTAUTH_URL` | `https://horizon-portal-sigma.vercel.app` | Dynamic / Vercel Preview URL | Dynamic resolution |
| `UPSTASH_REDIS_REST_URL` | Production Upstash REST URL | Preview Upstash REST URL (Shared cluster safe via prefix) | Active |
| `UPSTASH_REDIS_REST_TOKEN` | Production Upstash Token | Preview Upstash Token | Active |
| `NEXT_PUBLIC_APP_ENV` | `production` | `preview` | Runtime guard |

---

## 3. Scope Isolation Audit Findings

1. **Gate 5.1 Baseline Discovery:**
   - In Gate 5.1, `DATABASE_URL` was configured with checkboxes for both "Production" and "Preview", directing all traffic from both environments into the single production compute node `ep-broad-hall-b3dtqwdp`.
2. **Gate 5.2 Remediation Status:**
   - The repository owner must execute the scoping separation in the Vercel Dashboard as described in `GATE52-MANUAL-CREDENTIAL-AUTHORIZATION-GUIDE.md`.
   - Until Vercel variable scoping is confirmed via redeployment, all live mutation tests remain BLOCKED against the preview deployment URL to ensure Production safety.
