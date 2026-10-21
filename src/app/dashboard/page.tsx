"use client";

/**
 * Horizon Portal — Role-Aware Dashboard
 * src/app/dashboard/page.tsx
 *
 * Primary landing page within the authenticated application shell.
 * Renders role-specific metrics, navigation shortcuts, and interactive showcases
 * for Skeleton, EmptyState, and ErrorState components.
 */

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TopBarUser } from "@/components/layout/TopBar";

function DashboardContent() {
  const searchParams = useSearchParams();
  const unauthorizedError = searchParams.get("error") === "unauthorized";
  const deniedPath = searchParams.get("denied");

  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(unauthorizedError);
  const [showStateDemo, setShowStateDemo] = useState(false);
  const [demoStateTab, setDemoStateTab] = useState<"skeleton" | "empty" | "error">("skeleton");
  const [demoErrorRecovered, setDemoErrorRecovered] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // Fallback handled by AppShell
      }
    }
    loadUser();
  }, []);

  const role = currentUser?.role || "Employee";

  return (
    <AppShell initialUser={currentUser}>
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Unauthorized Access Alert */}
        {showAccessDenied && (
          <div
            role="alert"
            className="flex items-start justify-between rounded-2xl border border-[var(--hz-danger-500)]/30 bg-[var(--hz-danger-50)] dark:bg-[var(--hz-danger-950)]/60 p-4 text-xs text-[var(--hz-danger-800)] dark:text-[var(--hz-danger-200)] shadow-sm"
          >
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 shrink-0 text-[var(--hz-danger-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-sm">Access Denied by Server Authorization</p>
                <p className="mt-0.5 opacity-90">
                  Your authenticated role (<strong className="font-bold">{role}</strong>) does not have permission to access{" "}
                  <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">{deniedPath || "that restricted URL"}</code>.
                  You have been securely redirected to your dashboard.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAccessDenied(false)}
              className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5 text-[var(--hz-danger-600)]"
              aria-label="Dismiss access denied message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--hz-border-default)] bg-gradient-to-r from-[var(--hz-primary-600)] via-[var(--hz-primary-700)] to-[var(--hz-secondary-600)] p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Horizon Shell · Day 4 Foundation</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || "Team Member"}!
            </h1>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Your navigation menu and portal capabilities have been personalized for your role:{" "}
              <strong className="underline underline-offset-4 font-bold">{role}</strong>.
            </p>
          </div>

          {/* Decorative Background Circles */}
          <div className="absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-32 -top-12 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Role-Specific Metric Cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--hz-text-muted)] mb-3">
            {role} Workspace Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {role === "Admin" && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>System Status</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-success-600)] flex items-center justify-between">
                      <span>Operational</span>
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">99.9%</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    All services & SQLite storage active
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Demo Users</CardDescription>
                    <CardTitle className="text-2xl">4 Active</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Admin, HR, Manager, Employee
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Database Employees</CardDescription>
                    <CardTitle className="text-2xl">25 Records</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Seeded via Prisma ORM
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Security Level</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-primary-600)]">RBAC v2</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Server proxy route enforcement
                  </CardContent>
                </Card>
              </>
            )}

            {role === "HR" && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Workforce Headcount</CardDescription>
                    <CardTitle className="text-2xl">25 Active</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Across 6 company departments
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pending Leave Requests</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-warning-600)]">4 Pending</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Requires operations review
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Next Payroll Run</CardDescription>
                    <CardTitle className="text-2xl">Oct 31, 2026</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Monthly cycle (25 payslips)
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Open Requisitions</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-primary-600)]">3 Roles</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Engineering & Design
                  </CardContent>
                </Card>
              </>
            )}

            {role === "Manager" && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Direct Reports</CardDescription>
                    <CardTitle className="text-2xl">6 Members</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Engineering Team Alpha
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pending Approvals</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-warning-600)]">2 Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    PTO & remote work requests
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Team Availability</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-success-600)]">100%</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    All reports on duty today
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Review Cycle</CardDescription>
                    <CardTitle className="text-2xl">Q4 2026</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Opens in 14 days
                  </CardContent>
                </Card>
              </>
            )}

            {role === "Employee" && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Available Annual Leave</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-primary-600)]">18 Days</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Of 24 days total allowance
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Next Payday</CardDescription>
                    <CardTitle className="text-2xl">Oct 31, 2026</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Direct deposit to registered bank
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Latest Payslip</CardDescription>
                    <CardTitle className="text-2xl text-[var(--hz-success-600)]">Ready</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    September 2026 available
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Attendance Status</CardDescription>
                    <CardTitle className="text-2xl">Active</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--hz-text-muted)]">
                    Clocked in at 09:02 AM
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Quick Links Section */}
        <Card>
          <CardHeader>
            <CardTitle>Role Navigation Shortcuts</CardTitle>
            <CardDescription>
              Quickly jump to available areas configured for your {role} profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link
                href="/employees"
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] text-[var(--hz-primary-600)]">
                  👥
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--hz-text-primary)]">Workforce Directory</div>
                  <div className="text-[11px] text-[var(--hz-text-muted)]">Browse 25 company employees</div>
                </div>
              </Link>

              {role === "Employee" && (
                <>
                  <Link
                    href="/leave"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
                      📅
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--hz-text-primary)]">My Leave Requests</div>
                      <div className="text-[11px] text-[var(--hz-text-muted)]">Request PTO and view balances</div>
                    </div>
                  </Link>
                  <Link
                    href="/payslips"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                      📄
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--hz-text-primary)]">My Payslips</div>
                      <div className="text-[11px] text-[var(--hz-text-muted)]">Download monthly statements</div>
                    </div>
                  </Link>
                </>
              )}

              {(role === "Manager" || role === "Admin") && (
                <>
                  <Link
                    href="/approvals"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--hz-text-primary)]">Team Approvals</div>
                      <div className="text-[11px] text-[var(--hz-text-muted)]">Review direct report requests</div>
                    </div>
                  </Link>
                  <Link
                    href="/team"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                      📊
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--hz-text-primary)]">Team Performance</div>
                      <div className="text-[11px] text-[var(--hz-text-muted)]">Reviews & team analytics</div>
                    </div>
                  </Link>
                </>
              )}

              {(role === "HR" || role === "Admin") && (
                <>
                  <Link
                    href="/payroll"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                      💰
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--hz-text-primary)]">Payroll Operations</div>
                      <div className="text-[11px] text-[var(--hz-text-muted)]">Manage pay runs & payslips</div>
                    </div>
                  </Link>
                  <Link
                    href="/leave-management"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
                      🗓️
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--hz-text-primary)]">Leave Operations</div>
                      <div className="text-[11px] text-[var(--hz-text-muted)]">Quotas & holiday calendar</div>
                    </div>
                  </Link>
                </>
              )}

              {role === "Admin" && (
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--hz-border-default)] hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-subtle)] transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950 text-red-600">
                    🛡️
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--hz-text-primary)]">User Administration</div>
                    <div className="text-[11px] text-[var(--hz-text-muted)]">Manage accounts & roles</div>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Reusable Component Showcase */}
        <Card className="border-[var(--hz-primary-500)]/30">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">Task 4 Core Components</Badge>
                  <CardTitle>Reusable States Showcase</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Demonstration of Skeleton, EmptyState, and ErrorState components built for the Horizon App Shell.
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStateDemo(!showStateDemo)}
              >
                {showStateDemo ? "Hide Showcase" : "Inspect State Components"}
              </Button>
            </div>
          </CardHeader>

          {showStateDemo && (
            <CardContent className="space-y-4 pt-2">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-[var(--hz-border-default)] pb-3">
                <button
                  onClick={() => setDemoStateTab("skeleton")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    demoStateTab === "skeleton"
                      ? "bg-[var(--hz-primary-600)] text-white"
                      : "text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)]"
                  }`}
                >
                  Skeleton (Loading)
                </button>
                <button
                  onClick={() => setDemoStateTab("empty")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    demoStateTab === "empty"
                      ? "bg-[var(--hz-primary-600)] text-white"
                      : "text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)]"
                  }`}
                >
                  EmptyState
                </button>
                <button
                  onClick={() => setDemoStateTab("error")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    demoStateTab === "error"
                      ? "bg-[var(--hz-primary-600)] text-white"
                      : "text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)]"
                  }`}
                >
                  ErrorState (With Retry)
                </button>
              </div>

              {/* Tab: Skeleton Demo */}
              {demoStateTab === "skeleton" && (
                <div className="p-4 rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] space-y-4">
                  <div className="text-xs font-semibold text-[var(--hz-text-secondary)]">
                    Simulating 3-second content load with layout-matching Skeletons:
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton variant="circular" width="3rem" height="3rem" />
                    <div className="space-y-2 flex-1">
                      <Skeleton variant="text" width="60%" height="1rem" />
                      <Skeleton variant="text" width="35%" height="0.75rem" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <Skeleton variant="rectangular" height="5rem" className="rounded-xl" />
                    <Skeleton variant="rectangular" height="5rem" className="rounded-xl" />
                    <Skeleton variant="rectangular" height="5rem" className="rounded-xl" />
                  </div>
                </div>
              )}

              {/* Tab: EmptyState Demo */}
              {demoStateTab === "empty" && (
                <EmptyState
                  title="No Pending Disciplinary Actions"
                  description="All team members are in good standing with zero open compliance or conduct notices."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => alert("EmptyState action clicked!")}>
                      View Compliance Archive
                    </Button>
                  }
                />
              )}

              {/* Tab: ErrorState Demo */}
              {demoStateTab === "error" && (
                <div>
                  {demoErrorRecovered ? (
                    <div className="p-6 rounded-2xl border border-[var(--hz-success-500)]/40 bg-[var(--hz-success-50)] dark:bg-[var(--hz-success-950)] text-center space-y-2">
                      <div className="text-2xl">✅</div>
                      <h4 className="text-sm font-bold text-[var(--hz-success-700)] dark:text-[var(--hz-success-300)]">
                        Retry Succeeded!
                      </h4>
                      <p className="text-xs text-[var(--hz-success-600)]">
                        The retry action successfully re-triggered the content fetch handler.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDemoErrorRecovered(false)}
                        className="mt-2"
                      >
                        Reset Demo Error
                      </Button>
                    </div>
                  ) : (
                    <ErrorState
                      title="Simulated Payroll Service Timeout"
                      description="The upstream calculation cluster did not respond within the allocated threshold. Internal database details are withheld for security."
                      onRetry={() => setDemoErrorRecovered(true)}
                      retryLabel="Retry Connection"
                    />
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-[var(--hz-text-muted)]">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
