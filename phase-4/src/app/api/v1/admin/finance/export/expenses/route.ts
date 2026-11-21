/**
 * Horizon Portal — Admin Expenses Bulk CSV Export Endpoint
 * GET /api/v1/admin/finance/export/expenses
 *
 * RBAC: Strictly restricted to Admin role.
 * Method: GET only.
 *
 * Exports all expense records matching active filters across the entire dataset:
 * - Respects search (vendor, bill reference, description), status, category, and date range filters
 * - Unpaginated complete dataset export
 * - UTF-8 Byte Order Mark (\uFEFF) and CRLF (\r\n) line endings
 * - Formula injection protection against '=', '+', '-', '@', '\t', '\r'
 * - Legitimate numeric values preserve decimal precision without corrupted quotes
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  authenticateAdminRequest,
  NO_CACHE_HEADERS,
  serializeToCsv,
  validateCategoryParam,
  validateDateParam,
  validateDateRange,
  validateExpenseStatusParam,
  validateSearchQuery,
} from "@/lib/finance";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdminRequest(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    // 1. Validate search query
    const searchVal = validateSearchQuery(searchParams.get("search"), 100);
    if (!searchVal.valid) {
      return NextResponse.json(
        { error: searchVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const search = searchVal.data;

    // 2. Validate status filter
    const statusVal = validateExpenseStatusParam(searchParams.get("status"));
    if (!statusVal.valid) {
      return NextResponse.json(
        { error: statusVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const status = statusVal.data;

    // 3. Validate category account filter
    const categoryVal = validateCategoryParam(searchParams.get("category"));
    if (!categoryVal.valid) {
      return NextResponse.json(
        { error: categoryVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const category = categoryVal.data;

    // 4. Validate date range filters
    const fromVal = validateDateParam("from", searchParams.get("from"));
    if (!fromVal.valid) {
      return NextResponse.json(
        { error: fromVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const toVal = validateDateParam("to", searchParams.get("to"));
    if (!toVal.valid) {
      return NextResponse.json(
        { error: toVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const rangeVal = validateDateRange(fromVal.data, toVal.data);
    if (!rangeVal.valid) {
      return NextResponse.json(
        { error: rangeVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const fromDateStr = fromVal.data;
    const toDateStr = toVal.data;

    // Construct Prisma where clause for database-side filtering
    const where: Prisma.ExpenseWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (category !== null) {
      where.categoryAccount = category;
    }

    if (fromDateStr || toDateStr) {
      where.expenseDate = {};
      if (fromDateStr) {
        where.expenseDate.gte = new Date(`${fromDateStr}T00:00:00.000Z`);
      }
      if (toDateStr) {
        where.expenseDate.lte = new Date(`${toDateStr}T23:59:59.999Z`);
      }
    }

    if (search) {
      where.OR = [
        { billReference: { contains: search } },
        { description: { contains: search } },
        { vendor: { vendorName: { contains: search } } },
      ];
    }

    // Retrieve ALL matching records (no pagination truncation)
    const rawExpenses = await prisma.expense.findMany({
      where,
      select: {
        id: true,
        expenseDate: true,
        categoryAccount: true,
        billReference: true,
        description: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        vendor: {
          select: {
            vendorName: true,
          },
        },
      },
      orderBy: [
        { expenseDate: "desc" },
        { id: "asc" },
      ],
    });

    // CSV Headers as specified in requirements
    const headers = [
      "Expense ID",
      "Vendor Name",
      "Bill Reference",
      "Description",
      "Category",
      "Expense Date",
      "Currency",
      "Amount",
      "Payment Status",
      "Created Date",
    ];

    const rows = rawExpenses.map((exp) => [
      exp.id,
      exp.vendor?.vendorName || "Unknown Vendor",
      exp.billReference,
      exp.description,
      exp.categoryAccount,
      exp.expenseDate.toISOString().split("T")[0],
      "INR",
      exp.totalAmount,
      exp.status,
      exp.createdAt.toISOString().split("T")[0],
    ]);

    const csvContent = serializeToCsv(headers, rows);
    const today = new Date().toISOString().split("T")[0];
    const filename = `finance-expenses-${today}.csv`;

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

    console.error("Expenses CSV export error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to export expenses." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
