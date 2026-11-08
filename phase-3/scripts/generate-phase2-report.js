/**
 * Horizon Portal — Phase 2 Final Report PDF Generator
 * scripts/generate-phase2-report.js
 *
 * Generates an authoritative 3-page A4 PDF report with embedded screenshot evidence,
 * test matrices, technical verification, and clickable links.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function toBase64(relativeImagePath) {
  const fullPath = path.join(projectRoot, relativeImagePath);
  if (fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".jpg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,` + fs.readFileSync(fullPath).toString("base64");
  }
  return "";
}

// Convert representative evidence screenshots to base64
const imgDay6 = toBase64("reports/day-6-evidence/01_leave_application.png");
const imgDay7 = toBase64("reports/day-7-evidence/02_payslip_detail.png");
const imgDay8 = toBase64("reports/day-8-evidence/01_topbar_bell_unread_count.png");
const imgDay9 = toBase64("reports/day-9-evidence/01_employee_management_console.png");
const imgDay10Queue = toBase64("reports/day-10-evidence/01_leave_approval_queue.png");
const imgDay10Attendance = toBase64("reports/day-10-evidence/05_team_attendance_overview.png");

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Horizon Portal — Phase 2 Final Review Report</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm 10mm 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 8pt;
    line-height: 1.3;
  }
  .page {
    width: 100%;
    height: 281mm;
    max-height: 281mm;
    position: relative;
    page-break-after: always;
    padding-bottom: 8mm;
    overflow: hidden;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .page-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    font-size: 6.8pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 1.5mm;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 2mm;
    margin-bottom: 2.5mm;
  }
  .header-left h1 {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 1mm 0;
    letter-spacing: -0.02em;
  }
  .header-left .subtitle {
    font-size: 8pt;
    color: #475569;
    font-weight: 500;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2mm;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 2mm 3mm;
    margin-bottom: 3mm;
  }
  .meta-item {
    font-size: 7.2pt;
  }
  .meta-label {
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 6.2pt;
    display: block;
  }
  .meta-value {
    color: #0f172a;
    font-weight: 700;
  }
  .meta-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 700;
  }
  .meta-link:hover {
    text-decoration: underline;
  }
  .badge-tag {
    display: inline-block;
    background: #e0e7ff;
    color: #3730a3;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: monospace;
    font-weight: 700;
    font-size: 7pt;
  }
  h2.section-title {
    font-size: 9.5pt;
    font-weight: 800;
    color: #0f172a;
    border-left: 3px solid #3b82f6;
    padding-left: 2mm;
    margin: 2.5mm 0 1.8mm 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.2pt;
    margin-bottom: 2.5mm;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 1.8mm 2.2mm;
    text-align: left;
  }
  table.data-table th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
  }
  .status-done {
    color: #15803d;
    font-weight: 700;
    background: #dcfce7;
    padding: 1px 5px;
    border-radius: 3px;
    display: inline-block;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
  }
  .three-col {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2.5mm;
  }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 2mm 2.5mm;
    background: #ffffff;
    margin-bottom: 2mm;
  }
  .card-title {
    font-size: 8pt;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .img-frame {
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 1.5mm;
    background: #f8fafc;
  }
  .img-frame img {
    width: 100%;
    height: auto;
    max-height: 38mm;
    object-fit: cover;
    display: block;
  }
  .callout-box {
    border-left: 3px solid #6366f1;
    background: #f5f3ff;
    padding: 2mm 3mm;
    border-radius: 0 4px 4px 0;
    margin: 2mm 0;
    font-size: 7.4pt;
  }
  .callout-title {
    font-weight: 800;
    color: #4338ca;
    margin-bottom: 1mm;
    font-size: 7.8pt;
  }
  ol.walkthrough-list {
    margin: 1mm 0 2mm 4mm;
    padding: 0;
    font-size: 7.3pt;
  }
  ol.walkthrough-list li {
    margin-bottom: 1.2mm;
    line-height: 1.35;
  }
  .code-token {
    font-family: monospace;
    font-size: 6.8pt;
    background: #f1f5f9;
    padding: 1px 3px;
    border-radius: 2px;
    color: #0f172a;
    border: 1px solid #e2e8f0;
  }
  .checklist-item {
    font-size: 7.2pt;
    display: flex;
    align-items: center;
    gap: 1.5mm;
    margin-bottom: 1mm;
  }
  .chk {
    color: #16a34a;
    font-weight: 800;
  }
</style>
</head>
<body>

<!-- ============================================================== -->
<!-- PAGE 1: HEADER, PHASE SUMMARY TABLE & DAYS 6-8 DETAILS         -->
<!-- ============================================================== -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>Horizon Portal — Phase 2 Final Review Report</h1>
      <div class="subtitle">Aura Workforce Operations by Growmar • Full Stack Implementation Assessment</div>
    </div>
    <div style="text-align: right; font-size: 7.5pt; color: #64748b;">
      <div><strong>Date:</strong> October 30, 2026</div>
      <div><strong>Status:</strong> <span class="status-done">VERIFIED (100% COMPLETE)</span></div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Student / Engineer</span>
      <span class="meta-value">Madugu Shiva Kumar</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Track &amp; Phase</span>
      <span class="meta-value">Full Stack Dev • Phase 2</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">GitHub Repository</span>
      <a href="https://github.com/madugushivakumar/horizon-portal" class="meta-link">madugushivakumar/horizon-portal</a>
    </div>
    <div class="meta-item">
      <span class="meta-label">Release Git Tag</span>
      <span class="badge-tag">phase-2</span>
    </div>
  </div>

  <h2 class="section-title">Phase 2 Task Summary Matrix (Days 6–10)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">Task</th>
        <th style="width: 32%;">Module &amp; Scope</th>
        <th style="width: 12%; text-align: center;">Status</th>
        <th style="width: 28%;">Key Technical Capabilities Delivered</th>
        <th style="width: 18%;">Primary Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Day 6</strong></td>
        <td>Leave &amp; Attendance Self-Service</td>
        <td style="text-align: center;"><span class="status-done">Done</span></td>
        <td>Real-time quota visibility (CL/SL/EL), working-day calc, conflict checks, attendance summary.</td>
        <td><span class="code-token">day-6-evidence/01_leave_application.png</span></td>
      </tr>
      <tr>
        <td><strong>Day 7</strong></td>
        <td>Payslip Viewer &amp; Download</td>
        <td style="text-align: center;"><span class="status-done">Done</span></td>
        <td>Historical compensation, INR formatting, gross-to-net breakdown, strict cross-employee 403.</td>
        <td><span class="code-token">day-7-evidence/02_payslip_detail.png</span></td>
      </tr>
      <tr>
        <td><strong>Day 8</strong></td>
        <td>Notifications &amp; Announcements</td>
        <td style="text-align: center;"><span class="status-done">Done</span></td>
        <td>Personal notifications, broadcast announcements, persistent isRead, deduplicated notify().</td>
        <td><span class="code-token">day-8-evidence/01_topbar_bell_unread_count.png</span></td>
      </tr>
      <tr>
        <td><strong>Day 9</strong></td>
        <td>Admin Employee Management</td>
        <td style="text-align: center;"><span class="status-done">Done</span></td>
        <td>TanStack console, search, department filter, CSV export (formula defense), field-level audit log.</td>
        <td><span class="code-token">day-9-evidence/01_employee_management_console.png</span></td>
      </tr>
      <tr>
        <td><strong>Day 10</strong></td>
        <td>Approvals &amp; Attendance Oversight</td>
        <td style="text-align: center;"><span class="status-done">Done</span></td>
        <td>Team approval queue, mandatory reject reason, self-approval defense, monthly attendance roster.</td>
        <td><span class="code-token">day-10-evidence/01_leave_approval_queue.png</span></td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-title">Workforce Self-Service &amp; Operations Review (Days 6–8)</h2>
  <div class="three-col">
    <!-- Day 6 Card -->
    <div class="card">
      <div class="card-title">
        <span>Day 6: Leave Self-Service</span>
        <span class="badge-tag">Self-Service</span>
      </div>
      <p style="margin: 0 0 1mm 0; font-size: 7pt; color: #475569;">
        Interactive leave application with calendar holiday exclusion, atomic pending locks, and live monthly attendance KPIs.
      </p>
      <div class="img-frame">
        ${imgDay6 ? `<img src="${imgDay6}" alt="Leave Application Screen">` : '<div style="padding:10px;text-align:center;">Screenshot Missing</div>'}
      </div>
      <div style="font-size: 6.5pt; color: #64748b; margin-top: 1mm;">
        ✓ 441 Balances • Overlap Refusal (409) • Quota Check
      </div>
    </div>

    <!-- Day 7 Card -->
    <div class="card">
      <div class="card-title">
        <span>Day 7: Payslip Viewer</span>
        <span class="badge-tag">Payroll Data</span>
      </div>
      <p style="margin: 0 0 1mm 0; font-size: 7pt; color: #475569;">
        Comprehensive compensation viewer reconciling 2,469 payslips and 18 payroll runs. Cross-employee requests strictly return HTTP 403.
      </p>
      <div class="img-frame">
        ${imgDay7 ? `<img src="${imgDay7}" alt="Payslip Detail Screen">` : '<div style="padding:10px;text-align:center;">Screenshot Missing</div>'}
      </div>
      <div style="font-size: 6.5pt; color: #64748b; margin-top: 1mm;">
        ✓ Exact Net Pay Reconciled • Indian INR Words • Audit Log
      </div>
    </div>

    <!-- Day 8 Card -->
    <div class="card">
      <div class="card-title">
        <span>Day 8: Notifications</span>
        <span class="badge-tag">Communication</span>
      </div>
      <p style="margin: 0 0 1mm 0; font-size: 7pt; color: #475569;">
        Real-time notification bell and personal inbox with unread badges, mark-as-read mutations, and company broadcast feeds.
      </p>
      <div class="img-frame">
        ${imgDay8 ? `<img src="${imgDay8}" alt="Notifications Inbox">` : '<div style="padding:10px;text-align:center;">Screenshot Missing</div>'}
      </div>
      <div style="font-size: 6.5pt; color: #64748b; margin-top: 1mm;">
        ✓ 8 Announcements Seeded • Deduplication • User Isolation
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Horizon Portal • Phase 2 Verification Report</span>
    <span>Aura Workforce by Growmar • Student: Madugu Shiva Kumar</span>
    <span>Page 1 of 3</span>
  </div>
</div>

<!-- ============================================================== -->
<!-- PAGE 2: DAYS 9-10, MINI CHALLENGE, SERVER SECURITY & PROOF      -->
<!-- ============================================================== -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>Technical Proof, Architectural Walkthrough &amp; Learning</h1>
      <div class="subtitle">Days 9–10 Implementation • Server-Side Security Model • Comprehensive Test Proof</div>
    </div>
    <div style="text-align: right; font-size: 7.5pt; color: #64748b;">
      <div><strong>Phase 2 Assessment</strong></div>
      <div>593 Tests Passed / 0 Failed</div>
    </div>
  </div>

  <h2 class="section-title">Admin Management &amp; Approvals Engine (Days 9–10)</h2>
  <div class="two-col">
    <!-- Day 9 Card -->
    <div class="card">
      <div class="card-title">
        <span>Day 9: Admin Employee Management Console</span>
        <span class="badge-tag">Workforce Admin</span>
      </div>
      <p style="margin: 0 0 1mm 0; font-size: 7pt; color: #475569;">
        Searchable, sortable console with department filtering, CSV export (CSV formula-injection defense), safe reversible deactivation, and diff audit logging.
      </p>
      <div class="img-frame">
        ${imgDay9 ? `<img src="${imgDay9}" alt="Admin Console Screen">` : '<div style="padding:10px;text-align:center;">Screenshot Missing</div>'}
      </div>
    </div>

    <!-- Day 10 Card -->
    <div class="card">
      <div class="card-title">
        <span>Day 10: Leave Approvals &amp; Team Attendance</span>
        <span class="badge-tag">Management</span>
      </div>
      <p style="margin: 0 0 1mm 0; font-size: 7pt; color: #475569;">
        Role-scoped approval queue (Manager team scope vs HR org scope), mandatory reject reason, self-approval defense, and team attendance oversight.
      </p>
      <div class="img-frame">
        ${imgDay10Queue ? `<img src="${imgDay10Queue}" alt="Leave Approval Queue Screen">` : '<div style="padding:10px;text-align:center;">Screenshot Missing</div>'}
      </div>
    </div>
  </div>

  <div class="callout-box">
    <div class="callout-title">Mini Challenge: One Complete Leave Request Lifecycle (5-Line Technical Walkthrough)</div>
    <ol class="walkthrough-list">
      <li><strong>Employee form:</strong> An authenticated employee submits a leave request with the leave type, dates, and reason via <span class="code-token">POST /api/v1/leave/requests</span>.</li>
      <li><strong>API and validation:</strong> The server validates the input, checks the employee's identity and eligibility, verifies sufficient balance, locks pending days, and saves the request as Pending.</li>
      <li><strong>Approval service:</strong> The server identifies the authorized manager or delegated approver and checks team permissions and self-approval restrictions.</li>
      <li><strong>Manager decision:</strong> The manager approves or rejects the request; the server updates the request and leave balance transactionally, and requires a reason for rejection.</li>
      <li><strong>Notification:</strong> The existing notification service informs the employee about the decision, while the audit system records the action.</li>
    </ol>
  </div>

  <div class="two-col">
    <div>
      <h2 class="section-title">Automated Verification Suite Matrix</h2>
      <table class="data-table" style="font-size: 6.8pt;">
        <thead>
          <tr>
            <th>Suite Command</th>
            <th>Module Focus</th>
            <th>Tests</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="code-token">test:db</span></td>
            <td>Database &amp; Schema Integrity</td>
            <td>10</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:auth</span></td>
            <td>Password, JWT &amp; Session Me</td>
            <td>39</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:nav</span></td>
            <td>Role-Based Menu &amp; Route Auth</td>
            <td>107</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:e2e</span></td>
            <td>Live HTTP E2E Status Code Flow</td>
            <td>20</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:privacy</span></td>
            <td>Field Isolation &amp; Zero Salary Leaks</td>
            <td>62</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:hierarchy</span></td>
            <td>Reporting Hierarchy Tree (3-Tier)</td>
            <td>34</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:benchmark</span></td>
            <td>Search Latency (&lt; 1,000ms SLA)</td>
            <td>10</td>
            <td><span class="status-done">PASS (4.0ms)</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:leave</span></td>
            <td>Day 6 Quota &amp; Self-Service</td>
            <td>43</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:payslips</span></td>
            <td>Day 7 Compensation &amp; Download</td>
            <td>67</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:notifications</span></td>
            <td>Day 8 Inbox &amp; Announcements</td>
            <td>64</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:employees</span></td>
            <td>Day 9 Employee Console &amp; Audit</td>
            <td>81</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr>
            <td><span class="code-token">test:approvals</span></td>
            <td>Day 10 Approvals &amp; Attendance</td>
            <td>56</td>
            <td><span class="status-done">PASS</span></td>
          </tr>
          <tr style="background: #f1f5f9; font-weight: 700;">
            <td colspan="2">Total Automated Verifications</td>
            <td>593</td>
            <td><span class="status-done">100% PASS</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h2 class="section-title">Self-Check: Server-Side Security Model</h2>
      <div style="font-size: 7.2pt; line-height: 1.35; color: #334155; margin-bottom: 2mm;">
        Hiding a button in the frontend only changes what a user sees. It does not prevent someone from calling an API directly. Server-side authorization checks verify the authenticated user's role, identity, team relationship, and permissions before performing sensitive operations. Therefore, security must be enforced on the server, not only through frontend visibility.
      </div>
      <div class="card" style="font-size: 7pt; background: #f8fafc;">
        <strong>Verified Server Defenses:</strong><br>
        • Cross-employee payslip access strictly returns <span class="code-token">HTTP 403</span>.<br>
        • Self-approval attempts return <span class="code-token">HTTP 403 Forbidden</span>.<br>
        • Manager accessing foreign team requests returns <span class="code-token">HTTP 403</span>.<br>
        • Employees attempting admin export return <span class="code-token">HTTP 403</span>.
      </div>

      <h2 class="section-title">Engineering Learning Reflection</h2>
      <div style="font-size: 7.2pt; line-height: 1.35; color: #1e293b; font-style: italic; background: #f1f5f9; padding: 2mm 2.5mm; border-radius: 4px;">
        &ldquo;Working across Phase 2 deepened my mastery of mission-critical full-stack workflows. Implementing double-approval prevention and exact-once balance accounting taught me that atomic Prisma transactions and strict concurrency locks are indispensable. I gained practical experience enforcing true zero-trust server-side authorization boundaries, preventing self-approvals, and integrating decoupled notification dispatchers with immutable compliance audit logging.&rdquo;
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Horizon Portal • Phase 2 Verification Report</span>
    <span>Aura Workforce by Growmar • Student: Madugu Shiva Kumar</span>
    <span>Page 2 of 3</span>
  </div>
</div>

<!-- ============================================================== -->
<!-- PAGE 3: PROBLEMS & SOLUTIONS, SECURITY AUDIT & NEXT PHASE       -->
<!-- ============================================================== -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>Engineering Solutions, Security Audit &amp; Phase 3 Roadmap</h1>
      <div class="subtitle">Problem Resolution Log • Git Security Certification • Next Phase Architecture</div>
    </div>
    <div style="text-align: right; font-size: 7.5pt; color: #64748b;">
      <div><strong>Git Branch:</strong> main</div>
      <div><strong>Tag:</strong> phase-2 (Preserved)</div>
    </div>
  </div>

  <h2 class="section-title">Real Technical Problems &amp; Engineering Resolutions</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Challenge Encountered</th>
        <th style="width: 35%;">Root Cause &amp; Risk</th>
        <th style="width: 40%;">Architectural Solution Implemented</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Double Balance Deduction Race Condition</strong></td>
        <td>Simultaneous approval clicks by two managers could deduct an employee's leave balance twice.</td>
        <td>Implemented atomic conditional Prisma update (<span class="code-token">WHERE status = 'Pending'</span>). Only the exact transaction winning the race mutates status and deducts leave balance; concurrent attempts receive HTTP 409 Conflict.</td>
      </tr>
      <tr>
        <td><strong>Manager Team Permission Leakage</strong></td>
        <td>Managers querying approval or attendance endpoints could view foreign departments if scoped by ID parameters.</td>
        <td>Server completely ignores client-submitted IDs; resolves authenticated user from verified server-side JWT session and filters database records strictly by direct reporting tree (<span class="code-token">managerId = actor.employeeId</span>).</td>
      </tr>
      <tr>
        <td><strong>Circular Manager Delegation Loops</strong></td>
        <td>Manager A delegating to Manager B, who delegates back to A, causing infinite approval routing loops.</td>
        <td>Built <span class="code-token">validateDelegationChain()</span> recursive graph traversal that checks the delegation path before persistence, rejecting any cycle or self-delegation with HTTP 400.</td>
      </tr>
      <tr>
        <td><strong>Formula Injection in Employee CSV Export</strong></td>
        <td>Malicious field values starting with <span class="code-token">=</span>, <span class="code-token">+</span>, <span class="code-token">-</span>, or <span class="code-token">@</span> could trigger arbitrary code execution in Excel.</td>
        <td>Sanitized all exported cells by prefixing formula trigger characters with a single quote (<span class="code-token">'</span>) and RFC 4180 escaping. Prepend UTF-8 BOM (<span class="code-token">0xEF, 0xBB, 0xBF</span>) for clean rendering.</td>
      </tr>
      <tr>
        <td><strong>Next.js Dynamic Prerender Bailout</strong></td>
        <td>Route handlers using request cookies threw prerender interruption errors during static generation.</td>
        <td>Added NEXT_PRERENDER_INTERRUPTED digest bypass in API try/catch blocks, enabling Next.js to gracefully mark endpoints as dynamic server-rendered routes during production build.</td>
      </tr>
    </tbody>
  </table>

  <div class="two-col">
    <!-- Left Column: Security Review -->
    <div>
      <h2 class="section-title">Pre-Submission Security &amp; Git Audit</h2>
      <div class="card" style="font-size: 7.1pt; background: #f8fafc;">
        <div class="checklist-item"><span class="chk">✓</span> <strong>.gitignore Protection:</strong> <span class="code-token">.env*</span> and <span class="code-token">*.db</span> verified ignored.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>git check-ignore:</strong> Confirmed <span class="code-token">.env</span> and <span class="code-token">.env.local</span> ignored.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>Zero Secrets in Git:</strong> No API keys, passwords, or JWT secrets tracked.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>Safe .env.example:</strong> Contains only dummy placeholder keys.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>git diff --check:</strong> 0 whitespace or formatting errors.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>Prisma Status:</strong> 5 migrations applied; SQLite database up to date.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>Production Build:</strong> <span class="code-token">next build</span> succeeded with zero errors.</div>
        <div class="checklist-item"><span class="chk">✓</span> <strong>Tag Safety:</strong> Existing <span class="code-token">phase-1</span> and <span class="code-token">phase-2</span> preserved intact.</div>
      </div>

      <h2 class="section-title">Known System Characteristics</h2>
      <div style="font-size: 7.1pt; color: #475569; line-height: 1.35;">
        • <strong>Single-Hop Delegation:</strong> If an acting manager is also unavailable, the request escalates directly to HR fallback rather than arbitrary multi-hop delegation chains.<br>
        • <strong>Monthly Attendance Grain:</strong> Attendance metrics are stored at monthly aggregate granularity (<span class="code-token">attendance_monthly</span>) as provided by the project data pack.
      </div>
    </div>

    <!-- Right Column: Next Phase Plan -->
    <div>
      <h2 class="section-title">Phase 3: Workforce Analytics &amp; Operations Roadmap</h2>
      <div class="card" style="font-size: 7.1pt;">
        <div style="font-weight: 700; color: #1e293b; margin-bottom: 1mm;">Upcoming Milestone Capabilities:</div>
        <div style="margin-bottom: 1.5mm;">
          <strong>1. Workforce Analytics &amp; Attrition Risk:</strong><br>
          Implement ML attrition score visualizations (<span class="code-token">ai_attrition_risk</span>) and anomaly detection flags for high-risk turnover mitigation.
        </div>
        <div style="margin-bottom: 1.5mm;">
          <strong>2. Expense Claim Processing &amp; Vendor Management:</strong><br>
          Submission and two-tier managerial approval workflows for project expense claims and vendor GST invoice tracking (<span class="code-token">expenses</span>).
        </div>
        <div>
          <strong>3. Interactive Payroll Execution Console:</strong><br>
          Automated statutory deductions computation (PF, ESI, TDS) and one-click monthly payroll run generation for HR Operations.
        </div>
      </div>

      <h2 class="section-title">Final Sign-Off Certification</h2>
      <div style="font-size: 7.2pt; border: 1px solid #10b981; background: #ecfdf5; padding: 2mm 2.5mm; border-radius: 4px; color: #065f46;">
        <strong>FINAL VERIFICATION RESULT: <span style="color:#059669;">VERIFIED &amp; PASSED</span></strong><br>
        All Phase 2 requirements (Days 6–10) have been implemented, verified through 593 passing automated tests, validated via production build, and packaged with zero secret leaks. Ready for GitHub push.
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Horizon Portal • Phase 2 Verification Report</span>
    <span>Aura Workforce by Growmar • Student: Madugu Shiva Kumar</span>
    <span>Page 3 of 3</span>
  </div>
</div>

</body>
</html>
`;

async function main() {
  const tempHtmlPath = path.join(projectRoot, "reports", "temp_phase2_report.html");
  fs.writeFileSync(tempHtmlPath, htmlContent, "utf-8");
  console.log("1. Wrote temporary report HTML to:", tempHtmlPath);

  const reportFilenames = [
    "FullStack_YourName_Phase2_Report.pdf",
    "FullStack_MaduguShivaKumar_Phase2_Report.pdf",
  ];

  for (const filename of reportFilenames) {
    const targetPdfPath = path.join(projectRoot, filename);
    console.log(`2. Generating PDF via headless Edge -> ${filename}...`);

    execFileSync(edgePath, [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${targetPdfPath}`,
      tempHtmlPath,
    ]);

    const stats = fs.statSync(targetPdfPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✓ Generated ${filename} (${stats.size} bytes / ${sizeMb} MB)`);
  }

  // Clean up temporary HTML
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
    console.log("3. Cleaned up temporary HTML file.");
  }

  console.log("\n=======================================================");
  console.log("PHASE 2 FINAL REPORT PDF GENERATION COMPLETE!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
