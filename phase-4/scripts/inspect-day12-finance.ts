import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toPaise = (amount: number): number => Math.round(amount * 100);
const fromPaise = (amount: number): number => amount / 100;

async function runInspection() {
  console.log("===============================================================");
  console.log("      HORIZON PORTAL — DAY 12 FINANCE DATABASE INSPECTION      ");
  console.log("===============================================================\n");

  // 1. Entity Counts
  const clientCount = await prisma.client.count();
  const vendorCount = await prisma.vendor.count();
  const invoiceCount = await prisma.invoice.count();
  const expenseCount = await prisma.expense.count();

  console.log("1. ENTITY COUNTS:");
  console.log(`   Clients:  ${clientCount} (Expected: 28)`);
  console.log(`   Vendors:  ${vendorCount} (Expected: 30)`);
  console.log(`   Invoices: ${invoiceCount} (Expected: 743)`);
  console.log(`   Expenses: ${expenseCount} (Expected: 501)\n`);

  // 2. Invoice Status Distribution
  const invoiceStatusGroups = await prisma.invoice.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { status: "asc" },
  });

  console.log("2. INVOICE STATUS DISTRIBUTION:");
  let totalInvoicesFromGroups = 0;
  for (const group of invoiceStatusGroups) {
    console.log(`   ${group.status.padEnd(16)}: ${group._count.id}`);
    totalInvoicesFromGroups += group._count.id;
  }
  console.log(`   Total Invoices  : ${totalInvoicesFromGroups}\n`);

  // 3. Expense Status Distribution
  const allExpenses = await prisma.expense.findMany();
  let paidExpensePaise = 0;
  let unpaidExpensePaise = 0;
  let paidExpenseCount = 0;
  let unpaidExpenseCount = 0;

  for (const exp of allExpenses) {
    const paise = toPaise(exp.totalAmount);
    if (exp.status.toUpperCase() === "PAID") {
      paidExpensePaise += paise;
      paidExpenseCount++;
    } else {
      unpaidExpensePaise += paise;
      unpaidExpenseCount++;
    }
  }

  const totalExpensePaise = paidExpensePaise + unpaidExpensePaise;
  console.log("3. EXPENSE STATUS DISTRIBUTION:");
  console.log(`   PAID   count: ${paidExpenseCount}, total: ₹${fromPaise(paidExpensePaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Expected: 478, ₹185,830,816.70)`);
  console.log(`   UNPAID count: ${unpaidExpenseCount}, total: ₹${fromPaise(unpaidExpensePaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Expected: 23, ₹11,646,021.20)`);
  console.log(`   Total  count: ${allExpenses.length}, total: ₹${fromPaise(totalExpensePaise).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Expected: 501, ₹197,476,837.90)\n`);

  // 4. Financial Calculations using Cutoff 2026-11-03
  const cutoffDateStr = "2026-11-03";
  // Cutoff timestamp for comparison (date-only comparison at midnight UTC)
  const cutoffDate = new Date(`${cutoffDateStr}T00:00:00.000Z`);

  const allInvoices = await prisma.invoice.findMany({
    include: { client: true },
  });

  // Calculation rules:
  // Eligible issued invoices: PAID, SENT, PARTIALLY_PAID, OVERDUE
  // Excluded: DRAFT, CANCELLED
  const eligibleStatuses = new Set(["PAID", "SENT", "PARTIALLY_PAID", "OVERDUE"]);

  let billedPaise = 0;
  let collectedPaise = 0;
  let operationalOutstandingPaise = 0;
  let rawAllBalanceDuePaise = 0;
  let draftBalanceDuePaise = 0;
  let openInvoiceCount = 0;
  let overduePaise = 0;
  let notOverdueOutstandingPaise = 0;
  let overdueInvoiceCount = 0;

  // Ageing buckets:
  // Not overdue, 0–30 days, 31–60 days, 61–90 days, 90+ days
  const ageingBuckets = {
    notOverdue: { count: 0, amountPaise: 0 },
    bucket0_30: { count: 0, amountPaise: 0 },
    bucket31_60: { count: 0, amountPaise: 0 },
    bucket61_90: { count: 0, amountPaise: 0 },
    bucket90Plus: { count: 0, amountPaise: 0 },
  };

  // Reconcile each invoice: totalAmount - amountPaid - balanceDue = 0
  let invoiceReconciliationErrors = 0;

  // Track reference invoices
  const refInvoiceIds = ["INV/2026-27/0140", "INV/2026-27/0127", "INV/2024-25/0007"];
  const refInvoiceDetails: any[] = [];

  for (const inv of allInvoices) {
    const totalPaise = toPaise(inv.totalAmount);
    const paidPaise = toPaise(inv.amountPaid);
    const balPaise = toPaise(inv.balanceDue);

    rawAllBalanceDuePaise += balPaise;

    // Check individual invoice reconciliation for issued/active invoices (exclude CANCELLED where balance is zeroed out)
    if (inv.status !== "CANCELLED") {
      const tieOutDiff = totalPaise - paidPaise - balPaise;
      if (Math.abs(tieOutDiff) > 1) { // 1 paise tolerance
        invoiceReconciliationErrors++;
        console.log(`   [Invoice Reconciliation Discrepancy] ${inv.invoiceNumber} (${inv.status}): total=${inv.totalAmount}, paid=${inv.amountPaid}, bal=${inv.balanceDue}, diff=${tieOutDiff / 100}`);
      }
    }

    if (inv.status === "DRAFT") {
      draftBalanceDuePaise += balPaise;
    }

    if (eligibleStatuses.has(inv.status)) {
      billedPaise += totalPaise;
      collectedPaise += paidPaise;

      // Operational open condition:
      // status in (SENT, PARTIALLY_PAID, OVERDUE) AND balanceDue > 0
      const isOperationallyOpen =
        (inv.status === "SENT" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE") &&
        inv.balanceDue > 0;

      if (isOperationallyOpen) {
        operationalOutstandingPaise += balPaise;
        openInvoiceCount++;

        // Calculate days overdue against cutoff
        // Date-only comparison:
        const dueDate = new Date(inv.dueDate);
        const dueUtc = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
        const cutoffUtc = Date.UTC(cutoffDate.getUTCFullYear(), cutoffDate.getUTCMonth(), cutoffDate.getUTCDate());
        const diffMs = cutoffUtc - dueUtc;
        const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let bucket = "";
        if (daysOverdue <= 0) {
          bucket = "Not overdue";
          ageingBuckets.notOverdue.count++;
          ageingBuckets.notOverdue.amountPaise += balPaise;
          notOverdueOutstandingPaise += balPaise;
        } else if (daysOverdue <= 30) {
          bucket = "0–30 days";
          ageingBuckets.bucket0_30.count++;
          ageingBuckets.bucket0_30.amountPaise += balPaise;
          overduePaise += balPaise;
          overdueInvoiceCount++;
        } else if (daysOverdue <= 60) {
          bucket = "31–60 days";
          ageingBuckets.bucket31_60.count++;
          ageingBuckets.bucket31_60.amountPaise += balPaise;
          overduePaise += balPaise;
          overdueInvoiceCount++;
        } else if (daysOverdue <= 90) {
          bucket = "61–90 days";
          ageingBuckets.bucket61_90.count++;
          ageingBuckets.bucket61_90.amountPaise += balPaise;
          overduePaise += balPaise;
          overdueInvoiceCount++;
        } else {
          bucket = "90+ days";
          ageingBuckets.bucket90Plus.count++;
          ageingBuckets.bucket90Plus.amountPaise += balPaise;
          overduePaise += balPaise;
          overdueInvoiceCount++;
        }

        if (refInvoiceIds.includes(inv.invoiceNumber)) {
          refInvoiceDetails.push({
            invoiceNumber: inv.invoiceNumber,
            dueDate: inv.dueDate.toISOString().split("T")[0],
            daysOverdue,
            bucket,
            status: inv.status,
            balanceDue: inv.balanceDue,
          });
        }
      }
    }
  }

  console.log("4. FINANCIAL TOTALS (CUTOFF 2026-11-03):");
  console.log(`   Billed Amount     : ₹${fromPaise(billedPaise).toLocaleString("en-IN")} (Expected: ₹1,558,743,836)`);
  console.log(`   Collected Amount  : ₹${fromPaise(collectedPaise).toLocaleString("en-IN")} (Expected: ₹1,419,349,558)`);
  console.log(`   Outstanding Amount: ₹${fromPaise(operationalOutstandingPaise).toLocaleString("en-IN")} (Expected: ₹139,394,278)`);
  console.log(`   Overdue Amount    : ₹${fromPaise(overduePaise).toLocaleString("en-IN")} (Expected: ₹114,981,820)`);
  console.log(`   Not Overdue Bal   : ₹${fromPaise(notOverdueOutstandingPaise).toLocaleString("en-IN")} (Expected: ₹24,412,458)`);
  console.log(`   Raw DB BalanceDue : ₹${fromPaise(rawAllBalanceDuePaise).toLocaleString("en-IN")} (Expected: ₹140,423,002)`);
  console.log(`   Draft BalanceDue  : ₹${fromPaise(draftBalanceDuePaise).toLocaleString("en-IN")} (Expected: ₹1,028,724)`);
  console.log(`   Open Invoices     : ${openInvoiceCount} (Expected: 62)`);
  console.log(`   Overdue Invoices  : ${overdueInvoiceCount} (Expected: 53)`);
  console.log(`   Individual Invoice Reconcil Errors: ${invoiceReconciliationErrors}\n`);

  console.log("5. EQUATION RECONCILIATIONS:");
  const equation1Matches = (collectedPaise + operationalOutstandingPaise) === billedPaise;
  console.log(`   Billed = Collected + Outstanding: ${equation1Matches ? "TRUE (MATCH)" : "MISMATCH"}`);
  console.log(`     ₹${fromPaise(billedPaise)} == ₹${fromPaise(collectedPaise)} + ₹${fromPaise(operationalOutstandingPaise)}`);

  const equation2Matches = (overduePaise + notOverdueOutstandingPaise) === operationalOutstandingPaise;
  console.log(`   Overdue + Not Overdue = Outstanding: ${equation2Matches ? "TRUE (MATCH)" : "MISMATCH"}`);
  console.log(`     ₹${fromPaise(overduePaise)} + ₹${fromPaise(notOverdueOutstandingPaise)} == ₹${fromPaise(operationalOutstandingPaise)}\n`);

  console.log("6. AGEING BUCKET BREAKDOWN:");
  console.log(`   Not overdue : count = ${ageingBuckets.notOverdue.count} (Exp: 9),  amount = ₹${fromPaise(ageingBuckets.notOverdue.amountPaise).toLocaleString("en-IN")} (Exp: ₹24,412,458)`);
  console.log(`   0–30 days   : count = ${ageingBuckets.bucket0_30.count} (Exp: 37), amount = ₹${fromPaise(ageingBuckets.bucket0_30.amountPaise).toLocaleString("en-IN")} (Exp: ₹79,270,642)`);
  console.log(`   31–60 days  : count = ${ageingBuckets.bucket31_60.count} (Exp: 13), amount = ₹${fromPaise(ageingBuckets.bucket31_60.amountPaise).toLocaleString("en-IN")} (Exp: ₹30,733,938)`);
  console.log(`   61–90 days  : count = ${ageingBuckets.bucket61_90.count} (Exp: 0),  amount = ₹${fromPaise(ageingBuckets.bucket61_90.amountPaise).toLocaleString("en-IN")} (Exp: ₹0)`);
  console.log(`   90+ days    : count = ${ageingBuckets.bucket90Plus.count} (Exp: 3),  amount = ₹${fromPaise(ageingBuckets.bucket90Plus.amountPaise).toLocaleString("en-IN")} (Exp: ₹4,977,240)`);
  const totalAgeingCount = ageingBuckets.notOverdue.count + ageingBuckets.bucket0_30.count + ageingBuckets.bucket31_60.count + ageingBuckets.bucket61_90.count + ageingBuckets.bucket90Plus.count;
  const totalAgeingAmount = ageingBuckets.notOverdue.amountPaise + ageingBuckets.bucket0_30.amountPaise + ageingBuckets.bucket31_60.amountPaise + ageingBuckets.bucket61_90.amountPaise + ageingBuckets.bucket90Plus.amountPaise;
  console.log(`   Total Open  : count = ${totalAgeingCount} (Exp: 62), amount = ₹${fromPaise(totalAgeingAmount).toLocaleString("en-IN")} (Exp: ₹139,394,278)\n`);

  console.log("7. REFERENCE INVOICES CHECK:");
  for (const ref of refInvoiceDetails) {
    console.log(`   Invoice: ${ref.invoiceNumber} | Due: ${ref.dueDate} | Days Overdue: ${ref.daysOverdue} | Bucket: ${ref.bucket} | Status: ${ref.status}`);
  }
}

runInspection()
  .catch((e) => {
    console.error("Inspection error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
