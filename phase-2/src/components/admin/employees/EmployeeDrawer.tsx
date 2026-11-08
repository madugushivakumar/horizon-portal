"use client";

/**
 * Horizon Portal — Employee Create / Edit Drawer
 * src/components/admin/employees/EmployeeDrawer.tsx
 *
 * Implements sliding drawer for adding and editing workforce records:
 * - Powered by React Hook Form & Zod schema validation
 * - Dynamic department and organizational role resolution
 * - Client-side validation with field-level accessible error feedback
 * - Disables double-submission during save operations
 * - Reversible backdrop and keyboard (ESC) accessibility
 */

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  EmployeeCreateInput,
  EmployeeUpdateInput,
} from "@/lib/validations/employee";
import { Button } from "@/components/ui/button";

export interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    workEmail?: string | null;
    phone?: string | null;
    departmentId?: string | null;
    roleId?: string | null;
    managerId?: string | null;
    workLocation?: string | null;
    workMode?: string | null;
    employmentType?: string | null;
    hireDate?: string | null;
    status?: string;
  } | null;
}

interface DepartmentOption {
  id: string;
  name: string;
  code?: string | null;
}

interface RoleOption {
  id: string;
  name: string;
  departmentId?: string | null;
}

export function EmployeeDrawer({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EmployeeDrawerProps) {
  const isEditMode = Boolean(initialData?.id);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Use appropriate schema based on mode
  const currentSchema = isEditMode ? employeeUpdateSchema : employeeCreateSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      workEmail: "",
      phone: "",
      departmentId: "",
      roleId: "",
      managerId: "",
      workLocation: "",
      workMode: "",
      employmentType: "Permanent",
      hireDate: new Date().toISOString().split("T")[0],
      status: "Active",
    },
  });

  const selectedDeptId = watch("departmentId");

  // Load departments and roles
  useEffect(() => {
    async function loadOptions() {
      try {
        const [deptRes, rolesRes] = await Promise.all([
          fetch("/api/v1/departments"),
          fetch("/api/v1/roles"),
        ]);

        if (deptRes.ok) {
          const deptJson = await deptRes.json();
          setDepartments(deptJson.data || []);
        }
        if (rolesRes.ok) {
          const rolesJson = await rolesRes.json();
          setRoles(rolesJson.data || []);
        }
      } catch (err) {
        console.error("Failed to load options for employee drawer:", err);
      }
    }

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // Sync form values when initialData or open state changes
  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setFieldErrors({});

      if (initialData) {
        reset({
          id: initialData.id,
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          workEmail: initialData.workEmail || initialData.email || "",
          phone: initialData.phone || "",
          departmentId: initialData.departmentId || "",
          roleId: initialData.roleId || "",
          managerId: initialData.managerId || "",
          workLocation: initialData.workLocation || "",
          workMode: initialData.workMode || "",
          employmentType: initialData.employmentType || "Permanent",
          hireDate: initialData.hireDate || "",
          status: initialData.status || "Active",
        });
      } else {
        // Auto-generate random ID suggestion for new employees
        const randomId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        reset({
          id: randomId,
          firstName: "",
          lastName: "",
          email: "",
          workEmail: "",
          phone: "",
          departmentId: "",
          roleId: "",
          managerId: "",
          workLocation: "Bangalore",
          workMode: "Hybrid",
          employmentType: "Permanent",
          hireDate: new Date().toISOString().split("T")[0],
          status: "Active",
        });
      }
    }
  }, [isOpen, initialData, reset]);

  // Handle ESC key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const onSubmit = async (data: any) => {
    setServerError(null);
    setFieldErrors({});

    try {
      const url = isEditMode
        ? `/api/v1/admin/employees/${encodeURIComponent(initialData!.id)}`
        : "/api/v1/admin/employees";

      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseJson = await res.json();

      if (!res.ok) {
        setServerError(responseJson.error || "Failed to save employee record.");
        if (responseJson.details) {
          setFieldErrors(responseJson.details);
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.message || "An unexpected network error occurred.");
    }
  };

  if (!isOpen) return null;

  // Filter roles based on selected department if desired, or show all
  const filteredRoles = selectedDeptId
    ? roles.filter((r) => !r.departmentId || r.departmentId === selectedDeptId)
    : roles;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[var(--hz-neutral-0)] dark:bg-[var(--hz-neutral-900)] border-l border-[var(--hz-border)] shadow-2xl flex flex-col transition-transform duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--hz-border)] flex items-center justify-between">
            <div>
              <h2
                id="drawer-title"
                className="text-lg font-bold text-[var(--hz-text-primary)]"
              >
                {isEditMode ? `Edit Employee: ${initialData?.id}` : "Add New Employee"}
              </h2>
              <p className="text-xs text-[var(--hz-text-muted)] mt-0.5">
                {isEditMode
                  ? "Update workforce member credentials, organizational department, and status."
                  : "Create an active employee record and initialize historical audit logging."}
              </p>
            </div>
            <button
              id="btn-close-drawer"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-md text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)] hover:bg-[var(--hz-neutral-100)] dark:hover:bg-[var(--hz-neutral-800)] transition-colors"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Body */}
          <form
            id="employee-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {/* Global Error Alert */}
            {serverError && (
              <div
                className="p-3.5 rounded-lg bg-[var(--hz-danger-bg,#fef2f2)] border border-[var(--hz-danger,#ef4444)] text-[var(--hz-danger,#b91c1c)] text-xs flex items-start gap-2.5"
                role="alert"
              >
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 font-medium">{serverError}</div>
              </div>
            )}

            {/* Employee ID */}
            <div>
              <label
                htmlFor="emp-id"
                className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
              >
                Employee Identifier <span className="text-[var(--hz-danger,#ef4444)]">*</span>
              </label>
              <input
                id="emp-id"
                type="text"
                disabled={isEditMode || isSubmitting}
                {...register("id")}
                placeholder="e.g. EMP-0450"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] placeholder:text-[var(--hz-text-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] ${
                  isEditMode ? "opacity-70 cursor-not-allowed bg-[var(--hz-neutral-100)] dark:bg-[var(--hz-neutral-800)]" : ""
                } ${errors.id || fieldErrors.id ? "border-[var(--hz-danger,#ef4444)]" : "border-[var(--hz-border)]"}`}
                aria-invalid={Boolean(errors.id || fieldErrors.id)}
              />
              {(errors.id?.message || fieldErrors.id?.[0]) && (
                <p className="mt-1 text-xs text-[var(--hz-danger,#ef4444)]">
                  {String(errors.id?.message || fieldErrors.id?.[0])}
                </p>
              )}
            </div>

            {/* Name Fields (Grid) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="emp-first-name"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  First Name <span className="text-[var(--hz-danger,#ef4444)]">*</span>
                </label>
                <input
                  id="emp-first-name"
                  type="text"
                  disabled={isSubmitting}
                  {...register("firstName")}
                  placeholder="e.g. Alexander"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] ${
                    errors.firstName || fieldErrors.firstName ? "border-[var(--hz-danger,#ef4444)]" : "border-[var(--hz-border)]"
                  }`}
                  aria-invalid={Boolean(errors.firstName || fieldErrors.firstName)}
                />
                {(errors.firstName?.message || fieldErrors.firstName?.[0]) && (
                  <p className="mt-1 text-xs text-[var(--hz-danger,#ef4444)]">
                    {String(errors.firstName?.message || fieldErrors.firstName?.[0])}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="emp-last-name"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Last Name <span className="text-[var(--hz-danger,#ef4444)]">*</span>
                </label>
                <input
                  id="emp-last-name"
                  type="text"
                  disabled={isSubmitting}
                  {...register("lastName")}
                  placeholder="e.g. Wright"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] ${
                    errors.lastName || fieldErrors.lastName ? "border-[var(--hz-danger,#ef4444)]" : "border-[var(--hz-border)]"
                  }`}
                  aria-invalid={Boolean(errors.lastName || fieldErrors.lastName)}
                />
                {(errors.lastName?.message || fieldErrors.lastName?.[0]) && (
                  <p className="mt-1 text-xs text-[var(--hz-danger,#ef4444)]">
                    {String(errors.lastName?.message || fieldErrors.lastName?.[0])}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="emp-email"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Primary Email <span className="text-[var(--hz-danger,#ef4444)]">*</span>
                </label>
                <input
                  id="emp-email"
                  type="email"
                  disabled={isSubmitting}
                  {...register("email")}
                  placeholder="alex.wright@growmar.com"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)] ${
                    errors.email || fieldErrors.email ? "border-[var(--hz-danger,#ef4444)]" : "border-[var(--hz-border)]"
                  }`}
                  aria-invalid={Boolean(errors.email || fieldErrors.email)}
                />
                {(errors.email?.message || fieldErrors.email?.[0]) && (
                  <p className="mt-1 text-xs text-[var(--hz-danger,#ef4444)]">
                    {String(errors.email?.message || fieldErrors.email?.[0])}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="emp-phone"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Contact Phone
                </label>
                <input
                  id="emp-phone"
                  type="tel"
                  disabled={isSubmitting}
                  {...register("phone")}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                />
              </div>
            </div>

            {/* Department & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="emp-department"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Department
                </label>
                <select
                  id="emp-department"
                  disabled={isSubmitting}
                  {...register("departmentId")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="emp-role"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Job Title / Role
                </label>
                <select
                  id="emp-role"
                  disabled={isSubmitting}
                  {...register("roleId")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                >
                  <option value="">Select Organizational Role</option>
                  {filteredRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Mode & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="emp-work-mode"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Work Mode
                </label>
                <select
                  id="emp-work-mode"
                  disabled={isSubmitting}
                  {...register("workMode")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                >
                  <option value="">Select Work Mode</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="emp-location"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Base Location
                </label>
                <input
                  id="emp-location"
                  type="text"
                  disabled={isSubmitting}
                  {...register("workLocation")}
                  placeholder="e.g. Bangalore, Pune"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                />
              </div>
            </div>

            {/* Employment Type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="emp-type"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Employment Type
                </label>
                <select
                  id="emp-type"
                  disabled={isSubmitting}
                  {...register("employmentType")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                  <option value="Full-Time">Full-Time</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="emp-status"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Status
                </label>
                <select
                  id="emp-status"
                  disabled={isSubmitting}
                  {...register("status")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            {/* Hire Date & Manager ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="emp-hire-date"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Hire Date
                </label>
                <input
                  id="emp-hire-date"
                  type="date"
                  disabled={isSubmitting}
                  {...register("hireDate")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                />
              </div>

              <div>
                <label
                  htmlFor="emp-manager-id"
                  className="block text-xs font-semibold text-[var(--hz-text-secondary)] mb-1"
                >
                  Reporting Manager ID
                </label>
                <input
                  id="emp-manager-id"
                  type="text"
                  disabled={isSubmitting}
                  {...register("managerId")}
                  placeholder="e.g. EMP-0246"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--hz-border)] bg-[var(--hz-card-bg)] text-[var(--hz-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--hz-primary-500)]"
                />
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[var(--hz-border)] bg-[var(--hz-neutral-50)] dark:bg-[var(--hz-neutral-850)] flex items-center justify-end gap-3">
            <Button
              id="btn-cancel-employee"
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-employee"
              type="submit"
              form="employee-form"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEditMode ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
