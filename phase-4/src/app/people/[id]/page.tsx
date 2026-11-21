"use client";

/**
 * Horizon Portal — Employee Profile View
 * src/app/people/[id]/page.tsx
 *
 * Displays safe personal profile information, organizational context, and the
 * official 3-tier reporting line (Manager above -> Employee -> Direct Reports below).
 *
 * STRICT PRIVACY:
 * Guaranteed zero exposure of salary, compensation, bank accounts, or credentials.
 */

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ReportingLine } from "@/components/profile/ReportingLine";
import { SafeEmployeeProfile } from "@/types/employee";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeProfilePage({ params }: PageProps) {
  const router = useRouter();
  const { id: rawId } = use(params);
  const employeeId = decodeURIComponent(rawId);

  const [profile, setProfile] = useState<SafeEmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const res = await fetch(`/api/v1/employees/${encodeURIComponent(employeeId)}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (!ignore) {
            setErrorStatus(res.status);
            setErrorMessage(errData.error || `Failed to retrieve employee profile (HTTP ${res.status}).`);
            setIsLoading(false);
          }
          return;
        }

        const json = await res.json();
        if (!json.data) {
          throw new Error("Invalid response format received from profile service.");
        }

        if (!ignore) {
          setProfile(json.data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : "Error retrieving profile");
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [employeeId, reloadKey]);

  function handleRetry() {
    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    setReloadKey((k) => k + 1);
  }

  function handleCopyId() {
    if (profile?.id) {
      navigator.clipboard?.writeText(profile.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }

  // Loading Skeleton State
  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton variant="text" width="6rem" height="1rem" />
            <Skeleton variant="text" width="1rem" height="1rem" />
            <Skeleton variant="text" width="10rem" height="1rem" />
          </div>

          <Skeleton variant="rectangular" height="13rem" className="rounded-3xl" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rectangular" height="10rem" className="rounded-2xl" />
            <Skeleton variant="rectangular" height="10rem" className="rounded-2xl" />
          </div>

          <Skeleton variant="rectangular" height="16rem" className="rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  // Not Found State (404)
  if (errorStatus === 404) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12">
          <EmptyState
            title="Employee Not Found"
            description={`No personnel record was found matching ID "${employeeId}". The employee may have been relocated, deactivated, or the link is incorrect.`}
            action={
              <div className="flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={() => router.push("/people")}>
                  Return to People Directory
                </Button>
                <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
              </div>
            }
          />
        </div>
      </AppShell>
    );
  }

  // Error State
  if (errorMessage || !profile) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12">
          <ErrorState
            title="Profile Unavailable"
            description={errorMessage || "Unable to load the requested profile at this time."}
            onRetry={handleRetry}
            retryLabel="Retry Loading Profile"
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
        {/* Navigation Breadcrumb Context & Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/people"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--hz-text-secondary)] hover:text-[var(--hz-primary-600)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to People Directory</span>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyId}
            aria-label="Copy employee identifier"
          >
            {copiedId ? "✓ Copied ID" : `Copy ID (${profile.id})`}
          </Button>
        </div>

        {/* ── 1. Main Identity Hero Card ──────────────────────── */}
        <Card className="overflow-hidden border-[var(--hz-border-default)] shadow-sm">
          <div className="h-24 sm:h-28 bg-gradient-to-r from-[var(--hz-primary-600)] via-[var(--hz-primary-700)] to-[var(--hz-secondary-600)]" />
          <CardContent className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              {/* Avatar with deterministic color */}
              <div className="relative">
                <Avatar
                  name={profile.name}
                  id={profile.id}
                  size="xl"
                  className="ring-4 ring-[var(--hz-bg-surface)] shadow-lg"
                />
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={profile.status === "Active" ? "success" : "secondary"}
                  size="md"
                  dot
                >
                  {profile.status} Member
                </Badge>
                {profile.department && (
                  <Badge variant="primary" size="md">
                    {profile.department.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Name, Role & ID */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--hz-text-primary)]">
                  {profile.name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--hz-bg-subtle)] border border-[var(--hz-border-subtle)] text-[var(--hz-text-muted)]">
                  {profile.id}
                </span>
              </div>

              <p className="text-sm font-medium text-[var(--hz-text-secondary)]">
                {profile.role?.name || "Staff Member"} ·{" "}
                <span className="text-[var(--hz-text-muted)]">
                  {profile.department?.name || "Corporate"}
                </span>
              </p>
            </div>

            {/* Contact Information Bar */}
            <div className="mt-6 pt-6 border-t border-[var(--hz-border-default)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
                  Work Email
                </span>
                <div>
                  <a
                    href={`mailto:${profile.email}`}
                    className="font-medium text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] hover:underline"
                  >
                    {profile.email}
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
                  Work Phone
                </span>
                <div>
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="font-medium text-[var(--hz-text-primary)] hover:underline"
                    >
                      {profile.phone}
                    </a>
                  ) : (
                    <span className="text-[var(--hz-text-muted)] italic">Not registered</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
                  Hire Date
                </span>
                <div className="font-medium text-[var(--hz-text-primary)]">
                  {profile.hireDate
                    ? new Date(profile.hireDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Standard Onboarding"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Department & Role Information ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hz-border-subtle)]">
                <span className="text-[var(--hz-text-muted)] font-medium">Department Name:</span>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  {profile.department?.name || "Corporate"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hz-border-subtle)]">
                <span className="text-[var(--hz-text-muted)] font-medium">Department Code:</span>
                <span className="font-mono font-semibold text-[var(--hz-primary-600)]">
                  {profile.department?.code || "GEN"}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[var(--hz-text-muted)] block mb-1">Operational Purpose:</span>
                <p className="text-[var(--hz-text-secondary)] leading-relaxed">
                  {profile.department?.description || "Provides strategic functional support for the organization."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role & Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hz-border-subtle)]">
                <span className="text-[var(--hz-text-muted)] font-medium">Official Title:</span>
                <span className="font-semibold text-[var(--hz-text-primary)]">
                  {profile.role?.name || "Team Member"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hz-border-subtle)]">
                <span className="text-[var(--hz-text-muted)] font-medium">Role Identifier:</span>
                <span className="font-mono text-[var(--hz-text-muted)]">
                  {profile.role?.id || "N/A"}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[var(--hz-text-muted)] block mb-1">Scope of Authority:</span>
                <p className="text-[var(--hz-text-secondary)] leading-relaxed">
                  {profile.role?.description || "Executes domain objectives according to workforce governance guidelines."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 3. Organizational Reporting Line (Manager Above / Direct Reports Below) ── */}
        <ReportingLine
          currentEmployee={{
            id: profile.id,
            name: profile.name,
            role: profile.role,
            department: profile.department,
          }}
          manager={profile.manager}
          directReports={profile.directReports}
        />
      </div>
    </AppShell>
  );
}
