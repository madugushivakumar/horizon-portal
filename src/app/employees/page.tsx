"use client";

/**
 * Employees Directory View
 * src/app/employees/page.tsx
 *
 * Displays database-backed employees from GET /api/v1/employees.
 * Embedded cleanly inside the responsive Horizon AppShell.
 * Leverages Skeleton, EmptyState, and ErrorState components.
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TopBarUser } from "@/components/layout/TopBar";

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

export default function EmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchDirectory() {
      try {
        const meRes = await fetch("/api/v1/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (!ignore) setCurrentUser(meData.user);
        } else if (meRes.status === 401) {
          router.push("/login?from=/employees");
          return;
        }

        const empRes = await fetch("/api/v1/employees");
        if (!empRes.ok) {
          throw new Error("Failed to load employee directory.");
        }
        const empData = await empRes.json();
        if (!ignore) {
          setEmployees(empData.data || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error loading data");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchDirectory();

    return () => {
      ignore = true;
    };
  }, [router, reloadTrigger]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }

  return (
    <AppShell initialUser={currentUser}>
      <div className="space-y-6">
        {/* Header Title & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
              Workforce Directory
            </h1>
            <p className="mt-1 text-xs text-[var(--hz-text-muted)]">
              Database-backed employee records fetched via GET /api/v1/employees.
            </p>
          </div>
          <Badge variant="primary" size="md">
            {isLoading ? "Loading..." : `${employees.length} Members`}
          </Badge>
        </div>

        {/* Loading State using Skeleton Grid */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 w-3/4">
                    <Skeleton variant="text" width="70%" height="1rem" />
                    <Skeleton variant="text" width="90%" height="0.75rem" />
                  </div>
                  <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton variant="text" width="100%" height="0.75rem" />
                  <Skeleton variant="text" width="80%" height="0.75rem" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry Button */}
        {!isLoading && error && (
          <ErrorState
            title="Failed to Load Employee Directory"
            description={error}
            onRetry={handleRetry}
            retryLabel="Retry Directory Load"
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && employees.length === 0 && (
          <EmptyState
            title="No Employee Records Found"
            description="The SQLite workforce database currently has no registered employee records."
          />
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
      </div>
    </AppShell>
  );
}
