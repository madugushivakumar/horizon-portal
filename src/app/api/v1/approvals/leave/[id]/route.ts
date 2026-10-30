/**
 * Leave Request Detail API Endpoint
 * GET /api/v1/approvals/leave/[id]
 *
 * Scoped inspection endpoint for a single leave request:
 * - Returns applicant details, dates, leave balance, policy quota, and approval history.
 * - Strictly enforces manager team boundary (HTTP 403/404 if outside scope).
 * - Prevents employee access (HTTP 403).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { verifyApproverAuthorization } from "@/lib/leave/approval-service";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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

    if (authResult.user.role === "Employee") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot access the approvals endpoint." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const leaveReq = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            workEmail: true,
            departmentId: true,
            department: { select: { id: true, name: true, code: true } },
            managerId: true,
            manager: { select: { id: true, firstName: true, lastName: true, email: true } },
            leaveBalance: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
            payType: true,
            annualQuotaDays: true,
            description: true,
          },
        },
      },
    });

    if (!leaveReq) {
      return NextResponse.json(
        { error: `Leave request with ID "${id}" was not found.` },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Role and team scope verification
    const authCheck = await verifyApproverAuthorization(authResult.user, leaveReq.employeeId);
    if (!authCheck.authorized && !authCheck.isSelf) {
      return NextResponse.json(
        { error: authCheck.reason || "Forbidden: You are not authorized to view requests outside your team." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // Query audit history for this leave request
    const auditHistory = await prisma.auditLog.findMany({
      where: {
        action: { in: ["LEAVE_APPROVED", "LEAVE_REJECTED", "LEAVE_DELEGATED", "LEAVE_ESCALATED"] },
        details: { contains: id },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: leaveReq.id,
          employeeId: leaveReq.employeeId,
          employeeName:
            leaveReq.employee.fullName ||
            `${leaveReq.employee.firstName} ${leaveReq.employee.lastName}`.trim(),
          employeeEmail: leaveReq.employee.workEmail || leaveReq.employee.email,
          departmentId: leaveReq.employee.departmentId,
          departmentName: leaveReq.employee.department?.name || leaveReq.employee.departmentId,
          managerId: leaveReq.employee.managerId,
          managerName: leaveReq.employee.manager
            ? `${leaveReq.employee.manager.firstName} ${leaveReq.employee.manager.lastName}`.trim()
            : null,
          leaveTypeCode: leaveReq.leaveTypeCode || leaveReq.leaveType?.code || "LEAVE",
          leaveTypeName: leaveReq.leaveType?.name || leaveReq.leaveTypeCode || "Leave",
          payType: leaveReq.leaveType?.payType || "Paid",
          annualQuotaDays: leaveReq.leaveType?.annualQuotaDays || 0,
          startDate: leaveReq.startDate.toISOString().split("T")[0],
          endDate: leaveReq.endDate.toISOString().split("T")[0],
          days: leaveReq.days,
          status: leaveReq.status,
          reason: leaveReq.reason,
          appliedOn: leaveReq.appliedOn ? leaveReq.appliedOn.toISOString().split("T")[0] : null,
          approverId: leaveReq.approverId,
          decidedOn: leaveReq.decidedOn ? leaveReq.decidedOn.toISOString().split("T")[0] : null,
          rejectionReason: leaveReq.rejectionReason,
          delegatedApproverId: leaveReq.delegatedApproverId,
          isEscalated: leaveReq.isEscalated,
          isSelf: authCheck.isSelf,
          leaveBalance: leaveReq.employee.leaveBalance,
          auditHistory: auditHistory.map((a) => ({
            id: a.id,
            action: a.action,
            actorId: a.actorId,
            actorEmail: a.actorEmail,
            actorRole: a.actorRole,
            createdAt: a.createdAt.toISOString(),
            details: a.details ? JSON.parse(a.details) : null,
          })),
        },
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
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
    console.error("Error retrieving leave request details:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving leave request." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
