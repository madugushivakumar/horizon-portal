/**
 * Horizon Portal — Admin Finance Summary API Endpoint
 * GET /api/v1/admin/finance/summary
 *
 * RBAC: Strictly restricted to Admin role.
 * Method: GET only.
 *
 * Returns complete database-backed financial metrics:
 * - Billed, collected, outstanding, overdue, and not overdue amounts
 * - Total, paid, and unpaid expenses
 * - Open and overdue invoice counts
 * - Dynamic invoice ageing breakdown
 * - Accounting invariants and individual invoice tie-out reconciliation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateAdminRequest,
  NO_CACHE_HEADERS,
  calculateFinanceSummary,
  validateDateParam,
} from "@/lib/finance";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdminRequest(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    // Optional deterministic reporting date for testing / audits (defaults to today UTC)
    const dateParam = searchParams.get("reportingDate") || searchParams.get("cutoff");
    const dateValidation = validateDateParam("reportingDate", dateParam);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const reportingDate = dateValidation.data || undefined;

    // Fetch minimal required invoice fields
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
        status: true,
        dueDate: true,
      },
    });

    // Fetch minimal required expense fields
    const expenses = await prisma.expense.findMany({
      select: {
        id: true,
        totalAmount: true,
        status: true,
      },
    });

    // Run pure calculation engine using consistent reporting date
    const summary = calculateFinanceSummary(invoices, expenses, reportingDate);

    return NextResponse.json(
      {
        success: true,
        data: summary,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
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

    console.error("Finance summary endpoint error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to generate finance summary." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
