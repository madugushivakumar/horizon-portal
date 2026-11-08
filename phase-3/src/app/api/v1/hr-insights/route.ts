/**
 * Horizon Portal — AI Insights API Endpoint
 * GET /api/v1/hr-insights
 *
 * Primary backend endpoint for Day 15:
 * - Authenticates request and validates JWT session.
 * - Enforces strict server-side RBAC: Admin and HR allowed; Manager and Employee rejected (HTTP 403).
 * - Validates query parameters via Zod (optional departmentId).
 * - Queries Attrition Risk and Anomaly Results models.
 * - Invokes calculations engine with statistical disclosure control (small-group suppression).
 * - Guarantees ZERO employee PII in attrition results.
 * - Guarantees deterministic sorting of anomalies (moneyAtRisk DESC, score DESC, ID ASC, null last).
 * - Injects mandatory NO_CACHE_HEADERS.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { NO_CACHE_HEADERS, verifyHRInsightsAccess } from "@/lib/hr-insights/auth";
import { hrInsightsQuerySchema } from "@/lib/validations/hr-insights";
import {
  calculateAttritionInsights,
  calculatePayrollAnomalyInsights,
} from "@/lib/hr-insights/calculations";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user from session cookie or Authorization header
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

    // 2. Enforce strict server-side RBAC (Admin & HR only)
    const authCheck = verifyHRInsightsAccess(authResult.user);
    if (!authCheck.isAuthorized) {
      return NextResponse.json(
        { error: authCheck.errorMessage },
        { status: authCheck.statusCode || 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Validate query parameters via Zod
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      departmentId: searchParams.get("departmentId") ?? undefined,
    };

    const parsedQuery = hrInsightsQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: parsedQuery.error.format(),
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const { departmentId } = parsedQuery.data;

    // 4. Fetch department metadata
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { id: "asc" },
    });
    const departmentMap = new Map(departments.map((d) => [d.id, d]));

    let targetDepartmentName: string | null = null;
    if (departmentId) {
      const targetDept = departmentMap.get(departmentId);
      if (!targetDept) {
        return NextResponse.json(
          { error: `Department not found with ID: ${departmentId}` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      targetDepartmentName = targetDept.name;
    }

    // 5. Fetch employee mappings (Safe projection: ID and departmentId only)
    const employees = await prisma.employee.findMany({
      select: { id: true, departmentId: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    // 6. Query Attrition Risk records
    // Requirement 9: Strict exclusion of employee names, emails, and individual risk profiles
    const attritionRecords = await prisma.aiAttritionRisk.findMany({
      where: departmentId ? { departmentId } : {},
      select: {
        id: true,
        employeeId: true,
        departmentId: true,
        riskScore12m: true,
        riskBand: true,
        topReason1: true,
        topReason2: true,
        topReason3: true,
      },
    });

    // 7. Query Anomaly records
    let anomalyRecords;
    if (departmentId) {
      // Find employee IDs associated with this department
      const departmentEmployeeIds = employees
        .filter((e) => e.departmentId === departmentId)
        .map((e) => e.id);

      anomalyRecords = await prisma.aiAnomalyResult.findMany({
        where: { employeeId: { in: departmentEmployeeIds } },
        select: {
          id: true,
          sourceDataset: true,
          recordId: true,
          employeeId: true,
          period: true,
          anomalyScore: true,
          flagged: true,
          reasonCode: true,
          reasonText: true,
          moneyAtRisk: true,
          modelVersion: true,
          scoredAt: true,
        },
      });
    } else {
      // Organization-wide: All 405 records, including 50 historical/unmatched employee records
      anomalyRecords = await prisma.aiAnomalyResult.findMany({
        select: {
          id: true,
          sourceDataset: true,
          recordId: true,
          employeeId: true,
          period: true,
          anomalyScore: true,
          flagged: true,
          reasonCode: true,
          reasonText: true,
          moneyAtRisk: true,
          modelVersion: true,
          scoredAt: true,
        },
      });
    }

    // 8. Invoke Centralized Calculation Engine
    const attritionData = calculateAttritionInsights(
      attritionRecords,
      departments,
      Boolean(departmentId)
    );

    const anomalyData = calculatePayrollAnomalyInsights(
      anomalyRecords,
      employeeMap,
      departmentMap
    );

    // 9. Return JSON payload conforming to contract
    return NextResponse.json(
      {
        success: true,
        data: {
          filter: {
            departmentId: departmentId ?? null,
            departmentName: targetDepartmentName,
            isFiltered: Boolean(departmentId),
          },
          disclaimer: "AI-generated, for human review",
          governanceNotice:
            "These insights are model-generated advisory estimates and anomaly flags. They are not verified facts or employment or payroll decisions. Human review is required.",
          attrition: attritionData,
          payrollAnomalies: anomalyData,
        },
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Unhandled error in GET /api/v1/hr-insights:", error);
    return NextResponse.json(
      { error: "Internal server error while retrieving AI Insights." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
