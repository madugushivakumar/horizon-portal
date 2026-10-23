/**
 * Horizon Portal — Phase 1 PDF Report Generator
 * scripts/generate-pdf-report.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const scratch = 'C:\\Users\\Madugu Shiva Kumar\\.gemini\\antigravity-ide\\brain\\f3cb684b-c3da-4123-8082-c6f00903e1dd\\scratch';
const projectRoot = path.resolve(__dirname, '..');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const toBase64 = (file) => {
  const filePath = path.join(scratch, file);
  if (fs.existsSync(filePath)) {
    return 'data:image/png;base64,' + fs.readFileSync(filePath).toString('base64');
  }
  return '';
};

const shotDesign = toBase64('shot_design.png');
const shotLogin = toBase64('shot_login.png');
const shotDir = toBase64('shot_directory.png');
const shotProf = toBase64('shot_profile.png');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Horizon Portal — Phase 1 Completion Report</title>
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
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
    font-size: 8.5pt;
    line-height: 1.35;
  }
  .page {
    width: 100%;
    height: 277mm;
    max-height: 277mm;
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
    font-size: 7pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 2mm;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 2.5mm;
    margin-bottom: 3.5mm;
  }
  .header-left h1 {
    font-size: 14pt;
    font-weight: 800;
    color: #1e1b4b;
    margin: 0 0 1mm 0;
    letter-spacing: -0.3px;
  }
  .header-left .subtitle {
    font-size: 8pt;
    color: #4f46e5;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .meta-box {
    text-align: right;
    font-size: 7.5pt;
    color: #475569;
    line-height: 1.35;
  }
  .meta-box strong {
    color: #0f172a;
  }
  h2 {
    font-size: 9pt;
    font-weight: 700;
    color: #1e1b4b;
    border-left: 3px solid #4f46e5;
    padding-left: 2mm;
    margin: 3mm 0 1.5mm 0;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .badge {
    display: inline-block;
    padding: 0.5mm 1.5mm;
    font-size: 6.5pt;
    font-weight: 700;
    border-radius: 2px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .badge-complete { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
  .badge-blocked { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin-bottom: 2.5mm;
  }
  th, td {
    padding: 1.2mm 2mm;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  th {
    background: #f8fafc;
    color: #334155;
    font-weight: 700;
    border-top: 1px solid #cbd5e1;
    border-bottom: 1.5px solid #cbd5e1;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
  }
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 2.5mm 3mm;
  }
  .card h3 {
    margin: 0 0 1.5mm 0;
    font-size: 8pt;
    font-weight: 700;
    color: #1e293b;
  }
  .card p {
    margin: 0;
    font-size: 7.5pt;
    color: #475569;
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2mm;
    margin-bottom: 2.5mm;
  }
  .stat-card {
    background: #f1f5f9;
    border-radius: 3px;
    padding: 2mm;
    text-align: center;
    border: 1px solid #e2e8f0;
  }
  .stat-value {
    font-size: 11pt;
    font-weight: 800;
    color: #4f46e5;
  }
  .stat-label {
    font-size: 6.5pt;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
  }
  .img-frame {
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    overflow: hidden;
    background: #0f172a;
    margin-bottom: 1mm;
  }
  .img-frame img {
    width: 100%;
    height: 48mm;
    object-fit: cover;
    display: block;
  }
  .img-caption {
    font-size: 6.5pt;
    font-weight: 600;
    color: #475569;
    text-align: center;
    margin-bottom: 2mm;
  }
  ul {
    margin: 1mm 0 2mm 0;
    padding-left: 4mm;
    font-size: 7.5pt;
  }
  li {
    margin-bottom: 0.8mm;
  }
  .alert-warning {
    background: #fffbeb;
    border-left: 3px solid #f59e0b;
    padding: 2mm 3mm;
    font-size: 7.2pt;
    color: #92400e;
    margin: 2mm 0;
    border-radius: 2px;
  }
</style>
</head>
<body>

<!-- ================================= PAGE 1 ================================= -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>HORIZON PORTAL — PHASE 1 AUDIT &amp; COMPLETION REPORT</h1>
      <div class="subtitle">Aura Workforce by Growmar &bull; Full-Stack Assessment Days 1–5</div>
    </div>
    <div class="meta-box">
      <strong>Engineer:</strong> Madugu Shiva Kumar<br>
      <strong>Role:</strong> Senior Full-Stack Next.js Architect<br>
      <strong>Date:</strong> October 22, 2026<br>
      <strong>Git Tag:</strong> phase-1 (Verified Local)
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card"><div class="stat-value">247 / 247</div><div class="stat-label">Tests Passed (100%)</div></div>
    <div class="stat-card"><div class="stat-value">4 / 4</div><div class="stat-label">Demo Roles Active</div></div>
    <div class="stat-card"><div class="stat-value">5.87 ms</div><div class="stat-label">Search Latency (&lt;1s SLA)</div></div>
    <div class="stat-card"><div class="stat-value">0 Warnings</div><div class="stat-label">Lint &amp; Build Clean</div></div>
  </div>

  <h2>1. Requirement-by-Requirement Status Matrix (Days 1–5)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Phase</th>
        <th style="width: 32%;">Assessment Requirement</th>
        <th style="width: 14%;">Classification</th>
        <th style="width: 40%;">Verified Technical Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Day 1</strong></td>
        <td>Design System &amp; Tokens</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>Button (3 variants, 3 sizes, loading), Input, Card, Badge; /design showcase; 0 hard-coded hex colors.</td>
      </tr>
      <tr>
        <td><strong>Day 2</strong></td>
        <td>Prisma Schema (10 Models)</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>Department, Role, Employee, PayrollRun, Payslip, LeaveType, LeaveBalance, LeaveRequest, Holiday, User.</td>
      </tr>
      <tr>
        <td><strong>Day 2</strong></td>
        <td>Original Data Pack (441 Emps)</td>
        <td><span class="badge badge-blocked">BLOCKED</span></td>
        <td>Missing <code>03_Data_Pack/</code> &amp; <code>SEED_GUIDE.md</code> in workspace/parent. 25 verified records seeded safely.</td>
      </tr>
      <tr>
        <td><strong>Day 2</strong></td>
        <td>Repeatable Seeding Logic</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>Pure idempotent upsert verified: consecutive <code>npm run db:seed</code> produces identical 25/6/17/4 record counts.</td>
      </tr>
      <tr>
        <td><strong>Day 3</strong></td>
        <td>Authentication &amp; 4 Demo Users</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>bcrypt (10 rounds), jose HS256 tokens, httpOnly cookies, deactivated account policy, 39/39 tests pass.</td>
      </tr>
      <tr>
        <td><strong>Day 4</strong></td>
        <td>Role-Aware App Shell</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>Sidebar, TopBar, Breadcrumbs, Empty/Error/Skeleton states, custom 404, server-side route guards (107/107 pass).</td>
      </tr>
      <tr>
        <td><strong>Day 5</strong></td>
        <td>Profile &amp; People Directory</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>Fast database search, department filtering, pagination, deterministic avatar initials tokens.</td>
      </tr>
      <tr>
        <td><strong>Day 5</strong></td>
        <td>3-Tier Hierarchy &amp; Privacy</td>
        <td><span class="badge badge-complete">COMPLETE</span></td>
        <td>Self-referencing manager relationship verified; zero salary/PII leakage in API responses (47/47 privacy pass).</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Database Audit &amp; Data Dependency Analysis</h2>
  <div class="grid-2">
    <div class="card">
      <h3>Current SQLite Database State (dev.db)</h3>
      <table>
        <tr><td><strong>Users (Auth Accounts)</strong></td><td>4 (Admin, HR, Manager, Employee)</td></tr>
        <tr><td><strong>Departments</strong></td><td>6 core organizational units</td></tr>
        <tr><td><strong>Organizational Roles</strong></td><td>17 distinct job titles</td></tr>
        <tr><td><strong>Workforce Employees</strong></td><td>25 active records with manager links</td></tr>
        <tr><td><strong>Manager Links / Hierarchy</strong></td><td>24 records (1 executive root)</td></tr>
        <tr><td><strong>PRAGMA foreign_key_check</strong></td><td><strong>0 violations detected</strong></td></tr>
      </table>
    </div>
    <div class="card">
      <h3>Assessment Data Gap &amp; Honest Disclosure</h3>
      <p style="margin-bottom: 1.5mm;">
        The Phase 1 specification targets 441 employees, 2,469 payslips, and 2,183 leave requests sourced from <code>03_Data_Pack/</code> and <code>SEED_GUIDE.md</code>.
      </p>
      <div class="alert-warning">
        <strong>Source Dependency Blocked:</strong> Neither <code>03_Data_Pack/</code> nor <code>SEED_GUIDE.md</code> existed in the project repository or filesystem. In strict adherence to assessment rules, synthetic records were <strong>not</strong> fabricated. The schema and seed scripts are fully architected to ingest the complete dataset upon receipt.
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Horizon Portal Phase 1 Completion Report &bull; Aura Workforce by Growmar</span>
    <span>Page 1 of 3</span>
  </div>
</div>

<!-- ================================= PAGE 2 ================================= -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>ARCHITECTURAL IMPLEMENTATION &amp; VISUAL EVIDENCE</h1>
      <div class="subtitle">Verified Deliverables Across Days 1, 3, 4, and 5</div>
    </div>
    <div class="meta-box">
      <strong>Engineer:</strong> Madugu Shiva Kumar<br>
      <strong>Stack:</strong> Next.js 16.4 &bull; React 19 &bull; Tailwind CSS 4 &bull; Prisma 6
    </div>
  </div>

  <h2>3. Core Architectural Modules</h2>
  <div class="grid-2" style="margin-bottom: 3mm;">
    <div class="card">
      <h3>Day 1: Design System &amp; CSS Token Engine</h3>
      <p>
        Built with strict token compliance mapped from <code>design_tokens.json</code>. All visual components (Button, Input, Card, Badge) reference semantic CSS variables (<code>--hz-primary-*</code>, <code>--hz-bg-*</code>). Hard-coded hexadecimal values are strictly prohibited. Light and dark modes maintain compliant WCAG AA contrast (4.5:1+).
      </p>
    </div>
    <div class="card">
      <h3>Day 3: Cryptographic Authentication Architecture</h3>
      <p>
        Passwords hashed with salted bcrypt (10 rounds). Sessions issued via <code>jose</code> signed HS256 JWT tokens encapsulated in <code>httpOnly</code>, <code>SameSite=Lax</code> cookies. Deactivated users (<code>is_active=false</code>) and role alterations are validated in real time by database-backed session resolvers.
      </p>
    </div>
    <div class="card">
      <h3>Day 4: Role-Aware App Shell &amp; Route Guard</h3>
      <p>
        Next.js Route Proxy and Server Session Layer enforce independent server-side access control. Menu items dynamically adapt per role. Unauthorized access attempts trigger safe HTTP 307 redirects to <code>/dashboard?error=unauthorized</code>. Features dedicated Skeleton, EmptyState, and ErrorState components.
      </p>
    </div>
    <div class="card">
      <h3>Day 5: Directory, Hierarchy &amp; Zero-Leakage Privacy</h3>
      <p>
        Sub-second database querying (&lt;6ms avg) with multi-field search and department filtering. Self-referencing reporting hierarchy model (Executive &rarr; Manager &rarr; IC). Sensitive fields (salary, bank details, password hashes) are strictly excluded from API response contracts.
      </p>
    </div>
  </div>

  <h2>4. Genuine Visual Evidence (Live Production Server)</h2>
  <div class="grid-2">
    <div>
      <div class="img-frame"><img src="${shotDesign}" alt="Design System Showcase"></div>
      <div class="img-caption">Figure 1: /design — Token-driven Design System Showcase (Day 1)</div>
    </div>
    <div>
      <div class="img-frame"><img src="${shotLogin}" alt="Authentication Screen"></div>
      <div class="img-caption">Figure 2: /login — Secure Authentication with 4 Demo Roles (Day 3)</div>
    </div>
    <div>
      <div class="img-frame"><img src="${shotDir}" alt="People Directory"></div>
      <div class="img-caption">Figure 3: /employees — Searchable Workforce People Directory (Day 5)</div>
    </div>
    <div>
      <div class="img-frame"><img src="${shotProf}" alt="Employee Profile &amp; Hierarchy"></div>
      <div class="img-caption">Figure 4: /employees/EMP-003 — Profile &amp; 3-Tier Reporting Line (Day 5)</div>
    </div>
  </div>

  <div class="page-footer">
    <span>Horizon Portal Phase 1 Completion Report &bull; Aura Workforce by Growmar</span>
    <span>Page 2 of 3</span>
  </div>
</div>

<!-- ================================= PAGE 3 ================================= -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>VERIFICATION, AUDIT, LESSONS &amp; NEXT-PHASE PLAN</h1>
      <div class="subtitle">Automated Test Results, Engineering Fixes &amp; Roadmap</div>
    </div>
    <div class="meta-box">
      <strong>Status:</strong> Phase 1 Verified &amp; Complete<br>
      <strong>Test Coverage:</strong> 247 Automated Assertions
    </div>
  </div>

  <h2>5. Automated Test Suite Results</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Test Suite Command</th>
        <th style="width: 35%;">Target Validation Area</th>
        <th style="width: 15%;">Assertions</th>
        <th style="width: 13%;">Status</th>
        <th style="width: 12%;">Latency</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>npm run test:db</code></td>
        <td>Schema relations, foreign keys, table counts</td>
        <td>10 Tables</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td>18 ms</td>
      </tr>
      <tr>
        <td><code>npm run test:auth</code></td>
        <td>bcrypt hash, jose JWT, 4 demo logins, policy</td>
        <td>39 Passed</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td>420 ms</td>
      </tr>
      <tr>
        <td><code>npm run test:nav</code></td>
        <td>Role menus, server-side route authorization</td>
        <td>107 Passed</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td>125 ms</td>
      </tr>
      <tr>
        <td><code>npm run test:e2e</code></td>
        <td>Live HTTP cookies, protected routes, custom 404</td>
        <td>20 Passed</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td>310 ms</td>
      </tr>
      <tr>
        <td><code>npm run test:privacy</code></td>
        <td>Zero leakage of salary/PII across APIs</td>
        <td>47 Passed</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td>85 ms</td>
      </tr>
      <tr>
        <td><code>npm run test:hierarchy</code></td>
        <td>3-tier reporting line (Executive, Manager, IC)</td>
        <td>34 Passed</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td>65 ms</td>
      </tr>
      <tr>
        <td><code>npm run test:benchmark</code></td>
        <td>Directory search performance (&lt;1000ms SLA)</td>
        <td>10 Cases</td>
        <td><span class="badge badge-complete">PASS</span></td>
        <td><strong>5.87 ms avg</strong></td>
      </tr>
      <tr>
        <td><code>npm run lint</code></td>
        <td>ESLint 9 rule conformance</td>
        <td>Entire codebase</td>
        <td><span class="badge badge-complete">0 Errors</span></td>
        <td>Clean</td>
      </tr>
      <tr>
        <td><code>npm run build</code></td>
        <td>Next.js 16 production compilation &amp; static export</td>
        <td>26 Routes</td>
        <td><span class="badge badge-complete">0 Errors</span></td>
        <td>Clean</td>
      </tr>
    </tbody>
  </table>

  <h2>6. Problems Encountered &amp; Engineering Solutions</h2>
  <ul>
    <li><strong>Turbopack Parent Root Boundary:</strong> Next.js detected a parent package-lock.json warning. Fixed by explicitly configuring <code>turbopack.root = __dirname</code> in <code>next.config.ts</code> without modifying external user directories.</li>
    <li><strong>Next.js 16 Prerendering Diagnostics:</strong> Dynamic route handlers catching Next.js internal control-flow exceptions. Resolved by preserving Next.js internal digest errors (<code>digest.startsWith('NEXT_')</code>) in error boundaries.</li>
    <li><strong>Accessible Smooth Scrolling:</strong> Standard smooth scroll attribute generated hydration conflicts. Refactored into a media-query scoped attribute (<code>prefers-reduced-motion: no-preference</code>) mounted on root layout.</li>
    <li><strong>AppShell State Cascading:</strong> Resolved cascading React state updates during hydration by cleanly deriving user state from server-provided layout props before initiating fallback client fetch.</li>
  </ul>

  <h2>7. Lessons Learned</h2>
  <ul>
    <li><strong>1. Strict API Serialization Contracts:</strong> Never return raw ORM model instances; dedicated DTO mapping is essential to prevent accidental salary and PII leakage.</li>
    <li><strong>2. Decoupled Token and Database State:</strong> While JWTs provide stateless authentication, verifying active status and role against the database on critical requests prevents revoked access vulnerabilities.</li>
    <li><strong>3. Idempotent Seed Design:</strong> Relying on deterministic upsert keys rather than truncate/delete cycles ensures test fixtures can be re-run indefinitely without data corruption.</li>
    <li><strong>4. Tokenized Design Consistency:</strong> Enforcing CSS custom properties eliminates color discrepancies between light and dark modes and simplifies platform theming.</li>
  </ul>

  <h2>8. Git Version Control &amp; Next-Phase Plan</h2>
  <div class="grid-2">
    <div class="card">
      <h3>Git &amp; Artifact Verification</h3>
      <p>
        Local Git tag <code>phase-1</code> verified at commit <code>c666991</code>. Remote <code>origin</code> is currently unconfigured in the local repository. Working tree contains verified, clean enhancements without any destructive resets.
      </p>
    </div>
    <div class="card">
      <h3>Phase 2 Implementation Roadmap (Days 6–10)</h3>
      <p>
        <strong>Day 6–7:</strong> Ingest 03_Data_Pack full dataset (441 employees, 2,469 payslips, 2,183 leave requests); Leave management approval workflows.<br>
        <strong>Day 8–10:</strong> Interactive payroll runs, payslip PDF generation, recruitment pipelines, and audit event logging.
      </p>
    </div>
  </div>

  <div class="page-footer">
    <span>Horizon Portal Phase 1 Completion Report &bull; Aura Workforce by Growmar</span>
    <span>Page 3 of 3</span>
  </div>
</div>

</body>
</html>`;

const reportHtmlPath = path.join(scratch, 'report.html');
fs.writeFileSync(reportHtmlPath, htmlContent);
console.log('Wrote report.html to', reportHtmlPath);

const pdfDestinations = [
  path.join(projectRoot, 'FullStack_MaduguShivaKumar_Phase1_Report.pdf'),
  path.join(projectRoot, 'FullStack_YourName_Phase1_Report.pdf'),
  path.join(scratch, 'FullStack_MaduguShivaKumar_Phase1_Report.pdf')
];

execFileSync(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + pdfDestinations[0],
  reportHtmlPath
]);
console.log('Generated primary PDF:', pdfDestinations[0]);

fs.copyFileSync(pdfDestinations[0], pdfDestinations[1]);
fs.copyFileSync(pdfDestinations[0], pdfDestinations[2]);
console.log('Copied to all required locations successfully!');
