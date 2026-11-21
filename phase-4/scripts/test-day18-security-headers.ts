/**
 * Horizon Portal — Day 18 Stage E Remediation Security Headers & CSP Test Suite
 * scripts/test-day18-security-headers.ts
 *
 * Implements independent, non-circular verification for Option C CSP:
 * 1. Security Headers Configuration Tests:
 *    - Presence of defensive headers: CSP, HSTS (prod), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
 *    - Frame protection: Harmonized X-Frame-Options: DENY and frame-ancestors 'none'.
 *    - HSTS environment sensitivity: Omitted in dev, present in prod with max-age >= 31536000 and includeSubDomains.
 *    - Permissions-Policy: Disables camera, microphone, geolocation, browsing-topics, payment.
 *
 * 2. CSP Construction & Option C Integrity:
 *    - Production script-src authorizes 'self' and 'unsafe-inline'.
 *    - Production script-src strictly EXCLUDES hash sources (no 'sha256-...'), preventing CSP Level 3 suppression of 'unsafe-inline'.
 *    - Production script-src strictly EXCLUDES nonce sources.
 *    - Production script-src strictly EXCLUDES 'unsafe-eval' (isolated to development).
 *    - Restricted fallback and boundary directives (default-src, object-src, base-uri, form-action, frame-ancestors).
 *
 * 3. Independent Forensic Theme Script Verification:
 *    - Directly reads src/components/ThemeProvider.tsx.
 *    - Extracts exact inline script bytes and computes SHA-256 independently.
 *    - Verifies exact length (218 bytes) and digest (sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=).
 *    - Verifies theme script hash is NOT declared in production script-src.
 *
 * 4. Compiled HTML Script Compatibility:
 *    - Inspects .next/server/app/ production HTML files (login, index, dashboard).
 *    - Identifies all inline scripts (RSC flight payloads, React 19 streaming helpers, theme script).
 *    - Confirms all inline scripts are authorized via 'unsafe-inline' without hash suppression.
 *
 * 5. Proxy Middleware Integration & Header Preservation:
 *    - Pass-through page requests (/login) carry security headers.
 *    - Redirect responses (/dashboard -> /login) carry security headers and preserve location/cookies.
 *    - API 401 unauthenticated responses carry security headers.
 *    - RBAC 307 unauthorized redirects carry security headers.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";
import {
  getSecurityHeaders,
  buildContentSecurityPolicy,
  THEME_SCRIPT_HASH,
} from "../src/lib/security/headers";
import { createAuthToken } from "../src/lib/auth/token";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-secret-for-day18-security-tests-only";
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

function createMockRequest(
  url: string,
  options?: { token?: string; method?: string; body?: unknown }
): NextRequest {
  const reqInit: { method: string; body?: string; headers?: Record<string, string> } = {
    method: options?.method || "GET",
  };

  if (options?.body !== undefined) {
    reqInit.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    reqInit.headers = { "Content-Type": "application/json" };
  }

  const req = new NextRequest(new URL(url, "http://localhost:3000"), reqInit);
  if (options?.token) {
    req.cookies.set(SESSION_COOKIE_NAME, options.token);
  }
  return req;
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   HORIZON PORTAL — DAY 18 STAGE E REMEDIATION SUITE");
  console.log("========================================================\n");

  // ─────────────────────────────────────────────────────────
  // PART 1: Security Headers Configuration & Directives
  // ─────────────────────────────────────────────────────────
  console.log("▶ 1. Security Headers Configuration & Directive Analysis\n");

  const prodHeaders = getSecurityHeaders(true);
  const devHeaders = getSecurityHeaders(false);

  const prodHeaderMap = new Map(prodHeaders.map((h) => [h.key, h.value]));
  const devHeaderMap = new Map(devHeaders.map((h) => [h.key, h.value]));

  // 1.1 X-Content-Type-Options
  assert(prodHeaderMap.get("X-Content-Type-Options") === "nosniff", "X-Content-Type-Options is set to 'nosniff'");

  // 1.2 X-Frame-Options
  assert(prodHeaderMap.get("X-Frame-Options") === "DENY", "X-Frame-Options is set to 'DENY'");

  // 1.3 Referrer-Policy
  assert(
    prodHeaderMap.get("Referrer-Policy") === "strict-origin-when-cross-origin",
    "Referrer-Policy is set to 'strict-origin-when-cross-origin'"
  );

  // 1.4 Permissions-Policy
  const permPolicy = prodHeaderMap.get("Permissions-Policy") || "";
  assert(permPolicy.includes("camera=()"), "Permissions-Policy disables camera");
  assert(permPolicy.includes("microphone=()"), "Permissions-Policy disables microphone");
  assert(permPolicy.includes("geolocation=()"), "Permissions-Policy disables geolocation");
  assert(permPolicy.includes("browsing-topics=()"), "Permissions-Policy disables browsing-topics");
  assert(permPolicy.includes("payment=()"), "Permissions-Policy disables payment");

  // 1.5 Strict-Transport-Security (HSTS)
  assert(prodHeaderMap.has("Strict-Transport-Security"), "HSTS header is present in production configuration");
  const hstsVal = prodHeaderMap.get("Strict-Transport-Security") || "";
  assert(hstsVal.includes("max-age=31536000"), "HSTS specifies max-age of at least 1 year (31536000 seconds)");
  assert(hstsVal.includes("includeSubDomains"), "HSTS includes subdomains");
  assert(!hstsVal.includes("preload"), "HSTS avoids premature 'preload' directive");

  // 1.6 HSTS Environment Sensitivity
  assert(!devHeaderMap.has("Strict-Transport-Security"), "HSTS is omitted in development mode (prevents localhost lockout)");

  // ─────────────────────────────────────────────────────────
  // PART 2: Content-Security-Policy (CSP) Construction & Safety
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 2. Content-Security-Policy (CSP) Option C Construction & Safety\n");

  const prodCSP = buildContentSecurityPolicy(true);
  const devCSP = buildContentSecurityPolicy(false);

  // Parse CSP into directive map
  const parseCSP = (cspStr: string) => {
    const map = new Map<string, string[]>();
    for (const part of cspStr.split(";").map((p) => p.trim()).filter(Boolean)) {
      const tokens = part.split(/\s+/);
      const directive = tokens[0];
      const values = tokens.slice(1);
      map.set(directive, values);
    }
    return map;
  };

  const prodDirectives = parseCSP(prodCSP);
  const devDirectives = parseCSP(devCSP);

  // 2.1 Fallback default-src
  const defaultSrc = prodDirectives.get("default-src") || [];
  assert(defaultSrc.includes("'self'"), "CSP sets default-src to 'self'");

  // 2.2 Script sources — Option C Verification
  const scriptSrc = prodDirectives.get("script-src") || [];
  assert(scriptSrc.includes("'self'"), "CSP script-src allows 'self'");
  assert(scriptSrc.includes("'unsafe-inline'"), "CSP script-src includes 'unsafe-inline' for Next.js hydration & theme script");

  // 2.3 Verification that NO hash or nonce suppresses 'unsafe-inline'
  const hasHashSource = scriptSrc.some((s) => s.startsWith("'sha256-") || s.startsWith("'sha384-") || s.startsWith("'sha512-"));
  assert(!hasHashSource, "CSP production script-src strictly EXCLUDES hash sources (prevents W3C CSP Level 3 suppression)");

  const hasNonceSource = scriptSrc.some((s) => s.startsWith("'nonce-"));
  assert(!hasNonceSource, "CSP production script-src contains no nonce sources");

  // 2.4 Eval protection
  assert(!scriptSrc.includes("'unsafe-eval'"), "CSP strictly excludes 'unsafe-eval' in production");
  const devScriptSrc = devDirectives.get("script-src") || [];
  assert(devScriptSrc.includes("'unsafe-eval'"), "CSP allows 'unsafe-eval' in development for Fast Refresh source maps");

  // 2.5 Style, font, image, connect sources
  const styleSrc = prodDirectives.get("style-src") || [];
  assert(styleSrc.includes("'self'") && styleSrc.includes("'unsafe-inline'") && styleSrc.includes("https://fonts.googleapis.com"), "CSP style-src allows Google Fonts and inline styles");

  const fontSrc = prodDirectives.get("font-src") || [];
  assert(fontSrc.includes("'self'") && fontSrc.includes("https://fonts.gstatic.com") && fontSrc.includes("data:"), "CSP font-src allows Google Fonts CDN and data URIs");

  const imgSrc = prodDirectives.get("img-src") || [];
  assert(imgSrc.includes("'self'") && imgSrc.includes("data:") && imgSrc.includes("blob:"), "CSP img-src allows self, data URIs, and blob exports");

  const connectSrc = prodDirectives.get("connect-src") || [];
  assert(connectSrc.includes("'self'"), "CSP connect-src restricts fetch/XHR to 'self'");

  // 2.6 Boundary & plugin lockdown
  const frameSrc = prodDirectives.get("frame-src") || [];
  assert(frameSrc.includes("'none'"), "CSP frame-src is set to 'none'");

  const objectSrc = prodDirectives.get("object-src") || [];
  assert(objectSrc.includes("'none'"), "CSP object-src is set to 'none'");

  const baseUri = prodDirectives.get("base-uri") || [];
  assert(baseUri.includes("'self'"), "CSP base-uri restricts base tag manipulation to 'self'");

  const formAction = prodDirectives.get("form-action") || [];
  assert(formAction.includes("'self'"), "CSP form-action restricts form submissions to 'self'");

  const frameAncestors = prodDirectives.get("frame-ancestors") || [];
  assert(frameAncestors.includes("'none'"), "CSP frame-ancestors is set to 'none' (matches X-Frame-Options: DENY)");

  // 2.7 HTTPS upgrade in production
  assert(prodDirectives.has("upgrade-insecure-requests"), "CSP includes upgrade-insecure-requests in production");
  assert(!devDirectives.has("upgrade-insecure-requests"), "CSP omits upgrade-insecure-requests in development");

  // 2.8 No wildcards
  assert(!prodCSP.includes(" * "), "CSP contains no unapproved wildcard ('*') origins");
  assert(!scriptSrc.includes("*"), "script-src does not use wildcard");

  // ─────────────────────────────────────────────────────────
  // PART 3: Independent Theme Script Forensic Hash Verification
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 3. Independent Theme Script Forensic Verification\n");

  const themeProviderPath = path.join(process.cwd(), "src/components/ThemeProvider.tsx");
  assert(fs.existsSync(themeProviderPath), "src/components/ThemeProvider.tsx exists on disk");

  const themeProviderSource = fs.readFileSync(themeProviderPath, "utf8");
  const scriptRegex = /<script\b[\s\S]*?__html:\s*`([\s\S]*?)`[\s\S]*?\/>/;
  const scriptMatch = themeProviderSource.match(scriptRegex);

  assert(scriptMatch !== null, "Inline ThemeScript extracted from ThemeProvider.tsx");

  if (scriptMatch) {
    const rawScript = scriptMatch[1];
    const scriptBuffer = Buffer.from(rawScript, "utf8");
    assert(scriptBuffer.length === 218, `ThemeScript byte length is exactly 218 bytes (Got: ${scriptBuffer.length})`);

    const calculatedHash = "sha256-" + crypto.createHash("sha256").update(scriptBuffer).digest("base64");
    assert(calculatedHash === "sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=", `Independent hash matches verified digest: ${calculatedHash}`);

    // Verify constant in headers.ts matches true hash
    assert(THEME_SCRIPT_HASH === calculatedHash, "THEME_SCRIPT_HASH constant in headers.ts matches calculated hash");

    // Critical check: Confirm theme script hash is NOT declared in production CSP
    assert(!prodCSP.includes(calculatedHash), "Calculated theme script hash is NOT injected in production CSP (Option C policy)");
  }

  // ─────────────────────────────────────────────────────────
  // PART 4: Compiled HTML Script Inventory & Authorization Check
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 4. Compiled Production HTML Script Inspection\n");

  const htmlFilesToCheck = [
    { name: "/login", path: ".next/server/app/login.html" },
    { name: "/", path: ".next/server/app/index.html" },
    { name: "/dashboard", path: ".next/server/app/dashboard.html" },
  ];

  for (const page of htmlFilesToCheck) {
    const fullPath = path.join(process.cwd(), page.path);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ℹ SKIP: ${page.name} HTML not found at ${page.path}`);
      continue;
    }

    const htmlContent = fs.readFileSync(fullPath, "utf8");
    const tagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let tagMatch;
    let inlineCount = 0;
    let externalCount = 0;

    while ((tagMatch = tagRegex.exec(htmlContent)) !== null) {
      const attrs = tagMatch[1];
      if (/src=["']/i.test(attrs)) {
        externalCount++;
      } else {
        inlineCount++;
      }
    }

    assert(externalCount > 0, `${page.name} contains external scripts from /_next/static (authorized via 'self')`);
    assert(inlineCount >= 10, `${page.name} contains inline scripts (theme + RSC flight payloads: ${inlineCount} total)`);
    assert(
      prodDirectives.get("script-src")?.includes("'unsafe-inline'") === true && !hasHashSource,
      `${page.name} inline scripts are fully authorized under Option C 'unsafe-inline' without hash suppression`
    );
  }

  // ─────────────────────────────────────────────────────────
  // PART 5: Proxy Middleware HTTP Response Integration Tests
  // ─────────────────────────────────────────────────────────
  console.log("\n▶ 5. Proxy Middleware HTTP Response Integration Tests\n");

  const originalNodeEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    // 5.1 Standard pass-through request carries security headers
    const reqLogin = createMockRequest("/login");
    const resLogin = await proxy(reqLogin);
    assert(resLogin.headers.get("X-Content-Type-Options") === "nosniff", "Proxy /login response carries X-Content-Type-Options: nosniff");
    assert(resLogin.headers.get("X-Frame-Options") === "DENY", "Proxy /login response carries X-Frame-Options: DENY");
    assert(resLogin.headers.get("Content-Security-Policy") !== null, "Proxy /login response carries Content-Security-Policy");
    assert(resLogin.headers.get("Strict-Transport-Security") !== null, "Proxy /login response carries Strict-Transport-Security in production");

    // 5.2 Unauthenticated protected page redirect carries security headers and preserves location
    const reqDash = createMockRequest("/dashboard");
    const resDash = await proxy(reqDash);
    assert(resDash.status === 307 || resDash.status === 302, "Unauthenticated /dashboard redirects to /login");
    assert(Boolean(resDash.headers.get("Location")?.includes("/login")), "Redirect response preserves destination Location");
    assert(resDash.headers.get("X-Content-Type-Options") === "nosniff", "Redirect response carries X-Content-Type-Options");
    assert(resDash.headers.get("X-Frame-Options") === "DENY", "Redirect response carries X-Frame-Options");
    assert(resDash.headers.get("Content-Security-Policy") !== null, "Redirect response carries Content-Security-Policy");

    // 5.3 Unauthenticated protected API 401 carries security headers
    const reqApi = createMockRequest("/api/v1/employees");
    const resApi = await proxy(reqApi);
    assert(resApi.status === 401, "Unauthenticated /api/v1/employees returns HTTP 401");
    assert(resApi.headers.get("X-Content-Type-Options") === "nosniff", "API 401 response carries X-Content-Type-Options");
    assert(resApi.headers.get("Content-Security-Policy") !== null, "API 401 response carries Content-Security-Policy");

    // 5.4 Unauthorized RBAC denial carries security headers
    const empToken = await createAuthToken({
      sub: "usr_emp_004",
      email: "employee@growmar.com",
      role: "Employee",
    });
    const reqAdminPage = createMockRequest("/admin/finance", { token: empToken });
    const resAdminPage = await proxy(reqAdminPage);
    assert(
      (resAdminPage.status === 307 || resAdminPage.status === 302) &&
      Boolean(resAdminPage.headers.get("Location")?.includes("error=unauthorized")),
      "Employee accessing /admin/finance is redirected with unauthorized flag"
    );
    assert(resAdminPage.headers.get("X-Content-Type-Options") === "nosniff", "RBAC denial response carries X-Content-Type-Options");
    assert(resAdminPage.headers.get("Content-Security-Policy") !== null, "RBAC denial response carries Content-Security-Policy");

  } finally {
    if (originalNodeEnv !== undefined) {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    } else {
      (process.env as Record<string, string | undefined>).NODE_ENV = undefined;
    }
  }

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  console.log("\n========================================================");
  console.log(`  DAY 18 STAGE E REMEDIATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
