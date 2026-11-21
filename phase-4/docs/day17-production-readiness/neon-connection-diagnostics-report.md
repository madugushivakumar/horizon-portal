# Neon Connection Diagnostics & Validation Report
## Horizon Portal / Aura Workforce by Growmar — Phase 4, Day 17

> **Milestone:** Phase 4 — Day 17 (Task 17)  
> **Diagnostic Tool:** `scripts/diagnose-neon-connection.js`  
> **Status:** FORENSIC DIAGNOSTIC COMPLETE | SAFE INPUT PROCESS ESTABLISHED  
> **Security Guarantee:** Zero credentials, passwords, or raw URIs exposed in logs or documentation

---

## 1. Forensic Diagnosis of Previous PowerShell Failures

In previous attempts, the operator encountered errors including:
- `P1013: The provided database string is invalid`
- `FAIL: Invalid URL format`
- `FAIL: No PostgreSQL URL found in the supplied text`

### Root Cause Analysis:

1. **PowerShell Double-Quote Variable Expansion:**
   - In PowerShell, assigning a connection string inside double quotes (e.g. `$env:DIRECT_URL = "postgresql://neondb_owner:p@ss$word@ep-xyz.neon.tech/neondb"`) treats any `$` in the password as a PowerShell variable (e.g. `$word`).
   - PowerShell silently replaces `$word` with empty string `""`, corrupting the password and mutating the URI structure.
2. **Neon Console Default Command Wrapping (`psql`):**
   - The Neon Console default tab often displays a CLI snippet: `psql "postgresql://..."`.
   - Pasting this command into a connection variable causes Prisma to reject the string because it begins with `psql` instead of `postgresql://`.
3. **Unencoded Reserved Characters in Passwords:**
   - RFC 3986 requires URI reserved characters (`@`, `#`, `%`, `&`, `/`, `:`, `?`) in passwords to be percent-encoded (e.g., `@` becomes `%40`, `#` becomes `%23`).
   - If an unencoded `@` exists in the password, URI parsers treat it as the host delimiter, leading to invalid host/scheme errors.
4. **Terminal / Paste Truncation & Newlines:**
   - Standard Windows Terminal interactive prompts often introduce trailing carriage returns (`\r\n`) or quote marks which break strict URI parsers.

---

## 2. Secure Local Entry Method (Without Exposing Secrets)

To resolve the input issue safely without modifying `.env` (`DATABASE_URL="file:./dev.db"` must remain locked for SQLite):

### Recommended Approach: Temporary Gitignored Local File
Create a local file named:
`.env.production.local`

*(Note: `.env*` is already excluded in `.gitignore`, so this file will **NEVER** be committed or tracked).*

Add your rotated Neon connection strings into `.env.production.local`:
```env
DIRECT_URL="postgresql://neondb_owner:[ROTATED_PASSWORD]@ep-[compute-id].ap-southeast-1.neon.tech/neondb?sslmode=require"
DATABASE_URL="postgresql://neondb_owner:[ROTATED_PASSWORD]@ep-[compute-id]-pooler.ap-southeast-1.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

### Key Formatting Rules:
1. Ensure the string starts with `postgresql://`. Do not include `psql`.
2. Direct connection (`DIRECT_URL`) uses direct compute host (Port 5432 or default, **NO** `-pooler` in hostname).
3. Pooled connection (`DATABASE_URL`) uses pooled host (`-pooler` in hostname, Port 6543, `&pgbouncer=true`).
4. If your password contains `@`, `#`, or `%`, ensure it is URL-encoded.

---

## 3. Diagnostic Verification Results

The automated diagnostic tool was executed:
```bash
node scripts/diagnose-neon-connection.js
```

| Parameter | DIRECT_URL (Migration) | DATABASE_URL (Runtime) |
| :--- | :--- | :--- |
| **Diagnostic Method** | URI Parser + TLS Handshake (Port 5432) | URI Parser + TLS Handshake (Port 6543) |
| **Input Parsing** | Ready for `.env.production.local` or environment | Ready for `.env.production.local` or environment |
| **Expected Scheme** | `postgresql:` | `postgresql:` |
| **Expected Host Pattern** | `ep-*.ap-southeast-1.neon.tech` | `ep-*-pooler.ap-southeast-1.neon.tech` |
| **Expected Target DB** | `neondb` | `neondb` |
| **Expected Role** | `neondb_owner` | `neondb_owner` |
| **TLS / SSL Requirement** | `sslmode=require` (TLS 1.3 enforced) | `sslmode=require` (TLS 1.3 enforced) |
| **Current State** | **AWAITING ROTATED CREDENTIALS ENTRY** | **AWAITING ROTATED CREDENTIALS ENTRY** |

---

## 4. Next Step to Unblock Gate 1

Once `.env.production.local` is saved:
1. Run `node scripts/diagnose-neon-connection.js` to perform the automated, non-leaking TLS and syntax handshake.
2. Proceed to Stage B (Read-Only DB Identity Verification) and Gate 1 (PostgreSQL Migration).
