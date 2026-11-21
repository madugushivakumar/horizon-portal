/**
 * Horizon Portal — Finance Types & Interfaces
 * src/lib/finance/types.ts
 *
 * Defines canonical data contracts for finance calculation, ageing distribution,
 * reconciliation tie-outs, and API response structures.
 */

export type AgeingBucket =
  | "NOT_OVERDUE"
  | "0_30"
  | "31_60"
  | "61_90"
  | "90_PLUS";

export interface AgeingBucketSummary {
  bucket: AgeingBucket;
  label: string;
  count: number;
  amount: number;
  amountPaise: number;
}

/**
 * Minimal interface matching the Prisma Invoice model for pure testability.
 */
export interface InvoiceLike {
  id?: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  dueDate: Date | string;
  invoiceDate?: Date | string;
  clientId?: string;
  client?: {
    id: string;
    clientName: string;
  } | null;
}

/**
 * Enriched invoice record returned by the invoices API and export services.
 * Ageing fields (daysOverdue, ageingBucket, ageingLabel) are populated ONLY for open invoices,
 * and are strictly null for all closed/non-operational invoices (PAID, CANCELLED, DRAFT, zero balance).
 */
export interface EnrichedInvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  daysOverdue: number | null;
  ageingBucket: AgeingBucket | null;
  ageingLabel: string | null;
  isOpen: boolean;
}

/**
 * Minimal interface matching the Prisma Expense model for pure testability.
 */
export interface ExpenseLike {
  id?: string;
  totalAmount: number;
  status: string;
  expenseDate?: Date | string;
  dueDate?: Date | string;
  paidDate?: Date | string | null;
  billReference?: string;
  description?: string;
  categoryAccount?: number;
  paymentMode?: string | null;
  vendorId?: string;
  vendor?: {
    id: string;
    vendorName: string;
  } | null;
}

/**
 * Result of validating the core accounting invariants.
 */
export interface FinanceInvariantsValidation {
  billedEquationValid: boolean; // Billed = Collected + Outstanding
  overdueEquationValid: boolean; // Overdue + Not Overdue = Outstanding
  ageingCountValid: boolean; // Sum of bucket counts = openInvoiceCount
  ageingAmountValid: boolean; // Sum of bucket amounts = outstandingAmount
  expenseEquationValid: boolean; // Paid Expenses + Unpaid Expenses = Total Expenses
  allValid: boolean;
  discrepancies: string[];
}

/**
 * Discrepancy details for individual invoice tie-out failures.
 */
export interface InvoiceTieOutDiscrepancy {
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  difference: number;
}

/**
 * Result of line-by-line invoice mathematical tie-out.
 */
export interface IndividualInvoiceReconciliationResult {
  totalInvoicesChecked: number;
  reconciledCount: number;
  errorCount: number;
  cancelledCount: number;
  discrepancies: InvoiceTieOutDiscrepancy[];
}

/**
 * Complete, typed financial summary contract.
 */
export interface FinanceSummary {
  billedAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  notOverdueOutstandingAmount: number;
  totalExpenses: number;
  paidExpenses: number;
  unpaidExpenses: number;
  invoiceCount: number;
  openInvoiceCount: number;
  overdueInvoiceCount: number;
  expenseCount: number;
  reportingDate: string;
  ageingBreakdown: Record<AgeingBucket, AgeingBucketSummary>;
  reconciliation: {
    invariants: FinanceInvariantsValidation;
    individualInvoices: IndividualInvoiceReconciliationResult;
  };
}

/**
 * Pagination metadata contract returned by paginated finance APIs.
 */
export interface FinancePaginationMetadata {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Filter parameters state for the client invoice register.
 */
export interface InvoiceFilterState {
  search: string;
  status: string;
  ageing: string;
  open: string;
  from: string;
  to: string;
}

/**
 * Typed API response contract for GET /api/v1/admin/finance/invoices.
 */
export interface InvoiceListResponse {
  success: boolean;
  data: {
    items: EnrichedInvoiceItem[];
    pagination: FinancePaginationMetadata;
  };
  error?: string;
}

/**
 * Enriched expense record returned by the expenses API.
 */
export interface EnrichedExpenseItem {
  id: string;
  expenseDate: string;
  categoryAccount: number;
  vendorName: string;
  billReference: string;
  description: string;
  departmentName: string;
  totalAmount: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentMode: string | null;
}

/**
 * Filter parameters state for the expense register.
 */
export interface ExpenseFilterState {
  search: string;
  status: string;
  category: string;
  from: string;
  to: string;
}

/**
 * Typed API response contract for GET /api/v1/admin/finance/expenses.
 */
export interface ExpenseListResponse {
  success: boolean;
  data: {
    items: EnrichedExpenseItem[];
    pagination: FinancePaginationMetadata;
  };
  error?: string;
}
