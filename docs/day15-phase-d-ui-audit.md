# Day 15 — Phase D: Frontend Pre-Implementation Audit Report
## AI Insights Panel for HR Advanced — Aura Workforce by Growmar (Horizon Portal)

**Document Version:** 1.0.0
**Date:** 2026-11-06
**Status:** Complete — Pending User Approval for Phase D Implementation
**Auditor:** Senior Full-Stack Engineer, Software Architect, Security Engineer, UI/UX Engineer

---

## 1. Executive Summary & Audit Scope

This document represents the mandatory pre-implementation architecture and UI audit for **Day 15 — Phase D: Frontend AI Insights Dashboard UI Components and Page** in the **Aura Workforce by Growmar (Horizon Portal)** enterprise application.

### Phase D Objectives
1. Build a production-grade, responsive **AI Workforce Insights** dashboard at route `/hr-insights`.
2. Connect cleanly to the approved Phase C backend APIs (`GET /api/v1/hr-insights` and `GET /api/v1/hr-insights/filters`).
3. Preserve all privacy safeguards, small-group suppression indicators (`< 5`), and complementary residual protection.
4. Render 6 core overview KPI cards, visual attrition risk distribution meters, department risk comparison tables, deduplicated top contributing factors, and deterministically ranked payroll/attendance anomaly cards.
5. Display the mandatory AI disclosure tag (**`AI-generated, for human review`**) on every AI insight component.
6. Adhere strictly to the existing Horizon Design System (Tailwind CSS v4 tokens, `AppShell`, accessible cards, badges, and buttons) without introducing extraneous charting libraries or modifying navigation prematurely.

---

## 2. Existing Architecture & Application Shell Inspection

### 2.1 Next.js 16.4.2 App Router Architecture
The application uses the Next.js App Router with server-side layout composition and client-side interactivity:
- **Root Layout:** `src/app/layout.tsx` supplies core HTML structure, fonts, and dark mode class persistence.
- **Server Session Utility:** `src/lib/auth/server-session.ts` provides `getCurrentUser()` reading the secure HTTP-only JWT session cookie (`hz_session`).
- **Target Page Route:** `src/app/hr-insights/page.tsx` will serve as the server-rendered entrypoint.

### 2.2 Layout & Shell Component (`AppShell`)
Inspected: `src/components/layout/AppShell.tsx`
- **Props:** Accepts `children: React.ReactNode` and optional `initialUser?: TopBarUser | null`.
- **Desktop Sidebar:** Persistent responsive `w-64` navigation drawer with role-aware visibility.
- **TopBar:** Sticky navigation bar containing dynamic breadcrumbs, user role badge, theme toggle, and sign-out handler.
- **Hydration:** Zero-layout-shift skeleton fallback when session is hydrating.
- **Convention:** The new `/hr-insights/page.tsx` will wrap its content inside `<AppShell initialUser={topBarUser}>` to maintain complete layout consistency with Day 13 (`/task-board`) and Day 14 (`/capacity`).

### 2.3 Access Control & Unauthorized Handling
- **Route Authorization:** The backend APIs strictly permit `ADMIN` and `HR` roles, returning `401 Unauthorized` for unauthenticated sessions and `403 Forbidden` for `MANAGER` or `EMPLOYEE` roles.
- **Server-Side Page Guard (`src/app/hr-insights/page.tsx`):**
  1. If `!user`: Redirect immediately to `/login`.
  2. If `user.role !== "ADMIN" && user.role !== "HR"`: Render an accessible, non-disclosing `403 Forbidden` unauthorized view inside `AppShell` (matching the pattern in `src/app/payroll/page.tsx`), preventing any unauthorized layout flashing or API invocation.

---

## 3. Design System & Reusable UI Primitives

