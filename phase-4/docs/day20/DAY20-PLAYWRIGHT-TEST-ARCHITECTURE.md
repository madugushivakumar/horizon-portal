# DAY 20 PLAYWRIGHT TEST INFRASTRUCTURE & ARCHITECTURE SPECIFICATION

**Project:** Horizon Portal  
**Workspace:** `C:\Users\Madugu Shiva Kumar\OneDrive\图片\Desktop\horizon-portal`  
**Date:** 2026-11-20  
**Phase:** Phase A (Playwright Testing Infrastructure)  
**Status:** **IN PROGRESS — CONFIGURATION & INSTALLATION ACTIVE**  

---

## 1. Executive Summary

This document defines the Playwright end-to-end automation architecture for Horizon Portal. The infrastructure is engineered to deliver fast, reliable, and deterministic verification across five primary business journeys in both local development and hosted Preview environments without introducing test flakiness or production risk.

---

## 2. Directory Layout & Test Organization

```text
tests/
└── e2e/
    ├── auth/
    │   └── login.spec.ts          # Journey 1: Authentication & Session Verification
    ├── leave/
    │   ├── apply-leave.spec.ts    # Journey 2: Employee Time-Off Application
    │   └── approve-leave.spec.ts  # Journey 3: Manager Approval & Status Transition
    ├── payroll/
    │   └── view-payslip.spec.ts   # Journey 4: Employee Payslip Access & Breakdown
    ├── tasks/
    │   └── move-task-card.spec.ts # Journey 5: Kanban Task Card Column Transition
    ├── fixtures/
    │   ├── auth.fixture.ts        # Fast session injection & authenticated page fixtures
    │   ├── test-data.fixture.ts   # Synthetic isolated test data lifecycle
    │   └── environment.fixture.ts # Local vs Preview environment context
    └── helpers/
        ├── authentication.ts      # UI and API authentication helpers
        ├── test-data.ts           # Unique ID generators & mock payloads
        └── assertions.ts          # Custom domain-specific web assertions

playwright.config.ts
```

---

## 3. Configuration & Multi-Environment Support

### 3.1 Dual-Mode Target Resolution
The framework automatically resolves target environments via `playwright.config.ts`:
- **Local Mode (Default):** Targets `http://localhost:3000`. Starts or reuses the Next.js production server backed exclusively by local SQLite (`DATABASE_URL="file:./dev.db"`).
- **Hosted Preview Mode:** Triggered whenever `PLAYWRIGHT_BASE_URL` is set (e.g. `https://horizon-portal-git-day18-preview-validation-*.vercel.app`). Disables local server spawning and executes directly against the deployed Vercel Preview URL.

### 3.2 Browser Engine & Binary Selection
To optimize execution speed and eliminate unnecessary binary downloads on Windows:
- Configures projects for installed system browsers:
  - **`chrome`:** Leverages Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`).
  - **`msedge`:** Leverages Microsoft Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
  - **`chromium`:** Fallback for headless CI environments.

### 3.3 Flakiness Prevention & Diagnostic Artifacts
- **Screenshots:** `screenshot: "only-on-failure"` to record visual state upon assertion failure.
- **Traces:** `trace: "on-first-retry"` (or `"retain-on-failure"`) to capture DOM snapshots, action logs, and network waterfalls.
- **Reporting:** Unified HTML report (`playwright-report`) and clean console list reporter.
- **Zero Arbitrary Sleeps:** Strict rule against `page.waitForTimeout()`; all flows synchronize using web-first auto-waiting locators and explicit URL/response events.

---

## 4. Secure Credential & Environment Variable Architecture

To comply with Security Rule 3.2 and 4.3:
- Zero demo passwords or secrets are hardcoded in test spec files.
- Credentials resolve dynamically from environment variables:
  ```env
  E2E_ADMIN_EMAIL=admin@growmar.com
  E2E_ADMIN_PASSWORD=...
  E2E_MANAGER_EMAIL=manager@growmar.com
  E2E_MANAGER_PASSWORD=...
  E2E_EMPLOYEE_EMAIL=employee@growmar.com
  E2E_EMPLOYEE_PASSWORD=...
  ```
- If environment variables are omitted during local development, test helpers securely inspect `.env` / `demo_users.json` via local helper abstraction without echoing or logging credentials to console stdout.

---

## 5. Locators & Accessibility-First Selection Rules

In conformance with WCAG 2.2 and testing best practices:
1. **Tier 1 (Preferred):** Semantic accessible locators:
   - `page.getByRole('button', { name: 'Sign in' })`
   - `page.getByLabel('Email Address')`
   - `page.getByPlaceholder('Enter your password')`
2. **Tier 2:** Semantic text and titles:
   - `page.getByText('Available Time-Off Balances')`
   - `page.getByTitle('Prev month')`
3. **Tier 3 (Explicit Selectors):** Dedicated test IDs (`data-testid`) used only when disambiguating complex dynamic Kanban lists or table rows. Brittle CSS tag/class paths (`div > div > span:nth-child(2)`) are strictly forbidden.
