"use client";

/**
 * Employees Directory View
 * src/app/employees/page.tsx
 *
 * Displays database-backed employees from GET /api/v1/employees.
 * Includes authenticated user header, role badge, loading/empty/error states,
 * and working logout integration.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";

interface EmployeeItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: string;
  department?: { id: string; name: string } | null;
  role?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeId?: string | null;
}

export default function EmployeesPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch current user session
        const meRes = await fetch("/api/v1/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        } else if (meRes.status === 401) {
          router.push("/login?from=/employees");
          return;
        }

        // Fetch employee records
        const empRes = await fetch("/api/v1/employees");
        if (!empRes.ok) {
          throw new Error("Failed to load employee directory.");
        }
        const empData = await empRes.json();
        setEmployees(empData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hz-bg-base)] text-[var(--hz-text-primary)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[var(--hz-primary-600)] to-[var(--hz-secondary-500)] text-white font-bold text-xs">
              HZ
            </div>
            <span className="font-semibold text-sm tracking-tight text-[var(--hz-text-primary)]">
              Horizon Portal
            </span>
          </Link>
          <span className="text-[var(--hz-border-default)]">/</span>
          <span className="text-xs text-[var(--hz-text-muted)] font-medium">Employee Directory</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--hz-border-default)] bg-[var(--hz-bg-subtle)] text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-surface)] transition-colors"
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <Link href="/design">
            <Button variant="secondary" size="sm">Design System</Button>
          </Link>

          {/* Current User Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--hz-border-default)]">
              <div className="text-right">
                <div className="text-xs font-semibold leading-tight text-[var(--hz-text-primary)]">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-[var(--hz-text-muted)]">
                  {currentUser.email}
                </div>
              </div>
              <Badge
                variant={
                  currentUser.role === "Admin"
                    ? "danger"
                    : currentUser.role === "HR"
                    ? "warning"
                    : currentUser.role === "Manager"
                    ? "primary"
                    : "secondary"
                }
                size="sm"
              >
                {currentUser.role}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                loading={isLoggingOut}
                className="ml-2"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--hz-text-primary)]">
              Employee Directory
            </h1>
            <p className="mt-1 text-xs text-[var(--hz-text-muted)]">
              Database-backed employee records fetched via GET /api/v1/employees.
            </p>
          </div>
          <Badge variant="primary" size="md">
            {employees.length} Records
          </Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--hz-primary-500)] border-t-transparent mb-3" />
            <p className="text-xs text-[var(--hz-text-muted)]">Loading employee directory from database...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <Card className="border-[var(--hz-semantic-error-border)] bg-[var(--hz-semantic-error-bg)]">
            <CardHeader>
              <CardTitle className="text-sm text-[var(--hz-semantic-error-text)]">
                Unable to load employees
              </CardTitle>
              <CardDescription className="text-xs text-[var(--hz-semantic-error-text)]/80">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && employees.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-sm font-medium text-[var(--hz-text-secondary)]">No employee records found</p>
              <p className="text-xs text-[var(--hz-text-muted)] mt-1">
                Run the database seed script: npm run db:seed
              </p>
            </CardContent>
          </Card>
        )}

        {/* Employees Table Grid */}
        {!isLoading && !error && employees.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <Card key={emp.id} interactive className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--hz-text-primary)]">
                        {emp.firstName} {emp.lastName}
                      </h2>
                      <p className="text-xs text-[var(--hz-text-muted)] mt-0.5">{emp.email}</p>
                    </div>
                    <Badge variant={emp.status === "Active" ? "success" : "default"} size="sm" dot>
                      {emp.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-[var(--hz-text-secondary)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--hz-text-muted)]">Department:</span>
                      <span className="font-medium text-[var(--hz-text-primary)]">
                        {emp.department?.name || "General"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--hz-text-muted)]">Role:</span>
                      <span className="font-medium text-[var(--hz-text-primary)]">
                        {emp.role?.name || "Staff"}
                      </span>
                    </div>
                    {emp.manager && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--hz-text-muted)]">Manager:</span>
                        <span className="font-medium">
                          {emp.manager.firstName} {emp.manager.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--hz-border-default)] flex items-center justify-between text-[11px] text-[var(--hz-text-muted)]">
                  <span>ID: {emp.id}</span>
                  <span className="text-[var(--hz-primary-600)] font-medium">Active Member</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
