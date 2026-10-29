/**
 * Admin Employee Bulk CSV Export Endpoint
 * GET /api/v1/admin/employees/export
 *
 * Implements secure, audited CSV export:
 * - Respects active search and department filters, exporting ALL matching records (not just page 1)
 * - Supports explicit bulk row selection via `ids` query parameter
 * - Formula injection protection against `=`, `+`, `-`, `@`, `\t`, `\r`
 * - Full Unicode and UTF-8 Byte Order Mark (BOM) support for spreadsheet compatibility
 * - Proper RFC 4180 quote, comma, and newline escaping
 * - Strictly excludes sensitive fields (salary, password hashes, credentials)
 * - Records audit trail of export operation
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { getActorSnapshot, logEmployeeExport } from "@/lib/audit/audit-logger";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

// Spreadsheet formula-triggering characters
const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Sanitizes a cell value to prevent CSV / spreadsheet formula injection.
 * Escapes quotes and encloses in double quotes if commas/quotes/newlines exist.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Formula injection mitigation: if value starts with formula trigger, prepend single quote
  if (FORMULA_TRIGGERS.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const authResult = await getAuthenticatedUserFromToken(token);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const role = authResult.user.role;
    if (role !== "Admin" && role !== "HR") {
      return NextResponse.json(
        { error: "Forbidden: HR or Admin privileges are required to export employee records." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);

    const idsParam = searchParams.get("ids")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const whereConditions: Prisma.EmployeeWhereInput[] = [];

    // If specific employee IDs are provided (selected rows workflow)
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        whereConditions.push({ id: { in: ids } });
      }
    } else {
      // Otherwise apply active filter parameters
      if (search.length > 0) {
        const words = search.split(/\s+/).filter(Boolean);
        const searchOr: Prisma.EmployeeWhereInput[] = [
          { id: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { workEmail: { contains: search } },
          { phone: { contains: search } },
        ];

        if (words.length > 1) {
          searchOr.push(
            {
              AND: [
                { firstName: { contains: words[0] } },
                { lastName: { contains: words[words.length - 1] } },
              ],
            },
            {
              AND: [
                { firstName: { contains: words[words.length - 1] } },
                { lastName: { contains: words[0] } },
              ],
            }
          );
        }

        whereConditions.push({ OR: searchOr });
      }

      if (department.length > 0 && department.toLowerCase() !== "all") {
        whereConditions.push({
          OR: [
            { departmentId: department },
            { department: { name: { equals: department } } },
            { department: { code: { equals: department } } },
          ],
        });
      }

      if (status.length > 0 && status.toLowerCase() !== "all") {
        whereConditions.push({ status: { equals: status } });
      }
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Fetch all matching employees without pagination
    const employees = await prisma.employee.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        workEmail: true,
        phone: true,
        status: true,
        hireDate: true,
        workLocation: true,
        workMode: true,
        employmentType: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            roleTitle: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Record export event in audit log
    const actor = getActorSnapshot(authResult.user);
    await logEmployeeExport(
      actor,
      {
        selectedIdsOnly: Boolean(idsParam),
        search: search || null,
        department: department || null,
        status: status || null,
      },
      employees.length
    );

    // CSV Headers
    const headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Full Name",
      "Work Email",
      "Phone",
      "Department Code",
      "Department Name",
      "Job Title",
      "Manager ID",
      "Manager Name",
      "Work Location",
      "Work Mode",
      "Employment Type",
      "Hire Date",
      "Status",
    ];

    const rows: string[] = [headers.map(sanitizeCsvCell).join(",")];

    for (const emp of employees) {
      const row = [
        emp.id,
        emp.firstName,
        emp.lastName,
        emp.fullName || `${emp.firstName} ${emp.lastName}`.trim(),
        emp.workEmail || emp.email,
        emp.phone || "",
        emp.department?.code || "",
        emp.department?.name || "",
        emp.role?.name || emp.role?.roleTitle || "",
        emp.manager?.id || "",
        emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}`.trim() : "",
        emp.workLocation || "",
        emp.workMode || "",
        emp.employmentType || "",
        emp.hireDate ? emp.hireDate.toISOString().split("T")[0] : "",
        emp.status || "Active",
      ];

      rows.push(row.map(sanitizeCsvCell).join(","));
    }

    // Prepend UTF-8 Byte Order Mark (\uFEFF) for Excel / Sheets UTF-8 compatibility
    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `horizon-employees-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...NO_CACHE_HEADERS,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to export employees as CSV." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
