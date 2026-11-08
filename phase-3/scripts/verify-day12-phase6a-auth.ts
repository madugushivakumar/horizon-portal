/**
 * Horizon Portal — Day 12 Phase 6A Authorization Verification Script
 * scripts/verify-day12-phase6a-auth.ts
 *
 * Verifies:
 * 1. Page Component Authorization (/admin/finance):
 *    - Unauthenticated: Renders "Authentication Required" 401 error screen
 *    - Employee: Renders "Access Restricted — 403 Forbidden" screen
 *    - Manager: Renders "Access Restricted — 403 Forbidden" screen
 *    - HR: Renders "Access Restricted — 403 Forbidden" screen
 *    - Admin: Renders AdminFinanceConsole within AppShell
 *    * Explicit distinction: Page level renders 401/403 UI screens within React DOM
 * 2. API Endpoints Authorization (all 5 endpoints):
 *    - Unauthenticated: Returns actual HTTP 401 Unauthorized status
 *    - Employee: Returns actual HTTP 403 Forbidden status
 *    - Manager: Returns actual HTTP 403 Forbidden status
 *    - HR: Returns actual HTTP 403 Forbidden status
 *    - Admin: Returns actual HTTP 200 OK status
 *    * Explicit distinction: API level returns actual HTTP status codes
 */

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import React from "react";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

// APIs
import { GET as getSummary } from "../src/app/api/v1/admin/finance/summary/route";
import { GET as getInvoices } from "../src/app/api/v1/admin/finance/invoices/route";
import { GET as getExpenses } from "../src/app/api/v1/admin/finance/expenses/route";
import { GET as exportInvoices } from "../src/app/api/v1/admin/finance/export/invoices/route";
import { GET as exportExpenses } from "../src/app/api/v1/admin/finance/export/expenses/route";

// Page Component
import AdminFinancePage from "../src/app/admin/finance/page";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

interface MockUser {
  id: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

async function createMockRequest(url: string, user?: MockUser): Promise<NextRequest> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (user) {
    const token = await createAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }

  const reqInit: RequestInit = {
    method: "GET",
    headers,
  };

  return new NextRequest(new URL(url, "http://localhost:3000"), reqInit as any);
}

// Helper to inspect JSX tree for specific string content
function elementContainsText(element: any, text: string): boolean {
  if (!element) return false;
  if (typeof element === "string" || typeof element === "number") {
    return String(element).includes(text);
  }
  if (Array.isArray(element)) {
    return element.some((child) => elementContainsText(child, text));
  }
  if (element.props) {
    if (element.props.children) {
      return elementContainsText(element.props.children, text);
    }
  }
  return false;
}

// Mock next/headers cookies() for testing Server Component directly
const originalNextHeaders = require("next/headers");