### 3.1 Design Tokens & Tailwind CSS v4
The application uses Tailwind CSS v4 configured with Horizon CSS variables in `src/app/globals.css`:
- **Surface & Backgrounds:** `--hz-bg-page`, `--hz-bg-surface`, `--hz-bg-subtle`
- **Borders:** `--hz-border`, `--hz-border-subtle`, `--hz-border-strong`
- **Text:** `--hz-text-primary`, `--hz-text-secondary`, `--hz-text-muted`
- **Brand Colors:** `--hz-primary-500` through `--hz-primary-950`
- **Semantic Feedback:**
  - *Success (Low Risk):* Emerald / `--hz-success`
  - *Warning (Medium Risk / AI Disclosure):* Amber / `--hz-warning`
  - *Danger (High Risk / Critical Anomaly):* Rose / `--hz-danger`
  - *Info (Attendance / General):* Blue / Indigo / `--hz-info`

### 3.2 Reusable Horizon Primitives in `src/components/ui/`
The following existing components will be directly reused without modification:

| Component | Path | Description & Usage in Phase D |
|---|---|---|
| **Card** | `src/components/ui/card.tsx` | Container surface for KPI summary cards, distribution panels, and anomaly cards. Supports `elevation="raised"`, `padding="md"`, and `accent` top borders. |
| **Badge** | `src/components/ui/badge.tsx` | Status tags for risk bands (`success`, `warning`, `danger`), review statuses, and department badges. Supports `pill`, `dot`, and size variants. |
| **Button** | `src/components/ui/button.tsx` | Refresh action, category filter toggles, reason breakdown tab toggles, and retry buttons. |
| **Skeleton** | `src/components/ui/skeleton.tsx` | Accessible animated pulse placeholders (`role="status"`, `aria-busy="true"`) for zero-shift loading states. |
| **EmptyState** | `src/components/ui/empty-state.tsx` | Rendered when a selected department has zero anomalies or zero attrition records. |
| **ErrorState** | `src/components/ui/error-state.tsx` | Rendered when an API request fails, offering a retry trigger while concealing raw stack traces. |

