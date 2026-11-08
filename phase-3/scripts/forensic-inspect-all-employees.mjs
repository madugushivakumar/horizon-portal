import fs from "fs";

const emps = JSON.parse(fs.readFileSync("03_Data_Pack/employees.json", "utf8"));
const slips = JSON.parse(fs.readFileSync("03_Data_Pack/payslips.json", "utf8"));
const runs = JSON.parse(fs.readFileSync("03_Data_Pack/payroll_runs.json", "utf8"));

console.log("=== FULL FORENSIC INSPECTION OF 03_Data_Pack ===");

// 1. September 2026 Joiners
const sepJoiners = emps.filter(e => e.hire_date.startsWith("2026-09")).sort((a,b) => a.hire_date.localeCompare(b.hire_date));
console.log(`\n1. September 2026 Joiners (${sepJoiners.length} employees):`);
for (let i = 0; i < sepJoiners.length; i++) {
  const e = sepJoiners[i];
  const s08 = slips.find(s => s.employee_id === e.employee_id && s.run_id === "PR-2026-08");
  const s09 = slips.find(s => s.employee_id === e.employee_id && s.run_id === "PR-2026-09");
  console.log(`${i+1}. ${e.employee_id} | ${e.full_name} | Hired: ${e.hire_date} | Aug Payslip: ${s08 ? "YES" : "NO"} | Sep Payslip: ${s09 ? "YES" : "NO"}`);
}

// 2. August 2026 Joiners
const augJoiners = emps.filter(e => e.hire_date.startsWith("2026-08")).sort((a,b) => a.hire_date.localeCompare(b.hire_date));
console.log(`\n2. August 2026 Joiners (${augJoiners.length} employees):`);
for (let i = 0; i < augJoiners.length; i++) {
  const e = augJoiners[i];
  const s08 = slips.find(s => s.employee_id === e.employee_id && s.run_id === "PR-2026-08");
  const s09 = slips.find(s => s.employee_id === e.employee_id && s.run_id === "PR-2026-09");
  console.log(`${i+1}. ${e.employee_id} | ${e.full_name} | Hired: ${e.hire_date} | Aug Payslip: ${s08 ? `YES (Gross ${s08.gross_pay})` : "NO"} | Sep Payslip: ${s09 ? "YES" : "NO"}`);
}

// 3. October 2026 or later Joiners
const octJoiners = emps.filter(e => e.hire_date >= "2026-10-01");
console.log(`\n3. October 2026 or later Joiners in 03_Data_Pack: ${octJoiners.length}`);

// 4. August 2026 (PR-2026-08) Headcount analysis
const r08 = runs.find(r => r.run_id === "PR-2026-08");
const slips08 = slips.filter(s => s.run_id === "PR-2026-08");
console.log(`\n4. August 2026 (PR-2026-08):`);
console.log(`Stored Header Employees Paid: ${r08.employees_paid}`);
console.log(`Actual Itemized Payslips: ${slips08.length}`);
console.log(`Headcount Difference: ${slips08.length - r08.employees_paid} (${slips08.length} - ${r08.employees_paid})`);

// 5. September 2026 (PR-2026-09) Headcount analysis
const r09 = runs.find(r => r.run_id === "PR-2026-09");
const slips09 = slips.filter(s => s.run_id === "PR-2026-09");
console.log(`\n5. September 2026 (PR-2026-09):`);
console.log(`Stored Header Employees Paid: ${r09.employees_paid}`);
console.log(`Actual Itemized Payslips: ${slips09.length}`);
console.log(`Total Active Employees in Dataset: ${emps.length}`);
console.log(`Headcount Difference: ${slips09.length - r09.employees_paid} (${slips09.length} - ${r09.employees_paid})`);

