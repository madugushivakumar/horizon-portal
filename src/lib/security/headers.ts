/**
 * Horizon Portal — Production Security Headers & Content Security Policy (CSP)
 * src/lib/security/headers.ts
 *
 * Implements Defense-in-Depth HTTP security response headers:
 * - Content-Security-Policy (CSP) with strict resource origins
 * - Strict-Transport-Security (HSTS, production only)
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY (harmonized with frame-ancestors 'none')
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: restricts unused browser capabilities
 */

import { NextResponse } from "next/server";

/**
 * SHA-256 hash of the inline theme script in src/components/ThemeProvider.tsx:
 * (function(){try{var s=localStorage.getItem('hz-theme');var m=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',(s||( m?'dark':'light'))==='dark');}catch(e){}})();
 *
 * NOTE: Retained for independent forensic verification and automated testing.
 * Under the approved Option C architecture, this hash is INTENTIONALLY NOT injected
 * into the production script-src directive to prevent W3C CSP Level 3 suppression
 * of 'unsafe-inline', which would block Next.js React Server Component flight chunks.
 */
export const THEME_SCRIPT_HASH = "sha256-u/P+mH0lAjjBdDDWdyZ4AkPHaWjLh8LuvYG0f8MkXiE=";

/**
 * Builds the Content-Security-Policy directive string.
 *
 * Rationale (Approved Option C Architecture):
 * - default-src 'self': Restrict fallback to application origin.
 * - script-src: 'self' + 'unsafe-inline' (enables Next.js 16 RSC flight payloads,
 *   React 19 streaming, and theme script execution without W3C CSP Level 3 hash suppression).
 *   'unsafe-eval' is strictly excluded in production, enabled only in development for Fast Refresh.
 * - style-src: 'self' + 'unsafe-inline' (dynamic CSS variables & React inline styles)
 *   + https://fonts.googleapis.com (imported in src/app/globals.css).
 * - font-src: 'self' + https://fonts.gstatic.com + data: (Google Fonts CDN & self-hosted).
 * - img-src: 'self' + data: + blob: (static icons, avatars, and blob exports).
 * - connect-src: 'self' (internal API calls).
 * - frame-src 'none' & object-src 'none': Disallow embedding/plugins.
 * - base-uri 'self' & form-action 'self': Prevent base manipulation and form redirection.
 * - frame-ancestors 'none': Prevent clickjacking (matches X-Frame-Options: DENY).
 * - upgrade-insecure-requests: Enforce HTTPS in production.
 */
export function buildContentSecurityPolicy(isProduction: boolean = process.env.NODE_ENV === "production"): string {
  const scriptSrcDirectives = [
    "'self'",
    "'unsafe-inline'",
  ];

  // In development, allow unsafe-eval for React Fast Refresh source maps
  if (!isProduction) {
    scriptSrcDirectives.push("'unsafe-eval'");
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrcDirectives,
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "data:", "blob:"],
    "connect-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  if (isProduction) {
    directives["upgrade-insecure-requests"] = [];
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Returns security header key-value pairs formatted for next.config.ts headers()
 */
export function getSecurityHeaders(isProduction: boolean = process.env.NODE_ENV === "production") {
  const headers = [
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()",
    },
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(isProduction),
    },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

/**
 * Applies security headers directly to a NextResponse object.
 * Used in middleware/proxy to ensure headers are present on all proxy responses
 * (including redirects and JSON error responses).
 */
export function applySecurityHeaders(
  response: NextResponse,
  isProduction: boolean = process.env.NODE_ENV === "production"
): NextResponse {
  const headers = getSecurityHeaders(isProduction);
  for (const { key, value } of headers) {
    response.headers.set(key, value);
  }
  return response;
}
