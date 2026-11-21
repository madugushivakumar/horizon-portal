# Lifecycle Staging: Rejected or Superseded Evidence Vault

**Lifecycle States:** `REJECTED` or `SUPERSEDED`  
**Location:** `04_Evidence_Intake/Rejected_or_Superseded/`  
**Purpose:** Audit repository for submitted files that failed verification criteria (e.g., date mismatch, mathematical variance, unverified signature) or that have been replaced by a more authoritative version.  

---

## 1. Operating Rules

1. **Rejection Logging:**
   - Any file rejected during verification must be preserved here with a detailed rejection memorandum explaining the exact cause of failure (e.g., missing period, failed tie-out, broken digital signature).
   - Rejection status must be recorded in `EVIDENCE-INTAKE-TRACKER-TEMPLATE.csv`.
2. **Supersession Logging:**
   - When an updated or amended artifact is submitted by an issuing authority, the previous version is moved here with a pointer to the superseding artifact ID and timestamp.
3. **Audit Trail Mandate:**
   - Never delete rejected or superseded files. Statutory audit requires complete preservation of all submitted candidate records and their rejection rationales.

---

## 2. Current Status

```
STATUS: EMPTY — NO REJECTED OR SUPERSEDED ARTIFACTS
Zero artifacts have been rejected or superseded.
```

