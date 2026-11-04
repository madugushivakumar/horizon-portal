/**
 * Horizon Portal — Admin Invoices Bulk CSV Export Endpoint
 * GET /api/v1/admin/finance/export/invoices
 *
 * RBAC: Strictly restricted to Admin role.
 * Method: GET only.
 *
 * Exports all invoice records matching active filters across the entire dataset:
 * - Respects search, status, ageing, open condition, and date range filters
 * - Closed invoices strictly produce empty ageing cells
 * - Open invoices retain calculated days overdue and ageing classifications
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
  calculateDaysOverdue,
  classifyAgeingBucket,
  getAgeingBucketLabel,
  isOperationallyOpenInvoice,
  serializeToCsv,
  validateAgeingParam,
  validateDateParam,
  validateDateRange,
  validateInvoiceStatusParam,
  validateOpenParam,
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
    const statusVal = validateInvoiceStatusParam(searchParams.get("status"));
    if (!statusVal.valid) {
      return NextResponse.json(
        { error: statusVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const status = statusVal.data;

    // 3. Validate ageing filter
    const ageingVal = validateAgeingParam(searchParams.get("ageing"));
    if (!ageingVal.valid) {
      return NextResponse.json(
        { error: ageingVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const ageingFilter = ageingVal.data;

    // 4. Validate open filter
    const openVal = validateOpenParam(searchParams.get("open"));
    if (!openVal.valid) {
      return NextResponse.json(
        { error: openVal.error },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const openFilter = openVal.data;

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

    // 6. Optional reporting date
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

    // Retrieve ALL matching records (no pagination truncation)
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

    // CSV Headers as specified in requirements
    const headers = [
      "Invoice ID",
      "Invoice Number",
      "Client Name",
      "Invoice Date",
      "Due Date",
      "Currency",
      "Total Amount",
      "Amount Paid",
      "Balance Due",
      "Stored Invoice Status",
      "Is Open",
      "Days Overdue",
      "Ageing Bucket",
      "Ageing Label",
    ];

    const rows = enriched.map((inv) => [
      inv.id,
      inv.invoiceNumber,
      inv.clientName,
      inv.invoiceDate,
      inv.dueDate,
      inv.currency,
      inv.totalAmount,
      inv.amountPaid,
      inv.balanceDue,
      inv.status,
      inv.isOpen ? "true" : "false",
      inv.daysOverdue !== null ? inv.daysOverdue : "",
      inv.ageingBucket !== null ? inv.ageingBucket : "",
      inv.ageingLabel !== null ? inv.ageingLabel : "",
    ]);

    const csvContent = serializeToCsv(headers, rows);
    const filename = `finance-invoices-${reportingDate}.csv`;

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

    console.error("Invoices CSV export error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to export invoices." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
