"use client";

/**
 * Horizon Portal — People Directory
 * src/app/people/page.tsx
 *
 * Full-featured workforce directory with:
 * - Server-backed debounced search across names and employee IDs
 * - Dynamic department filtering fetched from SQLite database
 * - Database-backed deterministic pagination
 * - Grid and table view toggle
 * - Reusable deterministic Avatar initials
 * - Safe: Strictly zero salary or private field exposure
 */

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SafeEmployeeSummary, PaginationMetadata } from "@/types/employee";

interface DepartmentOption {
  id: string;
  name: string;
  code?: string | null;
  employeeCount?: number;
}

export default function PeopleDirectoryPage() {
  const [, startTransition] = useTransition();

  // Filter & Search states
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Data states
  const [employees, setEmployees] = useState<SafeEmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1); // Reset to page 1 on search change
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch departments list on mount
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/api/v1/departments");
        if (res.ok) {
          const json = await res.json();
          setDepartments(json.data || []);
        }
      } catch {
        // Fallback silently if departments cannot be loaded
      }
    }
    loadDepartments();
  }, []);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Fetch employees directory matching current search, department, and pagination
  useEffect(() => {
    let ignore = false;

    async function loadDirectory() {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedDepartment && selectedDepartment !== "all") {
          params.set("department", selectedDepartment);
        }
        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));

        const res = await fetch(`/api/v1/employees?${params.toString()}`);

        if (!res.ok) {
          throw new Error(`Failed to load directory records (HTTP ${res.status}).`);
        }

        const json = await res.json();
        if (!ignore) {
          startTransition(() => {
            setEmployees(json.data || []);
            if (json.pagination) {
              setPagination(json.pagination);
            }
          });
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error retrieving workforce directory");
          setIsLoading(false);
        }
      }
    }

    loadDirectory();

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, selectedDepartment, currentPage, pageSize, reloadTrigger]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setReloadTrigger((t) => t + 1);
  }

  // Handle department filter change
  function handleDepartmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedDepartment(e.target.value);
    setCurrentPage(1); // Reset to page 1 on filter change
  }

  // Clear all filters
  function handleClearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedDepartment("all");
    setCurrentPage(1);
  }

  // Calculate results range
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--hz-text-primary)]">
                People Directory
              </h1>
              <Badge variant="primary" size="md">
                {pagination.total} Colleague{pagination.total === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[var(--hz-text-muted)]">
              Find colleagues, view organizational roles, and inspect reporting lines across Aura Workforce.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-[var(--hz-primary-600)] text-white shadow-sm"
                  : "text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] hover:text-[var(--hz-text-primary)]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "table"
                  ? "bg-[var(--hz-primary-600)] text-white shadow-sm"
                  : "text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] hover:text-[var(--hz-text-primary)]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--hz-text-muted)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, ID (e.g. EMP-004), or email..."
              aria-label="Search employees directory"
              className="w-full rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] py-2.5 pl-10 pr-10 text-xs font-medium text-[var(--hz-text-primary)] placeholder-[var(--hz-text-muted)] focus:border-[var(--hz-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-500)]/20 shadow-sm transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                aria-label="Clear search input"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter Select */}
          <div className="w-full md:w-64">
            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              aria-label="Filter by department"
              className="w-full rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-3 py-2.5 text-xs font-medium text-[var(--hz-text-primary)] focus:border-[var(--hz-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-500)]/20 shadow-sm transition-all"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.employeeCount !== undefined ? `(${dept.employeeCount})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size Select */}
          <div className="w-full md:w-36">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Items per page"
              className="w-full rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-3 py-2.5 text-xs font-medium text-[var(--hz-text-primary)] focus:border-[var(--hz-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--hz-primary-500)]/20 shadow-sm transition-all"
            >
              <option value="6">6 per page</option>
              <option value="12">12 per page</option>
              <option value="24">24 per page</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {(debouncedSearch || selectedDepartment !== "all") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 shrink-0"
            >
              Reset
            </Button>
          )}
        </div>

        {/* ── Active Filters Indicator ────────────────────────── */}
        {(debouncedSearch || selectedDepartment !== "all") && (
          <div className="flex items-center gap-2 text-xs text-[var(--hz-text-muted)]">
            <span>Filtering by:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--hz-primary-50)] dark:bg-[var(--hz-primary-950)] px-2 py-0.5 font-semibold text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)] border border-[var(--hz-primary-200)] dark:border-[var(--hz-primary-800)]">
                Query: &ldquo;{debouncedSearch}&rdquo;
              </span>
            )}
            {selectedDepartment !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--hz-bg-subtle)] px-2 py-0.5 font-semibold text-[var(--hz-text-primary)] border border-[var(--hz-border-subtle)]">
                Dept: {departments.find((d) => d.id === selectedDepartment)?.name || selectedDepartment}
              </span>
            )}
          </div>
        )}

        {/* ── Loading Skeleton Grid ───────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(pageSize)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] space-y-4 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                    <div className="space-y-1.5">
                      <Skeleton variant="text" width="7rem" height="0.875rem" />
                      <Skeleton variant="text" width="4rem" height="0.625rem" />
                    </div>
                  </div>
                  <Skeleton variant="rectangular" width="3rem" height="1.25rem" className="rounded-md" />
                </div>
                <div className="space-y-2 pt-2 border-t border-[var(--hz-border-subtle)]">
                  <Skeleton variant="text" width="100%" height="0.75rem" />
                  <Skeleton variant="text" width="60%" height="0.75rem" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error State with Retry ──────────────────────────── */}
        {!isLoading && error && (
          <ErrorState
            title="Failed to Load People Directory"
            description={error}
            onRetry={handleRetry}
            retryLabel="Retry Loading Directory"
          />
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!isLoading && !error && employees.length === 0 && (
          <EmptyState
            title="No Colleagues Found"
            description={
              debouncedSearch || selectedDepartment !== "all"
                ? "No employee records matched your active search query and department filter."
                : "The personnel database currently contains zero registered workforce records."
            }
            action={
              (debouncedSearch || selectedDepartment !== "all") && (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              )
            }
          />
        )}

        {/* ── Employees Display: Grid View ─────────────────────── */}
        {!isLoading && !error && employees.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <Card
                key={emp.id}
                interactive
                className="p-5 flex flex-col justify-between border-[var(--hz-border-default)] shadow-sm hover:border-[var(--hz-primary-500)] hover:shadow-md transition-all group"
              >
                <div>
                  {/* Top Bar with Avatar, Name, Status & ID */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={emp.name} id={emp.id} size="md" />
                      <div className="min-w-0">
                        <Link
                          href={`/people/${emp.id}`}
                          className="block text-sm font-bold text-[var(--hz-text-primary)] group-hover:text-[var(--hz-primary-600)] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[var(--hz-primary-500)]"
                        >
                          {emp.name}
                        </Link>
                        <p className="text-xs text-[var(--hz-text-muted)] truncate">
                          {emp.role?.name || "Staff Member"}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-[11px] font-semibold text-[var(--hz-text-muted)] shrink-0 px-2 py-0.5 rounded bg-[var(--hz-bg-subtle)] border border-[var(--hz-border-subtle)]">
                      {emp.id}
                    </span>
                  </div>

                  {/* Metadata & Department */}
                  <div className="mt-4 pt-3 border-t border-[var(--hz-border-subtle)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--hz-text-muted)]">Department:</span>
                      <span className="font-medium text-[var(--hz-text-primary)] truncate max-w-[170px] text-right">
                        {emp.department?.name || "Corporate"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[var(--hz-text-muted)]">Reports To:</span>
                      {emp.manager ? (
                        <Link
                          href={`/people/${emp.manager.id}`}
                          className="font-medium text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] hover:underline truncate max-w-[170px] text-right"
                        >
                          {emp.manager.name}
                        </Link>
                      ) : (
                        <span className="text-[var(--hz-text-muted)] italic">Executive / None</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[var(--hz-text-muted)]">Email:</span>
                      <a
                        href={`mailto:${emp.email}`}
                        className="text-[var(--hz-text-secondary)] hover:text-[var(--hz-primary-600)] truncate max-w-[170px] text-right"
                      >
                        {emp.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer Link to Profile */}
                <div className="mt-4 pt-3 border-t border-[var(--hz-border-default)] flex items-center justify-between">
                  <Badge variant={emp.status === "Active" ? "success" : "secondary"} size="sm" dot>
                    {emp.status}
                  </Badge>

                  <Link
                    href={`/people/${emp.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] group-hover:underline"
                  >
                    <span>View Profile</span>
                    <svg className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Employees Display: Table View ────────────────────── */}
        {!isLoading && !error && employees.length > 0 && viewMode === "table" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--hz-bg-subtle)]/70 border-b border-[var(--hz-border-default)] text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Employee</th>
                  <th scope="col" className="px-4 py-3.5">ID</th>
                  <th scope="col" className="px-4 py-3.5">Department</th>
                  <th scope="col" className="px-4 py-3.5">Job Role</th>
                  <th scope="col" className="px-4 py-3.5">Manager</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hz-border-subtle)] font-medium">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[var(--hz-bg-subtle)]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} id={emp.id} size="sm" />
                        <div>
                          <Link
                            href={`/people/${emp.id}`}
                            className="font-bold text-[var(--hz-text-primary)] hover:text-[var(--hz-primary-600)] transition-colors block"
                          >
                            {emp.name}
                          </Link>
                          <span className="text-[11px] text-[var(--hz-text-muted)]">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--hz-text-muted)]">
                      {emp.id}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--hz-text-primary)]">
                      {emp.department?.name || "Corporate"}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--hz-text-secondary)]">
                      {emp.role?.name || "Staff Member"}
                    </td>
                    <td className="px-4 py-3.5">
                      {emp.manager ? (
                        <Link
                          href={`/people/${emp.manager.id}`}
                          className="text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] hover:underline"
                        >
                          {emp.manager.name}
                        </Link>
                      ) : (
                        <span className="text-[var(--hz-text-muted)] italic">Executive</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={emp.status === "Active" ? "success" : "secondary"} size="sm" dot>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/people/${emp.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--hz-border-default)] px-2.5 py-1 text-xs font-semibold text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)] hover:bg-[var(--hz-bg-subtle)] transition-colors"
                      >
                        Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Controls ─────────────────────────────── */}
        {!isLoading && !error && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-[var(--hz-text-muted)]">
              Showing <span className="font-semibold text-[var(--hz-text-primary)]">{startItem}</span> to{" "}
              <span className="font-semibold text-[var(--hz-text-primary)]">{endItem}</span> of{" "}
              <span className="font-semibold text-[var(--hz-text-primary)]">{pagination.total}</span> colleagues
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1 px-2 text-xs font-semibold text-[var(--hz-text-primary)]">
                <span>Page</span>
                <span className="font-bold text-[var(--hz-primary-600)]">{pagination.page}</span>
                <span>of</span>
                <span>{pagination.totalPages}</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={currentPage >= pagination.totalPages}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
