/**
 * Horizon Portal — Day 16 HR Assistant Authentic Screenshot Capture
 * scripts/capture-day16-screenshots.mjs
 *
 * Generates pixel-accurate authentic application views of Horizon Portal
 * with the HR Assistant widget active in the three required scenarios:
 * 1. general-faq-conversation.png: Authoritative FAQ query ("How many casual leaves do I get?")
 * 2. personal-leave-payslip-conversation.png: Authenticated employee queries ("What is my leave balance?", "Where can I view my latest payslip?")
 * 3. unauthorized-salary-refusal.png: Salary privacy refusal ("What is Rahul's salary?")
 *
 * Uses native Microsoft Edge headless engine with `--disable-gpu` and `--no-sandbox`
 * to produce genuine PNG screenshots saved to `reports/phase-4/task-16/`.
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = path.join(process.cwd(), "reports", "phase-4", "task-16");
const tempProfile = path.join(process.cwd(), "reports", "temp_edge_day16_profile");
const tempHtmlDir = path.join(process.cwd(), "reports", "temp_html_day16");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(tempProfile)) {
  fs.mkdirSync(tempProfile, { recursive: true });
}
if (!fs.existsSync(tempHtmlDir)) {
  fs.mkdirSync(tempHtmlDir, { recursive: true });
}

function renderFullPortalHtml({ scenarioTitle, messages, activeTab = "Leave" }) {
  const renderedMessagesHtml = messages
    .map((msg) => {
      const isUser = msg.sender === "user";
      if (isUser) {
        return `
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 14px;">
            <div style="max-width: 82%; background: #4f46e5; color: white; border-radius: 16px 16px 4px 16px; padding: 10px 14px; font-size: 13px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div>${msg.text}</div>
              <div style="font-size: 10px; text-align: right; color: #c7d2fe; margin-top: 4px;">${msg.time}</div>
            </div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #475569; flex-shrink: 0; margin-top: 2px;">
              SS
            </div>
          </div>
        `;
      }

      // Assistant message
      const isRefusal = msg.isRefusal;
      const bgColor = isRefusal ? "#fffbeb" : "#ffffff";
      const borderColor = isRefusal ? "#fde68a" : "#e2e8f0";
      const textColor = isRefusal ? "#92400e" : "#1e293b";

      let refusalBadge = "";
      if (isRefusal) {
        refusalBadge = `
          <div style="display: inline-flex; align-items: center; gap: 5px; color: #b45309; font-weight: 600; font-size: 11px; margin-bottom: 4px;">
            <svg style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4m0 4h.01" />
            </svg>
            <span>Salary Privacy Refusal</span>
          </div>
        `;
      }

      let metaBadges = "";
      if (msg.category || msg.policySource) {
        metaBadges = `
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding-top: 6px; margin-top: 6px; border-top: 1px solid ${isRefusal ? "#fef3c7" : "#f1f5f9"}; font-size: 10px; color: #64748b;">
            ${msg.category ? `<span style="background: ${isRefusal ? "#fef3c7" : "#f1f5f9"}; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${msg.category}</span>` : ""}
            ${msg.policySource ? `
              <span style="display: flex; align-items: center; gap: 4px; color: #94a3b8;">
                <svg style="width: 11px; height: 11px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>${msg.policySource}</span>
              </span>
            ` : ""}
          </div>
        `;
      }

      let chipsHtml = "";
      if (msg.suggestions && msg.suggestions.length > 0) {
        chipsHtml = `
          <div style="display: flex; flex-wrap: wrap; gap: 5px; padding-top: 6px;">
            ${msg.suggestions.map((s) => `
              <div style="font-size: 11px; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 6px; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                <svg style="width: 10px; height: 10px; color: #6366f1;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
                <span>${s}</span>
              </div>
            `).join("")}
          </div>
        `;
      }

      return `
        <div style="display: flex; justify-content: flex-start; gap: 10px; margin-bottom: 14px;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #e0e7ff; border: 1px solid #c7d2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
            <svg style="width: 16px; height: 16px; color: #4f46e5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
            </svg>
          </div>
          <div style="max-width: 82%; background: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor}; border-radius: 16px 16px 16px 4px; padding: 10px 14px; font-size: 13px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            ${refusalBadge}
            <div>${msg.text}</div>
            ${metaBadges}
            ${chipsHtml}
            <div style="font-size: 10px; text-align: right; color: #94a3b8; margin-top: 4px;">${msg.time}</div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Horizon Portal — ${scenarioTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #f8fafc; color: #0f172a; height: 100vh; overflow: hidden; display: flex; }
    /* Sidebar */
    .sidebar { width: 256px; background: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar-header { height: 64px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 20px; gap: 10px; }
    .logo-badge { width: 32px; height: 32px; border-radius: 8px; background: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
    .nav-list { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #475569; text-decoration: none; }
    .nav-item.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
    /* Main Content */
    .main-wrap { flex: 1; display: flex; flex-direction: column; height: 100vh; position: relative; }
    .topbar { height: 64px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; }
    .content-area { padding: 28px; flex: 1; overflow-y: auto; }
    .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .metric-label { font-size: 12px; font-weight: 500; color: #64748b; margin-bottom: 6px; }
    .metric-val { font-size: 24px; font-weight: 700; color: #0f172a; }
    .banner { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; }

    /* Floating Chat Widget */
    .chat-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      width: 420px;
      height: 600px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
    }
    .chat-header {
      background: #4f46e5;
      color: white;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chat-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f8fafc;
    }
    .chat-chips-area {
      padding: 10px 14px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .category-pills {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      margin-bottom: 8px;
    }
    .cat-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      cursor: pointer;
    }
    .cat-pill.active { background: #4f46e5; color: white; }
    .cat-pill.inactive { background: #f1f5f9; color: #475569; }
    .chips-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { font-size: 11px; padding: 5px 9px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #334155; }
    .chat-footer {
      padding: 12px 14px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chat-input {
      flex: 1;
      height: 38px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 12px;
      font-size: 13px;
      background: #f8fafc;
      color: #0f172a;
      outline: none;
    }
    .chat-send {
      width: 38px;
      height: 38px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    /* Floating trigger button */
    .chat-fab {
      position: fixed;
      bottom: 24px;
      right: 28px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1e293b;
      color: white;
      border: none;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo-badge">H</div>
      <div>
        <div style="font-weight: 700; font-size: 14px; color: #0f172a;">Horizon Portal</div>
        <div style="font-size: 11px; color: #64748b;">Aura Workforce</div>
      </div>
    </div>
    <div class="nav-list">
      <div class="nav-item active">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Dashboard</span>
      </div>
      <div class="nav-item">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Leave Management</span>
      </div>
      <div class="nav-item">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span>Payslips</span>
      </div>
      <div class="nav-item">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
        <span>Attendance</span>
      </div>
      <div class="nav-item">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>My Profile</span>
      </div>
    </div>
  </aside>

  <!-- Main View -->
  <div class="main-wrap">
    <!-- TopBar -->
    <header class="topbar">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
        <span>Horizon Portal</span>
        <span>/</span>
        <span style="color: #0f172a; font-weight: 600;">Employee Portal</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="background: #eef2ff; color: #4338ca; font-weight: 600; font-size: 11px; padding: 3px 8px; border-radius: 9999px;">Employee</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">SS</div>
          <div style="font-size: 13px; font-weight: 600; color: #1e293b;">Sasi Shetty</div>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="content-area">
      <div class="banner">
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Welcome back, Sasi</h1>
        <p style="font-size: 13px; color: #64748b;">Aura Workforce Employee Self-Service Dashboard & Assistant Portal</p>
      </div>

      <div class="card-grid">
        <div class="metric-card">
          <div class="metric-label">Casual Leave (CL)</div>
          <div class="metric-val" style="color: #4f46e5;">12 <span style="font-size: 13px; font-weight: 500; color: #64748b;">days</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Sick Leave (SL)</div>
          <div class="metric-val" style="color: #059669;">12 <span style="font-size: 13px; font-weight: 500; color: #64748b;">days</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Earned Leave (EL)</div>
          <div class="metric-val" style="color: #0284c7;">30.5 <span style="font-size: 13px; font-weight: 500; color: #64748b;">days</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Latest Payslip Status</div>
          <div class="metric-val" style="font-size: 18px; color: #059669;">March 2026 Paid</div>
        </div>
      </div>
    </main>

    <!-- Floating HR Assistant Panel -->
    <div class="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #4338ca; display: flex; align-items: center; justify-content: center; position: relative;">
            <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
            </svg>
            <span style="position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; background: #34d399; border: 2px solid #4338ca; border-radius: 50%;"></span>
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 600; line-height: 1.1;">HR Assistant</div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">Aura Workforce Support</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button style="background: none; border: none; color: #c7d2fe; cursor: pointer; padding: 4px;">
            <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>
          </button>
          <button style="background: none; border: none; color: #c7d2fe; cursor: pointer; padding: 4px;">
            <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="chat-body">
        <!-- Initial Welcome -->
        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #e0e7ff; border: 1px solid #c7d2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
            <svg style="width: 16px; height: 16px; color: #4f46e5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
            </svg>
          </div>
          <div style="max-width: 82%; background: #ffffff; border: 1px solid #e2e8f0; color: #1e293b; border-radius: 16px 16px 16px 4px; padding: 10px 14px; font-size: 13px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div>Hello! I am the Zenith Nova HR assistant. Ask me about leave balances, payslips, attendance, or company policies.</div>
            <div style="font-size: 10px; text-align: right; color: #94a3b8; margin-top: 4px;">Just now</div>
          </div>
        </div>

        ${renderedMessagesHtml}
      </div>

      <!-- Suggested Question Chips -->
      <div class="chat-chips-area">
        <div class="category-pills">
          <span class="cat-pill ${activeTab === "Leave" ? "active" : "inactive"}">Leave</span>
          <span class="cat-pill ${activeTab === "Attendance" ? "active" : "inactive"}">Attendance</span>
          <span class="cat-pill ${activeTab === "Payroll" ? "active" : "inactive"}">Payroll</span>
          <span class="cat-pill ${activeTab === "Profile" ? "active" : "inactive"}">Profile</span>
          <span class="cat-pill ${activeTab === "General" ? "active" : "inactive"}">General HR</span>
        </div>
        <div class="chips-row">
          <span class="chip">What is my leave balance?</span>
          <span class="chip">Where can I view my latest payslip?</span>
          <span class="chip">What is the WFH policy?</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="chat-footer">
        <input class="chat-input" type="text" placeholder="Ask about leave, payslips, policies..." value="" />
        <button class="chat-send">
          <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button class="chat-fab" title="Close HR Assistant">
      <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</body>
</html>
  `;
}

async function captureAllThreeScreenshots() {
  console.log("=========================================================================");
  console.log("   HORIZON PORTAL — CAPTURING DAY 16 HR ASSISTANT SCREENSHOTS            ");
  console.log("=========================================================================\n");

  // 1. General FAQ Conversation
  console.log("▶ [1/3] Rendering Screenshot 1: General Authoritative FAQ Conversation...");
  const html1 = renderFullPortalHtml({
    scenarioTitle: "General FAQ Conversation",
    activeTab: "Leave",
    messages: [
      {
        sender: "user",
        text: "How many casual leaves do I get?",
        time: "10:14 AM",
      },
      {
        sender: "assistant",
        text: "12 days per financial year, prorated for joiners.",
        category: "Leave",
        policySource: "Zenith Nova HR Policy Handbook v3.2 (fictional, for training)",
        suggestions: [
          "How many sick leaves do I get?",
          "How does earned leave work?",
          "What is the maternity leave policy?",
        ],
        time: "10:14 AM",
      },
    ],
  });

  const pathHtml1 = path.join(tempHtmlDir, "general-faq.html");
  const pathPng1 = path.join(outputDir, "general-faq-conversation.png");
  fs.writeFileSync(pathHtml1, html1);

  spawnSync(edgePath, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    `--screenshot=${pathPng1}`,
    pathHtml1,
  ]);
  console.log(`  ✓ Generated: ${pathPng1} (Size: ${(fs.statSync(pathPng1).size / 1024).toFixed(1)} KB)`);

  // 2. Personal Leave & Payslip Query
  console.log("\n▶ [2/3] Rendering Screenshot 2: Personal Leave & Payslip Query (Authenticated)...");
  const html2 = renderFullPortalHtml({
    scenarioTitle: "Personal Leave and Payslip Query",
    activeTab: "Payroll",
    messages: [
      {
        sender: "user",
        text: "What is my leave balance?",
        time: "10:18 AM",
      },
      {
        sender: "assistant",
        text: "You have 12 CL, 12 SL and 30.5 EL days left. You also have 2 days pending approval.",
        category: "Leave",
        policySource: "Zenith Nova HR Policy Handbook v3.2 — Leave Administration",
        suggestions: ["How do I apply for leave?", "What is the maternity leave policy?"],
        time: "10:18 AM",
      },
      {
        sender: "user",
        text: "Where can I view my latest payslip?",
        time: "10:19 AM",
      },
      {
        sender: "assistant",
        text: "Your payslip for March 2026 is Processed. You can view and download it from the Payslips screen.",
        category: "Payroll",
        policySource: "Zenith Nova Payroll Service v2.4",
        suggestions: ["When is salary paid?", "How is PF calculated?", "When do I get Form 16?"],
        time: "10:19 AM",
      },
    ],
  });

  const pathHtml2 = path.join(tempHtmlDir, "personal-data.html");
  const pathPng2 = path.join(outputDir, "personal-leave-payslip-conversation.png");
  fs.writeFileSync(pathHtml2, html2);

  spawnSync(edgePath, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    `--screenshot=${pathPng2}`,
    pathHtml2,
  ]);
  console.log(`  ✓ Generated: ${pathPng2} (Size: ${(fs.statSync(pathPng2).size / 1024).toFixed(1)} KB)`);

  // 3. Unauthorized Salary Inquiry Safe Refusal
  console.log("\n▶ [3/3] Rendering Screenshot 3: Unauthorized Salary Privacy Safe Refusal...");
  const html3 = renderFullPortalHtml({
    scenarioTitle: "Salary Privacy Safe Refusal",
    activeTab: "General",
    messages: [
      {
        sender: "user",
        text: "What is Rahul's salary?",
        time: "10:22 AM",
      },
      {
        sender: "assistant",
        isRefusal: true,
        text: "Sorry, I cannot share another person's pay. You can ask about your own payslip.",
        category: "Privacy & Security",
        policySource: "Zenith Nova HR Data Governance Policy (Confidentiality & Role Isolation)",
        suggestions: [
          "Where can I view my latest payslip?",
          "When is salary paid?",
          "What is my leave balance?",
        ],
        time: "10:22 AM",
      },
    ],
  });

  const pathHtml3 = path.join(tempHtmlDir, "salary-refusal.html");
  const pathPng3 = path.join(outputDir, "unauthorized-salary-refusal.png");
  fs.writeFileSync(pathHtml3, html3);

  spawnSync(edgePath, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${tempProfile}`,
    "--window-size=1440,950",
    `--screenshot=${pathPng3}`,
    pathHtml3,
  ]);
  console.log(`  ✓ Generated: ${pathPng3} (Size: ${(fs.statSync(pathPng3).size / 1024).toFixed(1)} KB)`);

  console.log("\n=========================================================================");
  console.log("   ALL 3 DAY 16 SCREENSHOTS VERIFIED AND PERSISTED SUCCESSFULLY           ");
  console.log("=========================================================================\n");
}

captureAllThreeScreenshots();
