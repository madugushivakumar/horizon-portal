/**
 * Horizon Portal — Admin Expenses Listing API Endpoint
 * GET /api/v1/admin/finance/expenses
 *
 * RBAC: Strictly restricted to Admin role.
 * Method: GET only.
 *
 * Supports comprehensive database-side filtering, searching, and pagination:
 * - Search by vendor name, bill reference, or description
 * - Filter by status (PAID, UNPAID)
 * - Filter by category account code
 * - Filter by expenseDate range (from, to)
 * - Deterministic pagination (page, pageSize up to 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  authenticateAdminRequest,
  NO_CACHE_HEADERS,
  validateCategoryParam,
  validateDateParam,
  validateDateRange,
  validateExpenseStatusParam,
  validatePaginationParams,
  validateSearchQuery,
} from "@/lib/finance";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdminRequest(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    // 1. Validate pagination parameters
    const paginationVal = validatePaginationParams(
      searchParams.get("page"),
      searchParams.get("pageSize"),
      100
    );
    if (!paginationVal.valid) {
      return NextResponse.json(
        { error: paginationVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const { page, pageSize } = paginationVal.data;

    // 2. Validate search query
    const searchVal = validateSearchQuery(searchParams.get("search"), 100);
    if (!searchVal.valid) {
      return NextResponse.json(
        { error: searchVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const search = searchVal.data;

    // 3. Validate status filter
    const statusVal = validateExpenseStatusParam(searchParams.get("status"));
    if (!statusVal.valid) {
      return NextResponse.json(
        { error: statusVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const status = statusVal.data;

    // 4. Validate category account filter
    const categoryVal = validateCategoryParam(searchParams.get("category"));
    if (!categoryVal.valid) {
      return NextResponse.json(
        { error: categoryVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const category = categoryVal.data;

    // 5. Validate date range filters
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

    // Efficient count query
    const totalRecords = await prisma.expense.count({ where });
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    // Efficient paginated retrieval with Vendor & Department relations
    const rawExpenses = await prisma.expense.findMany({
      where,
      select: {
        id: true,
        expenseDate: true,
        categoryAccount: true,
        billReference: true,
        description: true,
        totalAmount: true,
        dueDate: true,
        paidDate: true,
        status: true,
        paymentMode: true,
        vendor: {
          select: {
            vendorName: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { expenseDate: "desc" },
        { id: "asc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = rawExpenses.map((exp) => ({
      id: exp.id,
      expenseDate: exp.expenseDate.toISOString().split("T")[0],
      categoryAccount: exp.categoryAccount,
      vendorName: exp.vendor?.vendorName || "Unknown Vendor",
      billReference: exp.billReference,
      description: exp.description,
      departmentName: exp.department?.name || "General",
      totalAmount: exp.totalAmount,
      dueDate: exp.dueDate.toISOString().split("T")[0],
      paidDate: exp.paidDate ? exp.paidDate.toISOString().split("T")[0] : null,
      status: exp.status,
      paymentMode: exp.paymentMode,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            totalRecords,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        },
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

    console.error("Expenses listing endpoint error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to retrieve expenses." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
