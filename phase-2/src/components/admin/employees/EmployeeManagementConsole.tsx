"use client";

/**
 * Horizon Portal — Admin Employee Management Console
 * src/components/admin/employees/EmployeeManagementConsole.tsx
 *
 * Implements full-stack employee administration console powered by TanStack Table:
 * - Search across employee name, ID, email, phone
 * - Department filtering & status filtering
 * - Server-synchronized column sorting & pagination
 * - Bulk row selection with select-all behavior
 * - Direct CSV export (respecting active filters or selected rows)
 * - Safe deactivation workflow with explicit confirmation
 * - Persistent audit trail inspection
 * - Create & edit employee sliding drawer
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  RowSelectionState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmployeeDrawer } from "./EmployeeDrawer";
import { DeactivateConfirmationModal, DeactivateModalEmployee } from "./DeactivateConfirmationModal";
import { EmployeeAuditModal } from "./EmployeeAuditModal";

export interface AdminEmployee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  workEmail?: string | null;
  phone?: string | null;
  status: string;
  hireDate?: string | null;
  workLocation?: string | null;
  workMode?: string | null;
  employmentType?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  code?: string | null;
}

export function EmployeeManagementConsole() {
  // Data state
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Options
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // Modals state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AdminEmployee | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<DeactivateModalEmployee | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditEmployee, setAuditEmployee] = useState<{ id: string; name: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load department options
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/api/v1/departments");
        if (res.ok) {
          const json = await res.json();
          setDepartments(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    }
    loadDepartments();
  }, []);

  // Fetch employee records
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (department && department !== "all") params.set("department", department);
      if (status && status !== "all") params.set("status", status);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/v1/admin/employees?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access Forbidden: HR or Admin privileges are required to view employee management records.");
        }
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to load employees.");
      }

      const json = await res.json();
      setEmployees(json.data || []);
      setTotal(json.pagination?.total || 0);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, department, status, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle column sort toggle
  const handleSortToggle = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<AdminEmployee>[]>(
    () => [
      // 1. Bulk Selection Checkbox
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            ref={(input) => {
              if (input) {
                input.indeterminate = table.getIsSomePageRowsSelected();
              }
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all employees on this page"
            className="w-4 h-4 rounded border-[var(--hz-border)] text-[var(--hz-primary-600)] focus:ring-[var(--hz-primary-500)] cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select employee ${row.original.fullName}`}
            className="w-4 h-4 rounded border-[var(--hz-border)] text-[var(--hz-primary-600)] focus:ring-[var(--hz-primary-500)] cursor-pointer"
          />
        ),
      },

      // 2. Employee Identifier
      {
        accessorKey: "id",
        header: () => (
          <button
            type="button"
            onClick={() => handleSortToggle("id")}
            className="flex items-center gap-1 font-semibold text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
          >
            <span>Employee ID</span>
            {sortBy === "id" && (
              <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ),
        cell: ({ row }) => (
          <Badge variant="default" className="font-mono text-xs">
            {row.original.id}
          </Badge>
        ),
      },

      // 3. Member (Name & Email)
      {
        accessorKey: "fullName",
        header: () => (
          <button
            type="button"
            onClick={() => handleSortToggle("name")}
            className="flex items-center gap-1 font-semibold text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
          >
            <span>Member</span>
            {sortBy === "name" && (
              <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar
                name={emp.fullName}
                id={emp.id}
                size="sm"
              />
              <div className="min-w-0">
                <div className="font-semibold text-[var(--hz-text-primary)] truncate text-sm">
                  {emp.fullName}
                </div>
                <div className="text-xs text-[var(--hz-text-muted)] truncate">
                  {emp.workEmail || emp.email}
                </div>
              </div>
            </div>
          );
        },
      },

      // 4. Department
      {
        accessorKey: "departmentName",
        header: () => (
          <button
            type="button"
            onClick={() => handleSortToggle("department")}
            className="flex items-center gap-1 font-semibold text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
          >
            <span>Department</span>
            {sortBy === "department" && (
              <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const name = row.original.departmentName;
          const code = row.original.departmentCode;
          return (
            <div className="text-xs">
              <div className="font-medium text-[var(--hz-text-primary)]">
                {name || "Unassigned"}
              </div>
              {code && (
                <div className="text-[10px] text-[var(--hz-text-muted)] font-mono">
                  {code}
                </div>
              )}
            </div>
          );
        },
      },

      // 5. Role / Title
      {
        accessorKey: "roleName",
        header: () => (
          <button
            type="button"
            onClick={() => handleSortToggle("role")}
            className="flex items-center gap-1 font-semibold text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
          >
            <span>Job Title</span>
            {sortBy === "role" && (
              <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-[var(--hz-text-secondary)]">
            {row.original.roleName || "Staff Member"}
          </span>
        ),
      },

      // 6. Work Mode & Location
      {
        id: "workModeLocation",
        header: "Work Mode & Base",
        cell: ({ row }) => {
          const mode = row.original.workMode;
          const loc = row.original.workLocation;
          return (
            <div className="flex items-center gap-2">
              {mode && (
                <Badge
                  variant={
                    mode === "Remote"
                      ? "secondary"
                      : mode === "Hybrid"
                      ? "primary"
                      : "default"
                  }
                  size="sm"
                >
                  {mode}
                </Badge>
              )}
              {loc && (
                <span className="text-xs text-[var(--hz-text-muted)] truncate max-w-[100px]">
                  {loc}
                </span>
              )}
            </div>
          );
        },
      },

      // 7. Employment Status
      {
        accessorKey: "status",
        header: () => (
          <button
            type="button"
            onClick={() => handleSortToggle("status")}
            className="flex items-center gap-1 font-semibold text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
          >
            <span>Status</span>
            {sortBy === "status" && (
              <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ),
        cell: ({ row }) => {
          const s = row.original.status || "Active";
          return (
            <Badge
              variant={
                s === "Active"
                  ? "success"
                  : s === "Inactive" || s === "Deactivated"
                  ? "danger"
                  : "warning"
              }
            >
              {s}
            </Badge>
          );
        },
      },

      // 8. Actions
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Edit button */}
              <button
                id={`btn-edit-${emp.id}`}
                type="button"
                onClick={() => {
                  setEditingEmployee(emp);
                  setDrawerOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-md text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)] bg-[var(--hz-primary-50)] dark:bg-[var(--hz-neutral-800)] hover:bg-[var(--hz-primary-100)] transition-colors"
                title="Edit Employee"
              >
                Edit
              </button>

              {/* Deactivate button */}
              {emp.status !== "Inactive" && emp.status !== "Deactivated" ? (
                <button
                  id={`btn-deactivate-${emp.id}`}
                  type="button"
                  onClick={() => {
                    setEmployeeToDeactivate({
                      id: emp.id,
                      fullName: emp.fullName,
                      email: emp.email,
                      departmentName: emp.departmentName,
                      roleName: emp.roleName,
                      status: emp.status,
                    });
                    setDeactivateModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md text-[var(--hz-danger,#b91c1c)] bg-[var(--hz-danger-bg,#fef2f2)] hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                  title="Deactivate Employee"
                >
                  Deactivate
                </button>
              ) : (
                <span className="text-[11px] text-[var(--hz-text-muted)] italic px-2">
                  Inactive
                </span>
              )}

              {/* Audit History button */}
              <button
                id={`btn-audit-${emp.id}`}
                type="button"
                onClick={() => {
                  setAuditEmployee({ id: emp.id, name: emp.fullName });
                  setAuditModalOpen(true);
                }}
                className="p-1 rounded-md text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)] hover:bg-[var(--hz-neutral-100)] dark:hover:bg-[var(--hz-neutral-800)] transition-colors"
                title="View Audit Trail"
                aria-label={`View audit trail for ${emp.fullName}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder]
  );

  // Initialize TanStack Table instance
  const table = useReactTable({
    data: employees,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  // Calculate selected employee IDs
  const selectedCount = Object.keys(rowSelection).length;
  const selectedEmployeeIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((indexStr) => employees[parseInt(indexStr, 10)]?.id)
      .filter(Boolean);
  }, [rowSelection, employees]);

  // Handle CSV Export
  const handleExportCsv = (onlySelected: boolean) => {
    const params = new URLSearchParams();

    if (onlySelected && selectedEmployeeIds.length > 0) {
      params.set("ids", selectedEmployeeIds.join(","));
    } else {
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (department && department !== "all") params.set("department", department);
      if (status && status !== "all") params.set("status", status);
    }

    const downloadUrl = `/api/v1/admin/employees/export?${params.toString()}`;
    window.open(downloadUrl, "_blank");

    setFeedbackMessage(
      onlySelected
        ? `Exporting ${selectedEmployeeIds.length} selected employee(s)...`
        : `Exporting filtered employee records...`
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[var(--hz-text-primary)] tracking-tight">
              Employee Management Console
            </h1>
            <Badge variant="primary">Admin</Badge>
          </div>
          <p className="text-xs text-[var(--hz-text-muted)] mt-1">
            Administer workforce profiles, manage organizational assignments, export reports, and inspect compliance audits.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5">
          {/* CSV Export Button */}
          {selectedCount > 0 ? (
            <Button
              id="btn-export-csv"
              variant="secondary"
              size="sm"
              onClick={() => handleExportCsv(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Export Selected ({selectedCount})
            </Button>
          ) : (
            <Button
              id="btn-export-csv"
              variant="secondary"
              size="sm"
              onClick={() => handleExportCsv(false)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Export All CSV
            </Button>
          )}

          {/* Add Employee Button */}
          <Button
            id="btn-add-employee"
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingEmployee(null);
              setDrawerOpen(true);
            }}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-[var(--hz-primary-50,#eef2ff)] border border-[var(--hz-primary-200,#c7d2fe)] text-[var(--hz-primary-800,#3730a3)] text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 shrink-0 text-[var(--hz-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[var(--hz-card-bg)] border border-[var(--hz-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Global Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--hz-text-muted)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="employee-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, or phone..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-56">
          <select
            id="department-filter"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.code ? `(${d.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-36">
          <select
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        {/* Page Size Selector */}
        <div className="w-full md:w-28">
          <select
            id="pagesize-selector"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Selected Rows Action Bar */}
      {selectedCount > 0 && (
        <div className="px-4 py-2.5 rounded-xl bg-[var(--hz-primary-50,#eef2ff)] dark:bg-[var(--hz-neutral-850)] border border-[var(--hz-primary-200,#c7d2fe)] dark:border-[var(--hz-border)] flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--hz-primary-900)] dark:text-[var(--hz-primary-300)]">
              {selectedCount} employee{selectedCount > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportCsv(true)}
            >
              Export Selected CSV
            </Button>
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-xs text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)] underline ml-2"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 rounded-2xl bg-[var(--hz-danger-bg,#fef2f2)] border border-[var(--hz-danger,#ef4444)] text-center space-y-3">
          <div className="text-sm font-semibold text-[var(--hz-danger,#b91c1c)]">{error}</div>
          <Button variant="secondary" size="sm" onClick={() => fetchEmployees()}>
            Retry Request
          </Button>
        </div>
      )}

      {/* Table Section */}
      {!error && (
        <div className="rounded-2xl bg-[var(--hz-card-bg)] border border-[var(--hz-border)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] border-b border-[var(--hz-border)] text-[var(--hz-text-secondary)] font-semibold uppercase tracking-wider">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-[var(--hz-border)]">
                {loading ? (
                  // Skeleton Loading State
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="px-4 py-3.5">
                        <div className="w-4 h-4 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-20 h-4 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                          <div className="space-y-1">
                            <div className="w-28 h-3 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                            <div className="w-36 h-2 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-24 h-4 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-28 h-4 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-20 h-4 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-14 h-4 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-20 h-6 rounded bg-[var(--hz-neutral-200)] dark:bg-[var(--hz-neutral-800)] ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-16 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--hz-neutral-100)] dark:bg-[var(--hz-neutral-800)] flex items-center justify-center text-xl mb-3">
                        👥
                      </div>
                      <h4 className="text-sm font-bold text-[var(--hz-text-primary)]">
                        No employees match your filter criteria
                      </h4>
                      <p className="text-xs text-[var(--hz-text-muted)] mt-1 max-w-sm mx-auto">
                        Try modifying your search term or selecting another department filter to view workforce members.
                      </p>
                      {(search || department !== "all" || status !== "all") && (
                        <div className="mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSearch("");
                              setDepartment("all");
                              setStatus("all");
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-[var(--hz-neutral-50)] dark:hover:bg-[var(--hz-neutral-850)] transition-colors ${
                        row.getIsSelected()
                          ? "bg-[var(--hz-primary-50,#eef2ff)] dark:bg-[var(--hz-neutral-800)]"
                          : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3.5 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && employees.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-[var(--hz-text-muted)]">
                Showing <strong className="text-[var(--hz-text-primary)]">{(page - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-[var(--hz-text-primary)]">{Math.min(page * pageSize, total)}</strong> of{" "}
                <strong className="text-[var(--hz-text-primary)]">{total}</strong> employees
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>

                <div className="px-2 font-semibold text-[var(--hz-text-primary)]">
                  Page {page} of {totalPages}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer for Create / Edit */}
      <EmployeeDrawer
        isOpen={drawerOpen}
        initialData={editingEmployee}
        onClose={() => {
          setDrawerOpen(false);
          setEditingEmployee(null);
        }}
        onSuccess={() => {
          fetchEmployees();
          setFeedbackMessage(
            editingEmployee
              ? `Employee ${editingEmployee.id} updated successfully.`
              : "New employee record created successfully."
          );
          setTimeout(() => setFeedbackMessage(null), 4000);
        }}
      />

      {/* Deactivation Modal */}
      <DeactivateConfirmationModal
        isOpen={deactivateModalOpen}
        employee={employeeToDeactivate}
        onClose={() => {
          setDeactivateModalOpen(false);
          setEmployeeToDeactivate(null);
        }}
        onSuccess={() => {
          fetchEmployees();
          setFeedbackMessage(
            `Employee ${employeeToDeactivate?.fullName} safely deactivated.`
          );
          setTimeout(() => setFeedbackMessage(null), 4000);
        }}
      />

      {/* Audit Modal */}
      <EmployeeAuditModal
        isOpen={auditModalOpen}
        employeeId={auditEmployee?.id || null}
        employeeName={auditEmployee?.name || null}
        onClose={() => {
          setAuditModalOpen(false);
          setAuditEmployee(null);
        }}
      />
    </div>
  );
}
