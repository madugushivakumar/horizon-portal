import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const jsonEmployees = JSON.parse(fs.readFileSync("03_Data_Pack/employees.json", "utf8"));
  const empMap = new Map(jsonEmployees.map((e) => [e.employee_id, e]));

  // Aug and Sep payslips
  const augSlips = await prisma.payslip.findMany({
    where: { payrollRunId: "PR-2026-08" },
    select: { employeeId: true, grossPay: true, netPay: true },
  });
  const augEmpMap = new Map(augSlips.map((s) => [s.employeeId, s]));

  const sepSlips = await prisma.payslip.findMany({
    where: { payrollRunId: "PR-2026-09" },
    select: { employeeId: true, grossPay: true, netPay: true },
  });
  const sepEmpMap = new Map(sepSlips.map((s) => [s.employeeId, s]));

  const allDbEmps = await prisma.employee.findMany({
    orderBy: { id: "asc" },
  });

  console.log(`Total DB Employees: ${allDbEmps.length}`);
  console.log(`Total Aug Payslips: ${augSlips.length}`);
  console.log(`Total Sep Payslips: ${sepSlips.length}`);

  // Absent from Aug
  const absentFromAug = allDbEmps.filter((e) => !augEmpMap.has(e.id));
  console.log(`\n=== ALL ${absentFromAug.length} EMPLOYEES ABSENT FROM AUGUST (PR-2026-08) ===`);
  console.log("ID | Name | Hire Date | In Sep? | Sep Gross");
  for (const e of absentFromAug) {
    const hireDateStr = e.hireDate ? e.hireDate.toISOString().split("T")[0] : "NULL";
    const sepSlip = sepEmpMap.get(e.id);
    console.log(
      `${e.id} | ${e.firstName} ${e.lastName} | ${hireDateStr} | ${sepEmpMap.has(e.id)} | ${sepSlip ? sepSlip.grossPay : "N/A"}`
    );
  }

  // Absent from Sep
  const absentFromSep = allDbEmps.filter((e) => !sepEmpMap.has(e.id));
  console.log(`\n=== EMPLOYEES ABSENT FROM SEPTEMBER (PR-2026-09): ${absentFromSep.length} ===`);

  // EMP-0729 through EMP-0745
  console.log("\n=== EMP-0729 through EMP-0745 (Joining, Aug, Sep) ===");
  for (let i = 729; i <= 745; i++) {
    const id = "EMP-" + String(i).padStart(4, "0");
    const e = allDbEmps.find((x) => x.id === id);
    const hireDateStr = e?.hireDate ? e.hireDate.toISOString().split("T")[0] : "NOT IN DB";
    const inAug = augEmpMap.has(id);
    const inSep = sepEmpMap.has(id);
    console.log(`${id} | HireDate: ${hireDateStr} | In Aug: ${inAug} | In Sep: ${inSep}`);
  }

  // EMP-0442, 0443, 0444
  console.log("\n=== EMP-0442, EMP-0443, EMP-0444 ===");
  for (const id of ["EMP-0442", "EMP-0443", "EMP-0444"]) {
    const e = allDbEmps.find((x) => x.id === id);
    const hireDateStr = e?.hireDate ? e.hireDate.toISOString().split("T")[0] : "NOT IN DB";
    const inAug = augEmpMap.has(id);
    const inSep = sepEmpMap.has(id);
    console.log(`${id} | HireDate: ${hireDateStr} | In Aug: ${inAug} | In Sep: ${inSep}`);
  }

  // EMP-0425 through EMP-0429
  console.log("\n=== EMP-0425 through EMP-0429 ===");
  for (let i = 425; i <= 429; i++) {
    const id = "EMP-" + String(i).padStart(4, "0");
    const e = allDbEmps.find((x) => x.id === id);
    const hireDateStr = e?.hireDate ? e.hireDate.toISOString().split("T")[0] : "NOT IN DB";
    const inAug = augEmpMap.has(id);
    const inSep = sepEmpMap.has(id);
    console.log(`${id} | HireDate: ${hireDateStr} | In Aug: ${inAug} | In Sep: ${inSep}`);
  }

  // Distribution by Year
  console.log("\n=== HIRE DATE DISTRIBUTION BY YEAR ===");
  const yearCounts = {};
  for (const e of allDbEmps) {
    const yr = e.hireDate ? e.hireDate.toISOString().substring(0, 4) : "UNKNOWN";
    yearCounts[yr] = (yearCounts[yr] || 0) + 1;
  }
  console.log(yearCounts);

  // Check employees hired in 2026
  console.log("\n=== EMPLOYEES HIRED IN 2026 ===");
  const emps2026 = allDbEmps.filter((e) => e.hireDate && e.hireDate.toISOString().startsWith("2026"));
  console.log(`Total hired in 2026: ${emps2026.length}`);
  for (const e of emps2026) {
    const hireDateStr = e.hireDate.toISOString().split("T")[0];
    console.log(`${e.id} | ${hireDateStr} | In Aug: ${augEmpMap.has(e.id)} | In Sep: ${sepEmpMap.has(e.id)}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
