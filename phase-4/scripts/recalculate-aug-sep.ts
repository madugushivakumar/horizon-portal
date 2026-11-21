import { calculatePayrollReconciliation } from "../src/lib/payroll/reconciliation-engine";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Recalculating PR-2026-09 and PR-2026-08 using accepted reconciliation engine...\n");

  const r09 = await calculatePayrollReconciliation("PR-2026-09");
  const r08 = await calculatePayrollReconciliation("PR-2026-08");

  console.log("=== PR-2026-09 (September 2026) ===");
  console.log("Status:", r09?.runStatus, "| Approval:", r09?.approvalStatus, "| PayDate:", r09?.payDate);
  console.log("Reconciliation Status:", r09?.reconciliationStatus);
  console.log("Eligible Pre-Approval:", r09?.eligibleForPreApprovalReconciliation);
  console.log("Eligible Historical:", r09?.eligibleForHistoricalAdjustment);
  console.log("Header Headcount:", r09?.source.header.headcount, "| Itemized Headcount:", r09?.source.itemized.headcount, "| Variance:", r09?.variance.headcount);
  console.log("Header Gross:", r09?.source.header.grossFormatted, `(${r09?.source.header.grossPaise} paise)`);
  console.log("Itemized Gross:", r09?.source.itemized.grossFormatted, `(${r09?.source.itemized.grossPaise} paise)`);
  console.log("Gross Variance:", r09?.variance.grossFormatted, `(${r09?.variance.grossPaise} paise)`);
  console.log("Header Net:", r09?.source.header.netFormatted, `(${r09?.source.header.netPaise} paise)`);
  console.log("Itemized Net:", r09?.source.itemized.netFormatted, `(${r09?.source.itemized.netPaise} paise)`);
  console.log("Net Variance:", r09?.variance.netFormatted, `(${r09?.variance.netPaise} paise)`);
  console.log("Header Deductions:", r09?.source.header.deductionsFormatted, `(${r09?.source.header.deductionsPaise} paise)`);
  console.log("Itemized Deductions:", r09?.source.itemized.deductionsFormatted, `(${r09?.source.itemized.deductionsPaise} paise)`);
  console.log("Deductions Variance:", r09?.variance.deductionsFormatted, `(${r09?.variance.deductionsPaise} paise)`);
  console.log("Invariants Balanced:", r09?.invariants);

  console.log("\n=== PR-2026-08 (August 2026) ===");
  console.log("Status:", r08?.runStatus, "| Approval:", r08?.approvalStatus, "| PayDate:", r08?.payDate);
  console.log("Reconciliation Status:", r08?.reconciliationStatus);
  console.log("Eligible Pre-Approval:", r08?.eligibleForPreApprovalReconciliation);
  console.log("Eligible Historical:", r08?.eligibleForHistoricalAdjustment);
  console.log("Header Headcount:", r08?.source.header.headcount, "| Itemized Headcount:", r08?.source.itemized.headcount, "| Variance:", r08?.variance.headcount);
  console.log("Header Gross:", r08?.source.header.grossFormatted, `(${r08?.source.header.grossPaise} paise)`);
  console.log("Itemized Gross:", r08?.source.itemized.grossFormatted, `(${r08?.source.itemized.grossPaise} paise)`);
  console.log("Gross Variance:", r08?.variance.grossFormatted, `(${r08?.variance.grossPaise} paise)`);
  console.log("Header Net:", r08?.source.header.netFormatted, `(${r08?.source.header.netPaise} paise)`);
  console.log("Itemized Net:", r08?.source.itemized.netFormatted, `(${r08?.source.itemized.netPaise} paise)`);
  console.log("Net Variance:", r08?.variance.netFormatted, `(${r08?.variance.netPaise} paise)`);
  console.log("Header Deductions:", r08?.source.header.deductionsFormatted, `(${r08?.source.header.deductionsPaise} paise)`);
  console.log("Itemized Deductions:", r08?.source.itemized.deductionsFormatted, `(${r08?.source.itemized.deductionsPaise} paise)`);
  console.log("Deductions Variance:", r08?.variance.deductionsFormatted, `(${r08?.variance.deductionsPaise} paise)`);
  console.log("Invariants Balanced:", r08?.invariants);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

