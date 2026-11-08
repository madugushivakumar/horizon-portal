import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== FORENSIC INVESTIGATION: AUGUST & SEPTEMBER 2026 PAYROLL ===");

  // 1. Inspect PayrollRun headers
  const runs = await prisma.payrollRun.findMany({
    where: { id: { in: ["PR-2026-08", "PR-2026-09"] } },
    orderBy: { periodStart: "asc" }
  });

  for (const r of runs) {
    console.log(`\n--- RUN: ${r.id} ---`);
    console.log(`Period: ${r.periodStart.toISOString()} to ${r.periodEnd.toISOString()}`);
    console.log(`Status: ${r.status} | Approval: ${r.approvalStatus}`);
    console.log(`Stored Headcount: ${r.employeesPaid}`);
    console.log(`Stored Gross: ₹${r.totalGross?.toFixed(2)}`);
    console.log(`Stored Net: ₹${r.totalNet?.toFixed(2)}`);
    console.log(`Pay Date: ${r.payDate ? r.payDate.toISOString() : "null"}`);
    console.log(`Payment Date: ${r.paymentDate ? r.paymentDate.toISOString() : "null"}`);

    // Aggregate payslips
    const payslips = await prisma.payslip.findMany({
      where: { payrollRunId: r.id }
    });

    let sumGross = 0;
    let sumNet = 0;
    let sumDeductions = 0;
    for (const p of payslips) {
      sumGross += p.grossPay;
      sumNet += p.netPay;
      sumDeductions += p.deductions;
    }

    console.log(`Payslips count: ${payslips.length}`);
    console.log(`Payslip Sum Gross: ₹${sumGross.toFixed(2)}`);
    console.log(`Payslip Sum Net: ₹${sumNet.toFixed(2)}`);
    console.log(`Payslip Sum Deductions: ₹${sumDeductions.toFixed(2)}`);
    console.log(`Gross Diff: ₹${(sumGross - (r.totalGross || 0)).toFixed(2)}`);
    console.log(`Net Diff: ₹${(sumNet - (r.totalNet || 0)).toFixed(2)}`);
    console.log(`Headcount Diff: ${payslips.length - (r.employeesPaid || 0)}`);
  }

  // 2. Check total employees count and format
  const empCount = await prisma.employee.count();
  console.log(`\nTotal employees in DB: ${empCount}`);

  // Query employees near max ID
  const latestEmps = await prisma.employee.findMany({
    orderBy: { employeeId: "desc" },
    take: 10
  });
  console.log("Latest 10 employees by ID:");
  for (const e of latestEmps) {
    console.log(`  ${e.employeeId} | ${e.firstName} ${e.lastName} | Join: ${e.joinDate.toISOString()} | Status: ${e.status}`);
  }

  // 3. Check employees with October 2026 join dates
  const octEmps = await prisma.employee.findMany({
    where: {
      joinDate: {
        gte: new Date("2026-10-01T00:00:00.000Z"),
        lt: new Date("2026-11-01T00:00:00.000Z")
      }
    }
  });
  console.log(`\nEmployees joining in October 2026: ${octEmps.length}`);
  for (const e of octEmps) {
    console.log(`  ${e.employeeId} | ${e.firstName} ${e.lastName} | Join: ${e.joinDate.toISOString()}`);
    const slips = await prisma.payslip.findMany({ where: { employeeId: e.id } });
    console.log(`    Payslips: ${slips.length} (${slips.map(s => s.payrollRunId).join(", ")})`);
  }

  // 4. Check employees with September 2026 join dates
  const sepEmps = await prisma.employee.findMany({
    where: {
      joinDate: {
        gte: new Date("2026-09-01T00:00:00.000Z"),
        lt: new Date("2026-10-01T00:00:00.000Z")
      }
    }
  });
  console.log(`\nEmployees joining in September 2026: ${sepEmps.length}`);
  for (const e of sepEmps) {
    console.log(`  ${e.employeeId} | ${e.firstName} ${e.lastName} | Join: ${e.joinDate.toISOString()}`);
    const slips = await prisma.payslip.findMany({ where: { employeeId: e.id } });
    console.log(`    Payslips: ${slips.length} (${slips.map(s => s.payrollRunId).join(", ")})`);
    for (const s of slips) {
      if (s.payrollRunId === "PR-2026-08") {
        console.log(`    -> HAS AUGUST PAYSLIP: Gross ${s.grossPay}, Net ${s.netPay}, Deductions ${s.deductions}`);
      }
    }
  }

  // 5. Check if any payslips in PR-2026-08 have 0 gross or 0 net
  const zeroSlips08 = await prisma.payslip.findMany({
    where: { payrollRunId: "PR-2026-08", grossPay: 0 }
  });
  console.log(`\nZero gross payslips in PR-2026-08: ${zeroSlips08.length}`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
