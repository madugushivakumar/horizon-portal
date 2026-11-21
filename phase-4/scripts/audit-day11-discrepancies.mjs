import fs from "fs";
import path from "path";

const dataPack = path.join(process.cwd(), "03_Data_Pack");
const rawRuns = JSON.parse(fs.readFileSync(path.join(dataPack, "payroll_runs.json"), "utf8"));
const rawSlips = JSON.parse(fs.readFileSync(path.join(dataPack, "payslips.json"), "utf8"));
const rawEmps = JSON.parse(fs.readFileSync(path.join(dataPack, "employees.json"), "utf8"));

function toPaise(val) {
  if (val === null || val === undefined || isNaN(val)) return 0n;
  return BigInt(Math.round(val * 100));
}

function fromPaise(paise) {
  return Number(paise) / 100;
}

function fmt(n) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

console.log("=== COMPREHENSIVE PAISE AUDIT OF ALL 6 ITEMIZED RUNS ===");

const runIds = [
  "PR-2026-09",
  "PR-2026-08",
  "PR-2026-07",
  "PR-2026-06",
  "PR-2026-05",
  "PR-2026-04",
];

const empMap = new Map(rawEmps.map((e) => [e.employee_id, e]));

const results = [];

for (const runId of runIds) {
  const header = rawRuns.find((r) => r.run_id === runId);
  const slips = rawSlips.filter((s) => s.run_id === runId);

  const storedHeadcount = header.employees_paid;
  const storedGrossPaise = toPaise(header.total_gross);
  const storedNetPaise = toPaise(header.total_net);
  const impliedStoredDedPaise = storedGrossPaise - storedNetPaise;

  const actualPayslipCount = slips.length;
  const empIds = slips.map((s) => s.employee_id);
  const distinctEmpIds = new Set(empIds);
  const distinctEmpCount = distinctEmpIds.size;
  const duplicateEmpCount = actualPayslipCount - distinctEmpCount;

  // Component sums
  let sumBasic = 0n;
  let sumHra = 0n;
  let sumConveyance = 0n;
  let sumMedical = 0n;
  let sumSpecial = 0n;
  let sumOvertime = 0n;
  let sumVariable = 0n;
  let sumGross = 0n;

  let sumPf = 0n;
  let sumEsi = 0n;
  let sumPt = 0n;
  let sumTds = 0n;
  let sumOtherDed = 0n;
  let sumDed = 0n;

  let sumNet = 0n;

  let internalDiscrepancies = 0;

  for (const s of slips) {
    const b = toPaise(s.basic);
    const h = toPaise(s.hra);
    const c = toPaise(s.conveyance);
    const m = toPaise(s.medical);
    const sp = toPaise(s.special_allowance);
    const ot = toPaise(s.overtime_pay);
    const v = toPaise(s.variable_pay);
    const g = toPaise(s.gross_pay);

    const pf = toPaise(s.pf_employee);
    const esi = toPaise(s.esi_employee);
    const pt = toPaise(s.professional_tax);
    const tds = toPaise(s.tds);
    const od = toPaise(s.other_deductions);
    const d = toPaise(s.total_deductions ?? (s.deductions || 0));

    const n = toPaise(s.net_pay);

    sumBasic += b;
    sumHra += h;
    sumConveyance += c;
    sumMedical += m;
    sumSpecial += sp;
    sumOvertime += ot;
    sumVariable += v;
    sumGross += g;

    sumPf += pf;
    sumEsi += esi;
    sumPt += pt;
    sumTds += tds;
    sumOtherDed += od;
    sumDed += d;

    sumNet += n;

    // Check component integrity
    const compGross = b + h + c + m + sp + ot + v;
    const compDed = pf + esi + pt + tds + od;
    if (compGross !== g || compDed !== d || g - d !== n) {
      internalDiscrepancies++;
    }
  }

  const grossVarPaise = storedGrossPaise - sumGross;
  const netVarPaise = storedNetPaise - sumNet;
  const dedVarPaise = impliedStoredDedPaise - sumDed;
  const headcountVar = storedHeadcount - distinctEmpCount;

  // Active employees on period end
  const periodEnd = new Date(header.period_end);
  const periodStart = new Date(header.period_start);
  const activeAtPeriodEnd = rawEmps.filter((e) => new Date(e.hire_date) <= periodEnd);

  results.push({
    runId,
    period: `${header.period_start} to ${header.period_end}`,
    status: header.status,
    storedHeadcount,
    distinctEmpCount,
    actualPayslipCount,
    duplicateEmpCount,
    activeAtPeriodEndCount: activeAtPeriodEnd.length,
    headcountVar,
    storedGross: fromPaise(storedGrossPaise),
    calculatedGross: fromPaise(sumGross),
    grossVar: fromPaise(grossVarPaise),
    storedNet: fromPaise(storedNetPaise),
    calculatedNet: fromPaise(sumNet),
    netVar: fromPaise(netVarPaise),
    impliedStoredDed: fromPaise(impliedStoredDedPaise),
    calculatedDed: fromPaise(sumDed),
    dedVar: fromPaise(dedVarPaise),
    internalDiscrepancies,
    components: {
      basic: fromPaise(sumBasic),
      hra: fromPaise(sumHra),
      conveyance: fromPaise(sumConveyance),
      medical: fromPaise(sumMedical),
      special: fromPaise(sumSpecial),
      overtime: fromPaise(sumOvertime),
      variable: fromPaise(sumVariable),
      gross: fromPaise(sumGross),
    },
    deductions: {
      pf: fromPaise(sumPf),
      esi: fromPaise(sumEsi),
      pt: fromPaise(sumPt),
      tds: fromPaise(sumTds),
      other: fromPaise(sumOtherDed),
      total: fromPaise(sumDed),
    },
    paise: {
      storedGross: storedGrossPaise.toString(),
      calculatedGross: sumGross.toString(),
      grossVar: grossVarPaise.toString(),
      storedNet: storedNetPaise.toString(),
      calculatedNet: sumNet.toString(),
      netVar: netVarPaise.toString(),
      impliedStoredDed: impliedStoredDedPaise.toString(),
      calculatedDed: sumDed.toString(),
      dedVar: dedVarPaise.toString(),
    },
  });
}

console.log(JSON.stringify(results, null, 2));

