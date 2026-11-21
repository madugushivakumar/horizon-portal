import { defineConfig, devices } from "@playwright/test";

/**
 * Horizon Portal — Playwright End-to-End Test Configuration
 * playwright.config.ts
 *
 * Supports dual-mode execution:
 * 1. Local Mode (default): Targets http://localhost:3000 (backed by local SQLite dev.db).
 *    Spawns/reuses next production server if not already running.
 * 2. Hosted Preview Mode: Activated when PLAYWRIGHT_BASE_URL is set in environment.
 *    Strictly enforces fail-closed validation: rejects Production URLs and requires authorized Preview domains.
 *
 * Diagnostic Artifacts:
 * - HTML report in playwright-report/
 * - Screenshots on assertion failure
 * - Full action traces on first retry and on failure
 */

const rawBaseURL = process.env.PLAYWRIGHT_BASE_URL;
let baseURL = "http://localhost:3000";
const isHosted = Boolean(rawBaseURL);

if (isHosted && rawBaseURL) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawBaseURL);
  } catch (err) {
    throw new Error(
      `[SECURITY] Invalid PLAYWRIGHT_BASE_URL provided: "${rawBaseURL}". Must be a valid HTTP/HTTPS URL.`
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Explicitly reject Production hostname and database identifiers
  const FORBIDDEN_HOSTNAMES = [
    "horizon-portal-sigma.vercel.app",
    "ep-broad-hall-b3dtqwdp",
    "growmar-production",
    "horizon-portal.vercel.app",
  ];

  if (FORBIDDEN_HOSTNAMES.some((forbidden) => hostname.includes(forbidden))) {
    throw new Error(
      `[SECURITY HALT] Hostname "${hostname}" is IDENTIFIED AS PRODUCTION. Testing against Production is strictly forbidden under Day 20 non-negotiable safety rules.`
    );
  }

  // Allow localhost / 127.0.0.1 or authorized preview patterns
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  const isAuthorizedPreview =
    (hostname.endsWith(".vercel.app") && hostname !== "horizon-portal-sigma.vercel.app") ||
    hostname.includes("preview") ||
    Boolean(
      process.env.AUTHORIZED_PREVIEW_HOSTNAME &&
        hostname === process.env.AUTHORIZED_PREVIEW_HOSTNAME.toLowerCase()
    );

  if (!isLocalHost && !isAuthorizedPreview) {
    throw new Error(
      `[SECURITY FAIL-CLOSED] Hostname "${hostname}" is not recognized as an authorized Preview environment. Hosted tests must fail closed unless explicitly targeting an authorized Preview URL.`
    );
  }

  baseURL = rawBaseURL;
}

export default defineConfig({
  testDir: "./tests/e2e",
  /* Maximum time one test can run for */
  timeout: 45 * 1000,
  expect: {
    /* Timeout for individual expect() assertions */
    timeout: 8 * 1000,
  },
  /* Run tests in files in series to ensure deterministic database state */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only to detect flaky behavior */
  retries: process.env.CI ? 2 : 1,
  /* Single worker prevents concurrent database write collision */
  workers: 1,
  /* Reporter configuration */
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],
  /* Shared settings for all projects below */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",
    /* Capture screenshot only on failure */
    screenshot: "only-on-failure",
    /* Record video only when retrying a failed test */
    video: "retain-on-failure",
    /* Action & navigation timeouts */
    actionTimeout: 12 * 1000,
    navigationTimeout: 20 * 1000,
    /* Standard desktop viewport */
    viewport: { width: 1280, height: 720 },
    /* Bypass SSL cert errors on preview / self-signed local certs */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects using verified local system browser */
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],

  /* Run local web server if testing locally and not targeting hosted preview */
  webServer: isHosted
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000/login",
        reuseExistingServer: !process.env.CI,
        timeout: 60 * 1000,
        env: {
          PORT: "3000",
          DATABASE_URL: "file:./dev.db",
        },
      },
});
