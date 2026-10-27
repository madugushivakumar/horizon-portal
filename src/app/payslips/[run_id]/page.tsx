"use client";

/**
 * Horizon Portal — Payslip Detail & Download Page
 * src/app/payslips/[run_id]/page.tsx
 *
 * Implements Phase 2 Day 7:
 * - Detailed itemized breakdown of earnings and deductions
 * - Professional A4 statement preview with browser print capability
 * - Enforces server-side ownership protection:
 *   Returns HTTP 403 Forbidden when an employee accesses another employee's payslip
 */

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { PayslipDocument, PayslipDetailData } from "@/components/payroll/PayslipDocument";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/error-state";

interface PageProps {
  params: Promise<{ run_id: string }>;
}

function PayslipDetailContent({ runId }: { runId: string }) {
  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);
  const [payslipData, setPayslipData] = useState<PayslipDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // AppShell handles fallback loading
      }
    }
    loadUser();
  }, []);

  const handleRetry = async () => {
    setIsLoading(true);
    setErrorCode(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/payslips/${encodeURIComponent(runId)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setErrorCode(res.status);
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      const json = await res.json();
      setPayslipData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load payslip.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadPayslipDetail() {
      try {
        const res = await fetch(`/api/v1/payslips/${encodeURIComponent(runId)}`, {
          cache: "no-store",
        });

        if (ignore) return;

        if (!res.ok) {
          setErrorCode(res.status);
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Request failed with status ${res.status}`);
        }

        const json = await res.json();
        if (!ignore) {
          setPayslipData(json.data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load payslip.";
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (runId) {
      loadPayslipDetail();
    }

    return () => {
      ignore = true;
    };
  }, [runId]);

  return (
    <AppShell initialUser={currentUser}>
      {isLoading ? (
        <div className="space-y-6 max-w-4xl mx-auto p-6 bg-[var(--hz-bg-surface)] rounded-2xl border border-[var(--hz-border)] shadow-xs">
          <div className="flex justify-between items-center pb-6 border-b border-[var(--hz-border)]">
            <div className="space-y-2">
              <Skeleton width="12rem" height="1.5rem" />
              <Skeleton width="16rem" height="0.875rem" />
            </div>
            <Skeleton width="8rem" height="2rem" />
          </div>
          <Skeleton variant="rectangular" height="6rem" className="rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rectangular" height="12rem" className="rounded-xl" />
            <Skeleton variant="rectangular" height="12rem" className="rounded-xl" />
          </div>
          <Skeleton variant="rectangular" height="4.5rem" className="rounded-xl" />
        </div>
      ) : errorCode === 403 ? (
        <div className="max-w-xl mx-auto py-12 px-4 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-red-200 dark:border-red-900 shadow-sm">
            🔒
          </div>
          <h2 className="text-xl font-bold text-[var(--hz-text-primary)] mb-2" id="forbidden-heading">
            403 Forbidden — Access Denied
          </h2>
          <p className="text-sm text-[var(--hz-text-secondary)] mb-6 max-w-md mx-auto">
            You do not have permission to access another employee&apos;s payslip.
            All payroll records are strictly restricted by server-side employee ownership rules.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/payslips"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--hz-primary-600)] text-white hover:bg-[var(--hz-primary-700)] transition-colors shadow-xs"
            >
              Return to My Payslips
            </Link>
          </div>
        </div>
      ) : errorCode === 404 ? (
        <div className="max-w-xl mx-auto py-12 px-4 text-center">
          <div className="w-16 h-16 bg-[var(--hz-bg-subtle)] text-[var(--hz-text-muted)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-[var(--hz-border)] shadow-xs">
            📄
          </div>
          <h2 className="text-xl font-bold text-[var(--hz-text-primary)] mb-2" id="not-found-heading">
            Payroll Record Not Found
          </h2>
          <p className="text-sm text-[var(--hz-text-secondary)] mb-6 max-w-md mx-auto">
            The requested payroll run identifier &quot;{runId}&quot; could not be found or does not contain a record for your profile.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/payslips"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--hz-primary-600)] text-white hover:bg-[var(--hz-primary-700)] transition-colors shadow-xs"
            >
              View Available Statements
            </Link>
          </div>
        </div>
      ) : errorMessage || !payslipData ? (
        <ErrorState
          title="Error Loading Payslip"
          description={errorMessage || "Unable to retrieve statement details."}
          onRetry={handleRetry}
        />
      ) : (
        <PayslipDocument payslip={payslipData} />
      )}
    </AppShell>
  );
}

export default function PayslipDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <PayslipDetailContent runId={resolvedParams.run_id} />;
}
