# Lifecycle Staging: Received Evidence Vault

**Lifecycle State:** `RECEIVED — NOT YET VERIFIED`  
**Location:** `04_Evidence_Intake/Received/`  
**Purpose:** Initial landing zone and cryptographic registration area for newly deposited raw evidence files.  

---

## 1. Operating Rules

1. **Immediate Ingestion Action:**
   - Log original filename, receipt timestamp, file size, submitting stakeholder, and issuing authority in `EVIDENCE-INTAKE-TRACKER-TEMPLATE.csv`.
   - Calculate SHA-256 immediately using `certutil -hashfile <file> SHA256` or `hashlib.sha256()`.
   - Complete an individual `EVIDENCE-RECEIPT-AND-CHAIN-OF-CUSTODY-TEMPLATE.md` entry.
2. **Immutability Protection:**
   - Mark the raw received file as read-only on disk.
   - Never edit, format, or overwrite any file in this directory.
3. **Transition to Under Review:**
   - Generate an isolated working copy in `04_Evidence_Intake/Under_Review/` when the assigned reviewer begins the verification SOP.

---

## 2. Current Status

```
STATUS: EMPTY — NO ARTIFACTS CURRENTLY RECEIVED
Zero external documents have been deposited.
```

