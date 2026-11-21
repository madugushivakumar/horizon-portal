/**
 * Horizon Portal — Admin Invoices Listing API Endpoint
 * GET /api/v1/admin/finance/invoices
 *
 * RBAC: Strictly restricted to Admin role.
 * Method: GET only.
 *
 * Supports comprehensive filtering, dynamic ageing classification, and pagination:
 * - Search by invoice number or client name
 * - Filter by stored status (PAID, SENT, PARTIALLY_PAID, OVERDUE, DRAFT, CANCELLED)
 * - Filter by calculated dynamic ageing bucket (NOT_OVERDUE, 0_30, 31_60, 61_90, 90_PLUS)
 * - Filter by operational open status (true / false)
 * - Filter by invoiceDate range (from, to)
 * - Deterministic pagination (page, pageSize up to 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  authenticateAdminRequest,
  NO_CACHE_HEADERS,
  calculateDaysOverdue,
  classifyAgeingBucket,
  getAgeingBucketLabel,
  isOperationallyOpenInvoice,
  validateAgeingParam,
  validateDateParam,
  validateDateRange,
  validateInvoiceStatusParam,
  validateOpenParam,
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
    const statusVal = validateInvoiceStatusParam(searchParams.get("status"));
    if (!statusVal.valid) {
      return NextResponse.json(
        { error: statusVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const status = statusVal.data;

    // 4. Validate ageing filter
    const ageingVal = validateAgeingParam(searchParams.get("ageing"));
    if (!ageingVal.valid) {
      return NextResponse.json(
        { error: ageingVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const ageingFilter = ageingVal.data;

    // 5. Validate open filter
    const openVal = validateOpenParam(searchParams.get("open"));
    if (!openVal.valid) {
      return NextResponse.json(
        { error: openVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const openFilter = openVal.data;

    // 6. Validate date range filters
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

    // 7. Optional reporting date for consistent ageing evaluation
    const repDateVal = validateDateParam(
      "reportingDate",
      searchParams.get("reportingDate") || searchParams.get("cutoff")
    );
    if (!repDateVal.valid) {
      return NextResponse.json(
        { error: repDateVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const reportingDate = repDateVal.data || new Date().toISOString().split("T")[0];

    // Construct Prisma where clause for database-side filtering
    const where: Prisma.InvoiceWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (fromDateStr || toDateStr) {
      where.invoiceDate = {};
      if (fromDateStr) {
        where.invoiceDate.gte = new Date(`${fromDateStr}T00:00:00.000Z`);
      }
      if (toDateStr) {
        where.invoiceDate.lte = new Date(`${toDateStr}T23:59:59.999Z`);
      }
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { client: { clientName: { contains: search } } },
      ];
    }

    // Retrieve matching records with client relation selected
    const rawInvoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        dueDate: true,
        currency: true,
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
        status: true,
        client: {
          select: {
            clientName: true,
          },
        },
      },
      orderBy: [
        { invoiceDate: "desc" },
        { id: "asc" },
      ],
    });

    // Map and enrich with calculated business logic attributes
    // Invariant: Ageing information is calculated ONLY for operationally open invoices.
    // For closed/non-operational records, daysOverdue, ageingBucket, and ageingLabel must be null.
    let enriched = rawInvoices.map((inv) => {
      const isOpen = isOperationallyOpenInvoice(inv);
      const daysOverdue = isOpen
        ? calculateDaysOverdue(inv.dueDate, reportingDate)
        : null;
      const ageingBucket =
        isOpen && daysOverdue !== null ? classifyAgeingBucket(daysOverdue) : null;
      const ageingLabel = ageingBucket ? getAgeingBucketLabel(ageingBucket) : null;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client.clientName,
        invoiceDate: inv.invoiceDate.toISOString().split("T")[0],
        dueDate: inv.dueDate.toISOString().split("T")[0],
        currency: inv.currency,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        balanceDue: inv.balanceDue,
        status: inv.status,
        daysOverdue,
        ageingBucket,
        ageingLabel,
        isOpen,
      };
    });

    // Filter by calculated open condition
    if (openFilter !== null) {
      enriched = enriched.filter((inv) => inv.isOpen === openFilter);
    }

    // Filter by calculated dynamic ageing bucket (applies to open invoices)
    if (ageingFilter !== null) {
      enriched = enriched.filter(
        (inv) => inv.isOpen && inv.ageingBucket === ageingFilter
      );
    }

    // Paginate in-memory after applying business-logic filters
    const totalRecords = enriched.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = enriched.slice(startIndex, startIndex + pageSize);

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

    console.error("Invoices listing endpoint error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to retrieve invoices." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
