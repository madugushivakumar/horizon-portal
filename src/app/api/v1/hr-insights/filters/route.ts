/**
 * Horizon Portal — AI Insights Filters API Endpoint
 * GET /api/v1/hr-insights/filters
 *
 * Endpoint returning available department filters for the AI Insights dashboard:
 * - Authenticates request and validates JWT session.
 * - Enforces strict server-side RBAC: Admin and HR allowed; Manager and Employee rejected (HTTP 403).
 * - Computes department counts for attrition and anomalies.
 * - Injects mandatory NO_CACHE_HEADERS.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { NO_CACHE_HEADERS, verifyHRInsightsAccess } from "@/lib/hr-insights/auth";
import { DepartmentFilterItem } from "@/lib/hr-insights/types";

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

    // 3. Fetch departments and summary counts
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { id: "asc" },
    });

    const employees = await prisma.employee.findMany({
      select: { id: true, departmentId: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    const attritionRecords = await prisma.aiAttritionRisk.findMany({
      select: { departmentId: true },
    });
    const attritionDeptCount: Record<string, number> = {};
    for (const a of attritionRecords) {
      attritionDeptCount[a.departmentId] = (attritionDeptCount[a.departmentId] || 0) + 1;
    }

    const anomalyRecords = await prisma.aiAnomalyResult.findMany({
      select: { employeeId: true },
    });
    const anomalyDeptCount: Record<string, number> = {};
    let unassignedAnomalyCount = 0;

    for (const an of anomalyRecords) {
      const emp = employeeMap.get(an.employeeId);
      if (emp && emp.departmentId) {
        anomalyDeptCount[emp.departmentId] = (anomalyDeptCount[emp.departmentId] || 0) + 1;
      } else {
        unassignedAnomalyCount++;
      }
    }

    const departmentItems: DepartmentFilterItem[] = departments.map((d) => {
      const rawAtt = attritionDeptCount[d.id] || 0;
      const rawAno = anomalyDeptCount[d.id] || 0;

      const isAttSuppressed = rawAtt > 0 && rawAtt < 5;
      const isAnoSuppressed = rawAno > 0 && rawAno < 5;

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        hasAttritionData: rawAtt > 0,
        attritionCount: isAttSuppressed ? null : rawAtt,
        attritionCountDisplay: isAttSuppressed ? "< 5" : String(rawAtt),
        anomalyCount: isAnoSuppressed ? null : rawAno,
        anomalyCountDisplay: isAnoSuppressed ? "< 5" : String(rawAno),
        isSuppressed: isAttSuppressed || isAnoSuppressed,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          departments: departmentItems,
          unassignedOption: {
            id: "UNASSIGNED",
            name: "Unassigned / Former Employees",
            anomalyCount: unassignedAnomalyCount,
            anomalyCountDisplay: String(unassignedAnomalyCount),
          },
        },
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Unhandled error in GET /api/v1/hr-insights/filters:", error);
    return NextResponse.json(
      { error: "Internal server error while retrieving filter options." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
