import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function toPaise(val: number | null | undefined): bigint {
  if (val === null || val === undefined || isNaN(val)) return BigInt(0);
  return BigInt(Math.round(val * 100));
}

function fromPaise(paise: bigint): number {
  return Number(paise) / 100;
}

function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function main() {
  console.log("=== DAY 11 PAYROLL RECONCILIATION INVESTIGATION ===\n");

  // 1. Initial counts
  const employeeCount = await prisma.employee.count();
  const payrollRunCount = await prisma.payrollRun.count();
  const payslipCount = await prisma.payslip.count();

  console.log("DATABASE BEFORE COUNTS:");
  console.log(`- Employees: ${employeeCount}`);
  console.log(`- Payroll Runs: ${payrollRunCount}`);
  console.log(`- Payslips: ${payslipCount}\n`);

  // 2. Load JSON data pack files
  const dataPackPath = path.join(process.cwd(), "03_Data_Pack");
  const rawPayrollRuns = JSON.parse(fs.readFileSync(path.join(dataPackPath, "payroll_runs.json"), "utf8"));
  const rawPayslips = JSON.parse(fs.readFileSync(path.join(dataPackPath, "payslips.json"), "utf8"));
  const rawEmployees = JSON.parse(fs.readFileSync(path.join(dataPackPath, "employees.json"), "utf8"));

  console.log("DATA PACK COUNTS:");
  console.log(`- raw payroll_runs.json: ${rawPayrollRuns.length}`);
  console.log(`- raw payslips.json: ${rawPayslips.length}`);
  console.log(`- raw employees.json: ${rawEmployees.length}\n`);

  // Check if DB payslips match raw payslips exactly
  console.log("Checking DB payslip IDs vs raw payslips.json IDs...");
  const dbPayslips = await prisma.payslip.findMany({
    select: {
      id: true,
      payrollRunId: true,
      employeeId: true,
      basic: true,
      hra: true,
      specialAllowance: true,
      grossPay: true,
      deductions: true,
      totalDeductions: true,
      netPay: true,
    },
  });

  const rawPayslipMap = new Map<string, any>();
  for (const p of rawPayslips) {
    rawPayslipMap.set(p.payroll_item_id, p);
  }

  let dbRawMismatches = 0;
  for (const dbp of dbPayslips) {
    const raw = rawPayslipMap.get(dbp.id);
    if (!raw) {
      dbRawMismatches++;
    } else {
      if (
        toPaise(dbp.grossPay) !== toPaise(raw.gross_pay) ||
        toPaise(dbp.netPay) !== toPaise(raw.net_pay) ||
        toPaise(dbp.totalDeductions) !== toPaise(raw.total_deductions)
      ) {
        dbRawMismatches++;
      }
    }
  }
  console.log(`DB vs Data Pack payslip mismatches: ${dbRawMismatches} (0 means database is 100% faithful to raw payslips.json)\n`);

  // 3. Audit each of the 6 itemized runs
  const runIds = [
    "PR-2026-09",
    "PR-2026-08",
    "PR-2026-07",
    "PR-2026-06",
    "PR-2026-05",
    "PR-2026-04",
  ];

  const allEmployees = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      hireDate: true,
      salary: true,
      departmentId: true,
    },
  });
  const employeeMap = new Map(allEmployees.map((e) => [e.id, e]));

  const runAudits = [];

  for (const runId of runIds) {
    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        payslips: true,
      },
    });

    if (!run) {
      console.log(`Run ${runId} not found!`);
      continue;
    }

    const slips = run.payslips;
    const distinctEmployeeIds = new Set(slips.map((s) => s.employeeId));
    const payslipCount = slips.length;
    const duplicateEmployeeCount = payslipCount - distinctEmployeeIds.size;

    // Sums in paise
    let sumBasicPaise = BigInt(0);
    let sumHraPaise = BigInt(0);
    let sumSpecialPaise = BigInt(0);
    let sumGrossPaise = BigInt(0);
    let sumDeductionsPaise = BigInt(0);
    let sumNetPaise = BigInt(0);

    let internalDiscrepancies = 0;

    for (const s of slips) {
      const b = toPaise(s.basic);
      const h = toPaise(s.hra);
      const sp = toPaise(s.specialAllowance);
      const g = toPaise(s.grossPay);
      const d = toPaise(s.totalDeductions ?? s.deductions ?? 0);
      const n = toPaise(s.netPay);

      sumBasicPaise += b;
      sumHraPaise += h;
      sumSpecialPaise += sp;
      sumGrossPaise += g;
      sumDeductionsPaise += d;
      sumNetPaise += n;

      // check if basic + hra + special === gross
      // and gross - deductions === net
      if (g - d !== n) {
        internalDiscrepancies++;
      }
    }

    const storedGrossPaise = toPaise(run.totalGross);
    const storedNetPaise = toPaise(run.totalNet);
    const impliedStoredDeductionsPaise = storedGrossPaise - storedNetPaise;
    const storedHeadcount = run.employeesPaid ?? 0;

    const grossVarPaise = storedGrossPaise - sumGrossPaise;
    const netVarPaise = storedNetPaise - sumNetPaise;
    const deductionsVarPaise = impliedStoredDeductionsPaise - sumDeductionsPaise;
    const headcountVar = storedHeadcount - distinctEmployeeIds.size;

    // Check which employees are missing in this run
    const missingEmployees = allEmployees.filter((e) => !distinctEmployeeIds.has(e.id));

    runAudits.push({
      runId,
      periodStart: run.periodStart.toISOString().split("T")[0],
      periodEnd: run.periodEnd.toISOString().split("T")[0],
      storedHeadcount,
      distinctEmployeeCount: distinctEmployeeIds.size,
      payslipCount,
      duplicateEmployeeCount,
      storedGross: fromPaise(storedGrossPaise),
      calculatedGross: fromPaise(sumGrossPaise),
      grossVariance: fromPaise(grossVarPaise),
      storedNet: fromPaise(storedNetPaise),
      calculatedNet: fromPaise(sumNetPaise),
      netVariance: fromPaise(netVarPaise),
      impliedStoredDeductions: fromPaise(impliedStoredDeductionsPaise),
      calculatedDeductions: fromPaise(sumDeductionsPaise),
      deductionsVariance: fromPaise(deductionsVarPaise),
      headcountVariance: headcountVar,
      internalDiscrepancies,
      missingEmployeeCount: missingEmployees.length,
      missingEmployees: missingEmployees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        doj: e.hireDate ? e.hireDate.toISOString().split("T")[0] : null,
        salary: e.salary,
      })),
      sumComponentsVsGross: fromPaise((sumBasicPaise + sumHraPaise + sumSpecialPaise) - sumGrossPaise),
    });
  }

  console.log("=== SIX RUN AUDIT SUMMARY ===");
  for (const a of runAudits) {
    console.log(`\nRun: ${a.runId} (${a.periodStart} to ${a.periodEnd})`);
    console.log(`  Headcount: Stored=${a.storedHeadcount}, Actual Payslips=${a.payslipCount}, Distinct Emps=${a.distinctEmployeeCount}, Variance=${a.headcountVariance}`);
    console.log(`  Gross: Stored=₹${formatINR(a.storedGross)}, Calc=₹${formatINR(a.calculatedGross)}, Variance=₹${formatINR(a.grossVariance)}`);
    console.log(`  Net:   Stored=₹${formatINR(a.storedNet)}, Calc=₹${formatINR(a.calculatedNet)}, Variance=₹${formatINR(a.netVariance)}`);
    console.log(`  Ded:   Implied=₹${formatINR(a.impliedStoredDeductions)}, Calc=₹${formatINR(a.calculatedDeductions)}, Variance=₹${formatINR(a.deductionsVariance)}`);
    console.log(`  Internal Discrepancies (Net != Gross - Ded): ${a.internalDiscrepancies}`);
    console.log(`  Component Sum (Basic+HRA+Special) - Gross: ₹${formatINR(a.sumComponentsVsGross)}`);
    console.log(`  Missing active employees in run: ${a.missingEmployeeCount}`);
    if (a.missingEmployees.length > 0 && a.missingEmployees.length <= 10) {
      console.log(`  Missing Emps:`, a.missingEmployees.map((m) => `${m.id} (${m.name}, DOJ: ${m.doj}, Salary: ₹${m.salary})`).join("; "));
    }
  }

  // 4. Deeper investigation:
  // Why is storedHeadcount 444 in PR-2026-09 when total employees is 441?
  // Let's check employee table total count vs other tables
  console.log("\n=== INVESTIGATING HEADCOUNT 444 vs 441 IN PR-2026-09 ===");
  console.log(`Total employees in Employee table: ${allEmployees.length}`);
  
  // Are there demo users, or employees in other tables?
  const users = await prisma.user.findMany({ select: { id: true, email: true, employeeId: true } });
  console.log(`Total users in User table: ${users.length}`);

  // What about attendance_monthly.json?
  const rawAttendance = JSON.parse(fs.readFileSync(path.join(dataPackPath, "attendance_monthly.json"), "utf8"));
  const attendanceFor09 = rawAttendance.filter((a: any) => a.month === "2026-09" || a.run_id === "PR-2026-09");
  console.log(`Attendance records for 2026-09: ${attendanceFor09.length}`);

  // Let's check the date of joining of all 441 employees
  const joinedAfter09_01 = allEmployees.filter((e) => e.hireDate && e.hireDate > new Date("2026-09-01"));
  console.log(`Employees joined after 2026-09-01: ${joinedAfter09_01.length}`);
  const joinedAfter09_30 = allEmployees.filter((e) => e.hireDate && e.hireDate > new Date("2026-09-30"));
  console.log(`Employees joined after 2026-09-30: ${joinedAfter09_30.length}`);

  // Let's check if the 3 missing in PR-2026-09 are related to the difference between 444 and 441:
  // In PR-2026-09, actual payslips is 441! Wait!
  // In PR-2026-09, distinctEmployeeCount is 441!
  // That means ALL 441 active employees HAVE A PAYSLIP in PR-2026-09!
  // But stored headcount is 444! That means 444 - 441 = 3!
  console.log(`PR-2026-09 payslips distinct employees: ${runAudits[0].distinctEmployeeCount} / 441 total employees!`);

  // Let's check PR-2026-08:
  // Stored headcount: 429. Actual payslips: 424. Missing: 5 employees.
  // Who are the 5 missing employees in PR-2026-08?
  console.log("\n=== PR-2026-08 MISSING EMPLOYEES AUDIT ===");
  const audit08 = runAudits[1];
  console.log(`PR-2026-08 missing employees (${audit08.missingEmployees.length}):`);
  for (const m of audit08.missingEmployees) {
    console.log(`  - ${m.id}: ${m.name}, DOJ: ${m.doj}, Salary: ₹${formatINR(m.salary)}`);
  }

  // Let's check joining dates of employees vs periods of all 6 runs!
  console.log("\n=== EMPLOYEE JOINING DATES VS PAYROLL PERIODS ===");
  for (const a of runAudits) {
    const periodStart = new Date(a.periodStart);
    const periodEnd = new Date(a.periodEnd);
    const joinedBeforeOrInPeriod = allEmployees.filter((e) => e.hireDate && e.hireDate <= periodEnd);
    const joinedInPeriod = allEmployees.filter((e) => e.hireDate && e.hireDate >= periodStart && e.hireDate <= periodEnd);
    const joinedAfterPeriod = allEmployees.filter((e) => e.hireDate && e.hireDate > periodEnd);
    console.log(`Run ${a.runId} (${a.periodStart} to ${a.periodEnd}):`);
    console.log(`  Employees joined on/before periodEnd: ${joinedBeforeOrInPeriod.length}`);
    console.log(`  Employees joined DURING period: ${joinedInPeriod.length}`);
    console.log(`  Employees joined AFTER periodEnd: ${joinedAfterPeriod.length}`);
    console.log(`  Stored Headcount: ${a.storedHeadcount}`);
    console.log(`  Actual Payslips: ${a.payslipCount}`);
  }

  // 5. Check if average salary or specific missing salary equals the variance
  console.log("\n=== VARIANCE ANALYSIS ===");
  for (const a of runAudits) {
    const grossPerMissingEmp = a.headcountVariance > 0 ? a.grossVariance / a.headcountVariance : 0;
    const netPerMissingEmp = a.headcountVariance > 0 ? a.netVariance / a.headcountVariance : 0;
    console.log(`Run ${a.runId}:`);
    console.log(`  Gross variance: ₹${formatINR(a.grossVariance)} / ${a.headcountVariance} missing emps = ₹${formatINR(grossPerMissingEmp)} avg per missing`);
    console.log(`  Net variance: ₹${formatINR(a.netVariance)} / ${a.headcountVariance} missing emps = ₹${formatINR(netPerMissingEmp)} avg per missing`);
  }

  // 6. Check salary sum of employees joined on/before periodEnd vs stored totals
  console.log("\n=== ANNUAL SALARY / 12 ANALYSIS ===");
  for (const a of runAudits) {
    const periodEnd = new Date(a.periodEnd);
    const eligibleEmployees = allEmployees.filter((e) => e.hireDate && e.hireDate <= periodEnd);
    const totalMonthlySalaryPaise = eligibleEmployees.reduce((acc, e) => acc + toPaise(e.salary ? e.salary / 12 : 0), BigInt(0));
    console.log(`Run ${a.runId}:`);
    console.log(`  Eligible employees (${eligibleEmployees.length}) Sum(Annual Salary / 12): ₹${formatINR(fromPaise(totalMonthlySalaryPaise))}`);
    console.log(`  Stored Gross: ₹${formatINR(a.storedGross)}, Actual Calc Gross: ₹${formatINR(a.calculatedGross)}`);
  }

  // 7. Check if there are any other files or comments in the codebase
  console.log("\n=== INVESTIGATING CODEBASE DOCUMENTATION / SCRIPTS ===");
  const scriptsDir = path.join(process.cwd(), "scripts");
  const testFiles = fs.readdirSync(scriptsDir).filter((f) => f.includes("payroll"));
  console.log("Payroll test/script files in scripts/:", testFiles);
}

main().finally(async () => {
  await prisma.$disconnect();
});
