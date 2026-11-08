"use client";

/**
 * Horizon Portal — Admin Employee Management Console Page
 * src/app/admin/employees/page.tsx
 *
 * Provides dedicated administrative view for HR and Admin workforce operations:
 * - Table powered by TanStack Table
 * - Sliding create / edit employee drawer
 * - Reversible deactivation confirmation modal
 * - CSV export with active filter support and formula injection defense
 * - Audit log modal viewer
 */

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmployeeManagementConsole } from "@/components/admin/employees/EmployeeManagementConsole";

function AdminEmployeesPageContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          setCurrentUser(user);

          if (user.role === "Admin" || user.role === "HR") {
            setAuthorized(true);
          } else {
            setAuthorized(false);
            // Unauthorized roles redirected
            router.push("/dashboard?error=unauthorized&denied=/admin/employees");
          }
        } else {
          router.push("/login?from=/admin/employees");
        }
      } catch {
        router.push("/login?from=/admin/employees");
      }
    }
    verifyAccess();
  }, [router]);

  if (authorized === false) {
    return (
      <AppShell initialUser={currentUser}>
        <div className="p-8 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--hz-danger-bg,#fef2f2)] text-[var(--hz-danger,#ef4444)] flex items-center justify-center text-xl">
            🔒
          </div>
          <h2 className="text-base font-bold text-[var(--hz-text-primary)]">
            Access Restricted
          </h2>
          <p className="text-xs text-[var(--hz-text-muted)]">
            You do not possess the required HR or Administrator privileges to access the employee management console.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell initialUser={currentUser}>
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Administration", href: "/admin/employees" },
            { label: "Employee Management" },
          ]}
        />
        <EmployeeManagementConsole />
      </div>
    </AppShell>
  );
}

export default function AdminEmployeesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-semibold text-[var(--hz-text-muted)] animate-pulse">
          Loading Employee Console...
        </div>
      }
    >
      <AdminEmployeesPageContent />
    </Suspense>
  );
}
