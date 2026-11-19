# GATE-5.2.2-R — DEPLOYMENT IDENTITY VERIFICATION REPORT
## HORIZON PORTAL — PREVIEW RUNTIME IDENTITIES & DIAGNOSTICS AUDIT

---

## 1. RUNTIME INFRASTRUCTURE IDENTITIES

| Identity Dimension | Production Reality | Preview Target Specification | Current Status |
|---|---|---|---|
| **Vercel Project** | `horizon-portal` | `horizon-portal` | Verified |
| **Git Branch** | `main` | `day18-preview-validation` | Verified |
| **Commit SHA** | `c6683d6054a5460fd36afbcc6e419c017894705e` | `ab466e84e778cc20f1bb77b4c82e56967436c2c7` | Verified |
| **Neon Compute Endpoint** | `ep-broad-hall-b3dtqwdp` | Dedicated Preview Endpoint ID | Pending Owner Binding |
| **Neon Database** | `neondb` | `neondb` | Expected Target |
| **Redis Database** | Upstash Primary Cluster | Dedicated Upstash Preview Cluster | Pending Owner Binding |
| **Redis Keyspace** | `rl:auth` | `rl:preview:auth` | **PASS (Active in code)** |

---

## 2. RUNTIME FAIL-CLOSED DIAGNOSTIC SAFEGUARDS

To verify that the deployed Preview application never silently connects to Production:

1. **Host Fingerprint Interception:**
   - `src/lib/prisma.ts` inspects the active `DATABASE_URL` during client creation.
   - If `process.env.VERCEL_ENV === "preview"` and the connection string contains `ep-broad-hall-b3dtqwdp`, a fatal exception is thrown.
   - If `process.env.EXPECTED_PREVIEW_ENDPOINT` is configured, any connection string that does not match this endpoint is rejected with a fatal error.
2. **Missing Credential Interception:**
   - If `process.env.VERCEL_ENV === "preview"` is missing `DATABASE_URL`, execution halts immediately rather than falling back to defaults.
3. **Migration Direct URL Interception:**
   - `prisma.config.postgresql.ts` verifies that `DIRECT_URL` does not target `ep-broad-hall-b3dtqwdp` during Preview workflows.

---

## 3. AUDIT CONCLUSION

- The application code enforces deterministic fail-closed isolation.
- Actual cloud runtime identity verification requires owner completion of the Vercel dashboard variable binding.
- Until verified on cloud, the gate status is **CONDITIONAL PASS**.
