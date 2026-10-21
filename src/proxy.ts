/**
 * Next.js 16 Route Protection & Role Authorization Proxy
 * src/proxy.ts
 *
 * Implements route protection and server-side role-based access control:
 * - Redirects unauthenticated users accessing protected pages to /login.
 * - Redirects already-authenticated users visiting /login to /dashboard.
 * - Enforces role-based route access: prevents unauthorized roles from accessing
 *   restricted routes (e.g. Employee visiting /admin/* or /payroll).
 * - Allows public routes (/login, /design, /api/v1/auth/*, static files).
 * - Returns JSON 401/403 for unauthorized API requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isRouteAllowedForRole } from "@/config/navigation";

const SESSION_COOKIE = "horizon_session";

// Public API endpoints that do not require authentication
const PUBLIC_API_PREFIXES = ["/api/v1/auth/login", "/api/v1/auth/logout"];

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".jpg")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static framework assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Always allow public auth endpoints
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow /design showcase without login
  if (pathname === "/design") {
    return NextResponse.next();
  }

  // Check session cookie and decode token
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthenticated = false;
  let userRole: string | undefined = undefined;

  if (token && process.env.AUTH_SECRET) {
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
      if (payload && payload.sub) {
        isAuthenticated = true;
        userRole = payload.role as string | undefined;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // If user is already authenticated and visits /login, redirect to /dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If unauthenticated:
  if (!isAuthenticated) {
    // If it's an API route (e.g. /api/v1/employees or other protected APIs)
    if (pathname.startsWith("/api/")) {
      // Allow me endpoint to return its own 401 response with details
      if (pathname === "/api/v1/auth/me") {
        return NextResponse.next();
      }
      return NextResponse.json(
        { error: "Authentication required to access this resource." },
        { status: 401 }
      );
    }

    // Protected page routes -> redirect to /login
    // Allow home page / to remain viewable or redirect if protected
    if (pathname !== "/") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // If authenticated, enforce Role-Based Access Control (RBAC) on restricted pages/APIs
  if (isAuthenticated && userRole) {
    const isAllowed = isRouteAllowedForRole(pathname, userRole);

    if (!isAllowed) {
      // For restricted API requests
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: You lack necessary permissions to access this resource." },
          { status: 403 }
        );
      }

      // For restricted page URLs entered directly
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "unauthorized");
      dashboardUrl.searchParams.set("denied", pathname);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