### 3.3 Charting Policy: Native Accessible Meters vs. External Libraries
- **Audit Finding:** `package.json` contains NO charting libraries (Recharts, Chart.js, or D3 are absent).
- **Architecture Decision:** In alignment with user guidelines ("Use the existing chart library if one is already installed. Do not add another chart dependency without justification"), we will use **native accessible HTML5/Tailwind CSS progress and meter bars**, adopting the battle-tested pattern from `CapacityProgressBar.tsx` (Day 14).
- **Advantages:**
  1. Zero additional bundle overhead and 100% SSR compatibility.
  2. Full dark mode responsiveness with CSS variable tokens.
  3. Built-in ARIA attributes (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`).
  4. Precise control over small-group suppression labels (`< 5`) without tooltip glitches.

---

## 4. Phase C API Contract & Response Mapping

### 4.1 Primary Insights API: `GET /api/v1/hr-insights`
Accepts optional query parameter: `?departmentId=D01`

```typescript
// Contract verified from src/lib/hr-insights/types.ts
export interface HRInsightsApiResponse {
  success: boolean;
  data: {
    filter: {
      departmentId: string | null;
      departmentName: string | null;
      isFiltered: boolean;
    };
    disclaimer: "AI-generated, for human review";
    governanceNotice: string;
    attrition: AttritionInsightsData;
    payrollAnomalies: PayrollAnomalyInsightsData;
  };
}
```

#### Detailed Field Mapping:
1. **Mandatory Disclaimer:** `data.disclaimer === "AI-generated, for human review"`. Must be prominently displayed in the header and alongside every insight section.
2. **Governance Notice:** `data.governanceNotice`. Explains that models produce advisory estimates, requiring human-in-the-loop review.
3. **Attrition Aggregate (`data.attrition`):**
   - `totalEvaluated`: `430` (organization-wide).
   - `riskBands`:
     - `low`: `301` (`lowDisplay: "301"`, ~70.0%)
     - `medium`: `86` (`mediumDisplay: "86"`, ~20.0%)
     - `high`: `43` (`highDisplay: "43"`, ~10.0%)
     - `total`: `430`
     - `highRiskPercentage`: `10.0`
     - `isSuppressed`: `false` (organization-wide)
4. **Department Distribution (`data.attrition.departmentDistribution`):**
   - Array of 11 departments.
   - Suppressed cells have numerical counts set to `null` and display strings set to:
     - `highDisplay: "< 5"` (primary suppression)
     - `mediumDisplay: "Suppressed (Residual Protection)"` (complementary companion suppression)
   - `hasSuppression: boolean` and `suppressedBands: string[]`.
5. **Contributing Factors & Specific Reasons (`data.attrition`):**
   - `topFactors`: 8 canonical thematic factor categories with intra-record deduplicated counts and percentages:
     1. Departmental Historical Attrition Pattern (260 records, 60.5%)
     2. Experience & Seniority Considerations (165 records, 38.4%)
     3. Tenure & Organizational Lifecycle (164 records, 38.1%)
     4. Compensation & Salary Progression (117 records, 27.2%)
     5. Overtime & Workload Demands (70 records, 16.3%)
     6. Commute Distance & Proximity (54 records, 12.6%)
     7. Environmental & Workplace Satisfaction (47 records, 10.9%)
     8. Job Role & Career Level Alignment (25 records, 5.8%)
   - `topSpecificReasons`: Top 10 verbatim source strings (e.g., "Department has a historically higher attrition pattern": 247).
   - `countingSemantics`: Clear explanation that employee records cite up to 3 reasons each.
6. **Payroll Anomalies (`data.payrollAnomalies`):**
   - `totalAnomalies`: `405`
   - `totalPayrollAnomalies`: `184`
   - `totalAttendanceAnomalies`: `221`
   - `flaggedForReviewCount`: `405`
   - `aggregationLabel`: `"18-month cumulative historical flagged payroll exposure"`
   - `cumulativeMoneyAtRisk`: `31421239.07`
   - `formattedCumulativeMoneyAtRisk`: `"₹3,14,21,239.07"`
   - `zeroMoneyCount`: `6`
   - `positiveMoneyCount`: `178`
   - `nullMoneyCount`: `221`
   - `unmatchedEmployeeRecordsCount`: `50`
   - `items`: Deterministically sorted by `moneyAtRisk DESC NULLS LAST, anomalyScore DESC, id ASC`.
     - `employeeMask`: `"EMP-***"` or `"FORMER-EMP-***"` (conceals original employee ID).
     - `departmentName`: Specific department name or `"Unassigned / Former Employee"`.
     - `moneyAtRisk` / `formattedMoneyAtRisk`:
       - Monetary anomalies: Formatted as `₹X,XX,XXX.XX` (or `₹0.00` for zero-risk records).
       - Attendance anomalies: `moneyAtRisk === null`, `formattedMoneyAtRisk === null`. Must display as `"N/A — Non-monetary Attendance"`, **never** as `₹0` or `₹0.00`.

### 4.2 Filters API: `GET /api/v1/hr-insights/filters`
```typescript
// Contract verified from src/lib/hr-insights/types.ts
export interface HRInsightsFiltersApiResponse {
  success: boolean;
  data: {
    departments: DepartmentFilterItem[];
    unassignedOption?: {
      id: string;
      name: string;
      anomalyCount: number;
      anomalyCountDisplay: string;
    };
  };
}
```
- Returns 11 departments (D00-D10) with pre-aggregated counts.
- Small-group protection applied: D00 and D05 have `anomalyCount: null`, `anomalyCountDisplay: "< 5"`, `isSuppressed: true`.
- D00 (Executive Office) has `hasAttritionData: false`, `attritionCount: 0`.
- `unassignedOption`: Reflects the 50 historical/former employee anomalies (`anomalyCount: 50`).

---

## 5. Statistical Disclosure Control (SDC) & Privacy Audit Rules

To ensure strict compliance with Phase C security standards, the frontend UI must implement the following non-negotiable rules:

| Rule | Requirement | Implementation in Phase D UI |
|---|---|---|
| **1. Primary Suppression** | Any cell with $< 5$ records must never display raw numbers. | Display exact API string `< 5`. Never attempt client-side math or estimation. |
| **2. Complementary Suppression** | Companion cells suppressed for residual protection must never be reverse-engineered. | Display exact API string `Suppressed (Residual Protection)`. Do not subtract known cells from totals. |
| **3. Null vs. Zero Integrity** | Suppressed counts are `null`, not `0`. | Render `< 5` badge; do NOT treat `null` as zero in progress bars or charts. |
| **4. PII Non-Exposure** | Zero employee names, IDs, emails, or individual attrition scores. | The UI will display only aggregated attrition metrics. No employee table exists for attrition. |
| **5. Unmatched Anomaly Concealment** | 50 historical records lack current employee records. | Render masked identity `FORMER-EMP-***` and department `"Unassigned / Former Employee"`. |
| **6. Financial Value Precision** | Zero financial values are valid ($0.00); null values represent non-monetary records. | Positive values: `₹X,XX,XXX.XX`; Zero: `₹0.00`; Null: `"N/A (Non-monetary)"`. |
| **7. Cumulative Meaning** | Cumulative exposure is historical over 18 months. | The UI will strictly use the API label `"18-month cumulative historical flagged payroll exposure"` and never call it current financial loss. |

---

## 6. Proposed Component Hierarchy & Architecture

All new components will reside under `src/components/hr-insights/`:

```
src/
├── app/
│   └── hr-insights/
│       └── page.tsx                     # Server Page (Auth & 403 guard, AppShell wrapper)
└── components/
    └── hr-insights/
        ├── HRInsightsDashboard.tsx      # Master Client Orchestrator (State, Fetch, Filter, Abort)
        ├── AIReviewLabel.tsx            # Standardized "AI-generated, for human review" badge
        ├── InsightsHeader.tsx           # Page title, subtitle, refresh button, last updated
        ├── DepartmentFilter.tsx         # Accessible dropdown with suppression indicators
        ├── HRInsightsMetrics.tsx        # 6 Overview KPI Summary Cards
        ├── AttritionRiskOverview.tsx    # Visual attrition distribution meters (Low, Med, High)
        ├── DepartmentAttritionTable.tsx # Department comparison table with < 5 badges
        ├── TopAttritionFactors.tsx      # Thematic factors ranking + specific reasons tabs
        ├── PayrollAnomalyPanel.tsx      # Anomaly list orchestrator with category filter
        ├── PayrollAnomalyCard.tsx       # Individual anomaly card with badge, score, exposure
        ├── HumanReviewGuidance.tsx      # Advisory protocol ("How HR should use these insights")
        ├── HRInsightsSkeleton.tsx       # Zero-layout-shift loading state skeleton
        ├── HRInsightsEmptyState.tsx     # Filter-level zero records fallback
        └── HRInsightsErrorState.tsx     # Network/server error retry card
```

### Component Details & Responsibilities:

#### 1. `src/app/hr-insights/page.tsx` (Server Component)
- Verifies user session via `getCurrentUser()`.
- Redirects unauthenticated users to `/login`.
- Rejects non-Admin/non-HR users with a clean, branded `403 Forbidden` state card inside `AppShell`.
- Pre-fetches filter options from `/api/v1/hr-insights/filters` on the server (or delegates to client for uniform hydration).
- Mounts `<HRInsightsDashboard currentUserRole={user.role} />`.

#### 2. `HRInsightsDashboard.tsx` (Client Container)
- Holds active state: `selectedDepartmentId` (`""` for all departments), `anomalyCategoryFilter` (`"ALL" | "PAYROLL" | "ATTENDANCE"`), `activeTab` for factors (`"thematic"` vs `"specific"`).
- Uses `AbortController` on every filter change to abort pending in-flight requests and prevent race conditions.
- Handles `isLoading`, `isRefreshing`, and `error` states gracefully with retry capability.

#### 3. `AIReviewLabel.tsx`
- Renders the exact text: **`AI-generated, for human review`**.
- Uses an amber/gold pill badge with an informational spark/sparkle icon to signal AI provenance.
- Exported and reused in header, overview cards, attrition section, and anomaly panel.

#### 4. `HRInsightsMetrics.tsx`
- Renders 6 responsive KPI cards using Horizon `Card`:
  1. **Employees Evaluated:** `430` (with model scope badge).
  2. **High Attrition Risk:** `43` (10.0%, danger/rose accent, `< 5` safe).
  3. **Medium Attrition Risk:** `86` (20.0%, warning/amber accent).
  4. **Low Attrition Risk:** `301` (70.0%, success/emerald accent).
  5. **Flagged Anomalies:** `405` (184 payroll / 221 attendance split).
  6. **Historical Payroll Exposure:** `₹3,14,21,239.07` with subtitle `"18-month cumulative historical flagged payroll exposure"`.

#### 5. `AttritionRiskOverview.tsx`
- Renders stacked and individual visual meters for Low, Medium, and High risk bands.
- Dual-coding: Uses color (emerald, amber, rose) + bold textual percentage and count labels.
- When a filtered department has suppressed counts, renders a prominent "Protected Small Group" indicator with an explanatory privacy badge.

#### 6. `DepartmentAttritionTable.tsx`
- Renders a clean, accessible table listing all 11 departments.
- Columns: Department Name, Evaluated Headcount, Low Risk, Medium Risk, High Risk, Status / Suppression.
- Automatically handles suppressed cells by rendering `<Badge variant="warning">&lt; 5</Badge>` or `<Badge variant="secondary">Suppressed</Badge>`.
- Displays an informational footnote explaining Statistical Disclosure Control (SDC) and residual protection.

#### 7. `TopAttritionFactors.tsx`
- Renders the 8 thematic factor categories ranked by deduplicated employee count and percentage.
- Features horizontal proportional bars indicating relative prevalence.
- Provides a toggle/tab to view the top 10 specific source reasons (e.g., "Department has a historically higher attrition pattern", "Distance from home exceeds commute threshold").
- Highlights counting semantics footnote to clarify intra-record deduplication.

#### 8. `PayrollAnomalyPanel.tsx` & `PayrollAnomalyCard.tsx`
- Renders the deterministically sorted list of anomaly items.
- Controls:
  - Category Filter Pill: `All (405)`, `Payroll (184)`, `Attendance (221)`.
  - Pagination / Show More: 10 items per page with clear controls.
- Each Card displays:
  - Category Badge (`PAYROLL` in emerald, `ATTENDANCE` in blue).
  - Anomaly Score Badge (e.g. `Score: 0.98`, formatted to 2 decimals).
  - Masked ID: `EMP-***` or `FORMER-EMP-***` (with former employee badge).
  - Period: `YYYY-MM`.
  - Reason Code & Text: `PR_OT_SURGE — Monthly overtime pay exceeds 3x employee baseline`.
  - Financial Exposure: `₹1,25,000.00` for monetary anomalies; `"N/A — Non-monetary Attendance"` for attendance.
  - Review Status: `"Flagged for Review"`.

#### 9. `HumanReviewGuidance.tsx`
- Collapsible/expanded enterprise guidance banner informing HR professionals:
  - How to interpret model probabilities.
  - Mandatory human validation before taking any personnel or compensation action.
  - Ethical AI and anti-bias principles.

---

## 7. Responsive & Accessible UX Design Specifications

### 7.1 Breakpoints & Layout Flow
- **Mobile (< 640px):**
  - KPI cards stack in a 1-column grid.
  - Anomaly cards stack vertically with compact metadata chips.
  - Department table switches to horizontally scrollable container or stacked summary cards.
- **Tablet (640px - 1024px):**
  - KPI cards arrange in a 2-column or 3-column grid.
  - Attrition meters and top factors arrange in 2-column layout.
- **Desktop (> 1024px):**
  - Full 6-column KPI summary strip.
  - 2-column split: Attrition risk distribution & factors on the left, payroll anomaly stream on the right.
  - Full department comparison table.

### 7.2 Accessibility (WCAG 2.1 AA)
1. **Color Contrast:** All text meets 4.5:1 minimum contrast ratio against light (`#FFFFFF`, `#F8FAFC`) and dark (`#0F172A`, `#1E293B`) backgrounds.
2. **Dual-Coding:** Risk levels are NEVER communicated by color alone. Every risk indicator includes an explicit text label ("High Risk", "Medium Risk", "Low Risk").
3. **Screen Reader Support:** Semantic HTML headings (`h1` through `h4`), tables (`thead`, `tbody`, `th scope="col"`), and progress bars (`role="progressbar"`, `aria-label`, `aria-valuenow`).
4. **Keyboard Accessibility:** All filter dropdowns, buttons, and tabs are keyboard focusable with visible focus rings (`focus-visible:ring-2`).

---

## 8. Frontend Testing & Verification Plan

An automated test suite `scripts/test-day15-ui.ts` will be created to verify:
1. **Server Route Protection:** Unauthenticated sessions are redirected; Manager/Employee roles receive 403; Admin/HR roles can access the dashboard.
2. **Dashboard Component Mounting:** Renders with valid mock and live API payloads.
3. **Metric Card Calculations:** 430 evaluated, 43 high, 86 medium, 301 low, 405 anomalies, ₹3,14,21,239.07 cumulative exposure.
4. **Primary Suppression Preservation:** Cells $< 5$ render as `< 5` and are never displayed as `0` or raw values.
5. **Complementary Suppression Preservation:** Companion suppressed cells render as `Suppressed (Residual Protection)` and are not mathematically leaked.
6. **Financial Formatting Rules:**
   - Null financial values display as `"N/A"` (never `₹0`).
   - Zero financial values display as `"₹0.00"`.
   - Positive values display formatted Indian rupee strings (`₹...`).
7. **Cumulative Exposure Labeling:** Label strictly reads `"18-month cumulative historical flagged payroll exposure"`.
8. **Employee Concealment:** No employee names, raw IDs, emails, or individual attrition scores exist in any component or DOM element.
9. **AI Disclosure Verification:** Exact string **`AI-generated, for human review`** is rendered in the header and throughout all insight sections.
10. **Filter Updates:** Selecting a department correctly requests the scoped endpoint and updates state without stale race conditions.
11. **Regression Quality Gates:**
    - `npx tsc --noEmit` (0 errors)
    - `npm run test:hr-insights-api` (78/78 passing)
    - `npm run test:tasks-api` (61/61 passing)
    - `npm run test:capacity` (69/69 passing)
    - Next.js production build (`npm run build`) verification

---

## 9. Phase D Approval Checkpoint

In accordance with Section 1 of the Phase D Master Execution Prompt:
> **STOP condition:** Stop after writing `docs/day15-phase-d-ui-audit.md` and present the audit for approval before creating UI components or modifying pages.

### Files Prepared for Creation upon Approval:
1. `src/app/hr-insights/page.tsx`
2. `src/components/hr-insights/AIReviewLabel.tsx`
3. `src/components/hr-insights/InsightsHeader.tsx`
4. `src/components/hr-insights/DepartmentFilter.tsx`
5. `src/components/hr-insights/HRInsightsMetrics.tsx`
6. `src/components/hr-insights/AttritionRiskOverview.tsx`
7. `src/components/hr-insights/DepartmentAttritionTable.tsx`
8. `src/components/hr-insights/TopAttritionFactors.tsx`
9. `src/components/hr-insights/PayrollAnomalyPanel.tsx`
10. `src/components/hr-insights/PayrollAnomalyCard.tsx`
11. `src/components/hr-insights/HumanReviewGuidance.tsx`
12. `src/components/hr-insights/HRInsightsSkeleton.tsx`
13. `src/components/hr-insights/HRInsightsDashboard.tsx`
14. `scripts/test-day15-ui.ts`
15. `docs/day15-phase-d-ui-report.md`

**Status:** The audit is complete. Awaiting user approval to proceed with Phase D implementation.
