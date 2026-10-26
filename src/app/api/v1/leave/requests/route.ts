/**
 * Leave Requests API Endpoint
 * GET /api/v1/leave/requests - Fetch personal leave history
 * POST /api/v1/leave/requests - Submit a new leave request with strict server-side validation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { calculateWorkingDays } from "@/lib/leave/calculations";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }

    const employeeId = authResult.user.employeeId;
    if (!employeeId) {
      return NextResponse.json(
        { error: "No employee profile linked to this user account." },
        { status: 400 }
      );
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const safeRequests = requests.map((r) => ({
      id: r.id,
      leaveTypeCode: r.leaveTypeCode || r.leaveType?.code || "LEAVE",
      leaveTypeName: r.leaveType?.name || r.leaveTypeCode || "Leave",
      startDate: r.startDate.toISOString().split("T")[0],
      endDate: r.endDate.toISOString().split("T")[0],
      days: r.days,
      status: r.status,
      reason: r.reason,
      appliedOn: r.appliedOn ? r.appliedOn.toISOString().split("T")[0] : null,
      approverId: r.approverId,
      decidedOn: r.decidedOn ? r.decidedOn.toISOString().split("T")[0] : null,
    }));

    return NextResponse.json({ data: safeRequests });
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
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving leave requests." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }

    const employeeId = authResult.user.employeeId;
    if (!employeeId) {
      return NextResponse.json(
        { error: "No employee profile linked to this user account." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { leaveTypeCode, startDate, endDate, reason } = body;

    // 1. Validate required fields
    if (!leaveTypeCode || typeof leaveTypeCode !== "string" || !leaveTypeCode.trim()) {
      return NextResponse.json({ error: "Leave type is required." }, { status: 400 });
    }

    if (!startDate || typeof startDate !== "string" || !startDate.trim()) {
      return NextResponse.json({ error: "Start date is required." }, { status: 400 });
    }

    if (!endDate || typeof endDate !== "string" || !endDate.trim()) {
      return NextResponse.json({ error: "End date is required." }, { status: 400 });
    }

    // 2. Validate leave type exists in database
    const code = leaveTypeCode.trim().toUpperCase();
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        OR: [{ code }, { id: code }],
      },
    });

    if (!leaveType) {
      return NextResponse.json(
        { error: `Invalid leave type "${leaveTypeCode}".` },
        { status: 400 }
      );
    }

    // 3. Validate dates and calculate working days
    let workingDaysInfo: { workingDays: number; holidaysEncountered: string[] };
    try {
      workingDaysInfo = await calculateWorkingDays(startDate, endDate);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid date range.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { workingDays } = workingDaysInfo;
    if (workingDays <= 0) {
      return NextResponse.json(
        {
          error:
            "Selected date range contains 0 working days. All days in this range are either weekends or company holidays.",
        },
        { status: 400 }
      );
    }

    const startUtc = new Date(`${startDate.split("T")[0]}T00:00:00.000Z`);
    const endUtc = new Date(`${endDate.split("T")[0]}T23:59:59.999Z`);

    // 4. Overlap Check: Reject if an active Pending or Approved request overlaps
    // Overlap condition: existing.startDate <= newEnd && existing.endDate >= newStart
    const overlappingRequest = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["Pending", "Approved"] },
        startDate: { lte: endUtc },
        endDate: { gte: startUtc },
      },
    });

    if (overlappingRequest) {
      const existingStart = overlappingRequest.startDate.toISOString().split("T")[0];
      const existingEnd = overlappingRequest.endDate.toISOString().split("T")[0];
      return NextResponse.json(
        {
          error: `You already have an active leave request (${overlappingRequest.status}) overlapping this period (${existingStart} to ${existingEnd}).`,
        },
        { status: 409 }
      );
    }

    // 5. Balance Check: Check available balance immediately before accepting
    const balanceRecord = await prisma.leaveBalance.findUnique({
      where: { employeeId },
    });

    // Check pending requests for this leave type to compute current availability
    const existingPending = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveTypeCode: code,
        status: "Pending",
      },
      select: { days: true },
    });

    const pendingDaysForType = existingPending.reduce((sum, r) => sum + r.days, 0);

    let availableBalance = 0;
    if (code === "CL") {
      const bal = balanceRecord?.clBalance ?? 12;
      availableBalance = Math.max(0, bal - pendingDaysForType);
    } else if (code === "SL") {
      const bal = balanceRecord?.slBalance ?? 12;
      availableBalance = Math.max(0, bal - pendingDaysForType);
    } else if (code === "EL") {
      const bal = balanceRecord?.elBalance ?? 15;
      availableBalance = Math.max(0, bal - pendingDaysForType);
    } else if (code === "ML") {
      const quota = leaveType.annualQuotaDays || 182;
      availableBalance = Math.max(0, quota - pendingDaysForType);
    } else if (code === "BL") {
      const quota = leaveType.annualQuotaDays || 3;
      availableBalance = Math.max(0, quota - pendingDaysForType);
    } else {
      // LOP (Loss of Pay) allows unpaid leave
      availableBalance = 999;
    }

    if (code !== "LOP" && workingDays > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance for ${leaveType.name}. You requested ${workingDays} working days, but only have ${availableBalance} days available.`,
        },
        { status: 400 }
      );
    }

    // 6. Atomic write via transaction
    const generatedId = `LR-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;

    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.leaveRequest.create({
        data: {
          id: generatedId,
          employeeId,
          leaveTypeCode: code,
          leaveTypeId: leaveType.id,
          startDate: startUtc,
          endDate: endUtc,
          days: workingDays,
          status: "Pending",
          reason: typeof reason === "string" ? reason.trim() : null,
          appliedOn: new Date(),
        },
      });

      // Update pendingDays on LeaveBalance
      if (balanceRecord) {
        await tx.leaveBalance.update({
          where: { employeeId },
          data: {
            pendingDays: {
              increment: workingDays,
            },
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave request submitted successfully.",
        data: {
          id: newRequest.id,
          leaveTypeCode: newRequest.leaveTypeCode,
          startDate: newRequest.startDate.toISOString().split("T")[0],
          endDate: newRequest.endDate.toISOString().split("T")[0],
          days: newRequest.days,
          status: newRequest.status,
          reason: newRequest.reason,
        },
      },
      { status: 201 }
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
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Internal server error submitting leave request." },
      { status: 500 }
    );
  }
}