async function runTests() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — PHASE 6A AUTHORIZATION VERIFICATION        ");
  console.log("===============================================================\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@growmar.com" } });
  const hrUser = await prisma.user.findUnique({ where: { email: "hr@growmar.com" } });
  const managerUser = await prisma.user.findUnique({ where: { email: "manager@growmar.com" } });
  const employeeUser = await prisma.user.findUnique({ where: { email: "employee@growmar.com" } });

  if (!adminUser || !hrUser || !managerUser || !employeeUser) {
    throw new Error("Critical: Missing required demo user accounts in SQLite database.");
  }

  // ===========================================================================
  // 1. Page Component Authorization & Screen Rendering Verification
  // ===========================================================================
  console.log("--- 1. Page Component (/admin/finance) Access Control & Screen Rendering ---");
  console.log("    [Note: Distinguishing between rendered 401/403 UI screens vs HTTP status codes]\n");

  // Helper to run page with simulated session cookie
  async function testPageWithUser(user?: MockUser) {
    let tokenValue = "";
    if (user) {
      tokenValue = await createAuthToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId || null,
      });
    }

    // Mock cookies() returned by next/headers
    const mockCookieStore = {
      get: (name: string) => {
        if (name === SESSION_COOKIE_NAME && tokenValue) {
          return { name: SESSION_COOKIE_NAME, value: tokenValue };
        }
        return undefined;
      },
    };

    // Temporarily spy cookies()
    const origCookies = originalNextHeaders.cookies;
    originalNextHeaders.cookies = async () => mockCookieStore;

    try {
      return await AdminFinancePage();
    } finally {
      originalNextHeaders.cookies = origCookies;
    }
  }

  // 1.1 Unauthenticated: Renders Authentication Required 401 UI screen
  const unauthPage = await testPageWithUser(undefined);
  const unauthHasAuthReq = elementContainsText(unauthPage, "Authentication Required");
  const unauthHasLoginPrompt = elementContainsText(unauthPage, "Please log in with an administrator account");
  assert(
    unauthHasAuthReq && unauthHasLoginPrompt,
    "Page (/admin/finance): Unauthenticated renders 401 Authentication Required screen"
  );

  // 1.2 Employee: Renders 403 Forbidden screen
  const empPage = await testPageWithUser(employeeUser);
  const empHas403 = elementContainsText(empPage, "Access Restricted — 403 Forbidden");
  const empHasRole = elementContainsText(empPage, "Employee");
  assert(
    empHas403 && empHasRole,
    "Page (/admin/finance): Employee renders 403 Forbidden screen (identifies role 'Employee')"
  );

  // 1.3 Manager: Renders 403 Forbidden screen
  const mgrPage = await testPageWithUser(managerUser);
  const mgrHas403 = elementContainsText(mgrPage, "Access Restricted — 403 Forbidden");
  const mgrHasRole = elementContainsText(mgrPage, "Manager");
  assert(
    mgrHas403 && mgrHasRole,
    "Page (/admin/finance): Manager renders 403 Forbidden screen (identifies role 'Manager')"
  );

  // 1.4 HR: Renders 403 Forbidden screen
  const hrPage = await testPageWithUser(hrUser);
  const hrHas403 = elementContainsText(hrPage, "Access Restricted — 403 Forbidden");
  const hrHasRole = elementContainsText(hrPage, "HR");
  assert(
    hrHas403 && hrHasRole,
    "Page (/admin/finance): HR renders 403 Forbidden screen (identifies role 'HR')"
  );

  // 1.5 Admin: Renders AdminFinanceConsole within AppShell
  const adminPage = await testPageWithUser(adminUser);
  const adminHasAppShell = Boolean(adminPage?.type?.name === "AppShell" || adminPage?.props?.initialUser);
  const adminHasConsole = Boolean(
    adminPage?.props?.children?.type?.name === "AdminFinanceConsole" ||
      elementContainsText(adminPage, "Finance Snapshot")
  );
  assert(
    adminHasAppShell && adminHasConsole,
    "Page (/admin/finance): Admin granted access, renders Finance Snapshot within AppShell"
  );

  // ===========================================================================
  // 2. Read-Only Finance APIs Actual HTTP Status Codes
  // ===========================================================================
  console.log("\n--- 2. Finance APIs Actual HTTP Status Code Verification ---");
  console.log("    [Note: Verified actual HTTP response statuses: 401 Unauthorized, 403 Forbidden, 200 OK]\n");

  const endpoints = [
    { name: "Summary API (/api/v1/admin/finance/summary)", handler: getSummary, path: "/api/v1/admin/finance/summary" },
    { name: "Invoices API (/api/v1/admin/finance/invoices)", handler: getInvoices, path: "/api/v1/admin/finance/invoices" },
    { name: "Expenses API (/api/v1/admin/finance/expenses)", handler: getExpenses, path: "/api/v1/admin/finance/expenses" },
    { name: "Export Invoices (/api/v1/admin/finance/export/invoices)", handler: exportInvoices, path: "/api/v1/admin/finance/export/invoices" },
    { name: "Export Expenses (/api/v1/admin/finance/export/expenses)", handler: exportExpenses, path: "/api/v1/admin/finance/export/expenses" },
  ];

  for (const ep of endpoints) {
    // Unauthenticated -> HTTP 401
    const unauthReq = await createMockRequest(ep.path);
    const unauthRes = await ep.handler(unauthReq);
    assert(
      unauthRes.status === 401,
      `${ep.name}: Unauthenticated returns actual HTTP 401 Unauthorized`
    );

    // Employee -> HTTP 403
    const empReq = await createMockRequest(ep.path, employeeUser);
    const empRes = await ep.handler(empReq);
    assert(
      empRes.status === 403,
      `${ep.name}: Employee returns actual HTTP 403 Forbidden`
    );

    // Manager -> HTTP 403
    const mgrReq = await createMockRequest(ep.path, managerUser);
    const mgrRes = await ep.handler(mgrReq);
    assert(
      mgrRes.status === 403,
      `${ep.name}: Manager returns actual HTTP 403 Forbidden`
    );

    // HR -> HTTP 403
    const hrReq = await createMockRequest(ep.path, hrUser);
    const hrRes = await ep.handler(hrReq);
    assert(
      hrRes.status === 403,
      `${ep.name}: HR returns actual HTTP 403 Forbidden`
    );

    // Admin -> HTTP 200
    const adminReq = await createMockRequest(ep.path, adminUser);
    const adminRes = await ep.handler(adminReq);
    assert(
      adminRes.status === 200,
      `${ep.name}: Admin returns actual HTTP 200 OK`
    );
  }

  console.log("\n===============================================================");
  console.log(`AUTHORIZATION TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Authorization verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
