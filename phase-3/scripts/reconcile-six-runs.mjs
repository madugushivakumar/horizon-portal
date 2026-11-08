import fs from "fs";

const runs = JSON.parse(fs.readFileSync("03_Data_Pack/payroll_runs.json", "utf8"));
const slips = JSON.parse(fs.readFileSync("03_Data_Pack/payslips.json", "utf8"));

console.log("=== INDEPENDENT INTEGER-PAISE RECONCILIATION OF ALL 6 ITEMIZED RUNS ===");

const itemizedRunIds = ["PR-2026-04", "PR-2026-05", "PR-2026-06", "PR-2026-07", "PR-2026-08", "PR-2026-09"];

const results = [];

for (const runId of itemizedRunIds) {
  const r = runs.find(x => x.run_id === runId);
  const runSlips = slips.filter(s => s.run_id === runId);

  let sumGrossPaise = 0n;
  let sumNetPaise = 0n;
  let sumDedPaise = 0n;

  for (const s of runSlips) {
    const gPaise = BigInt(Math.round(s.gross_pay * 100));
    const nPaise = BigInt(Math.round(s.net_pay * 100));
    const dPaise = BigInt(Math.round(s.total_deductions * 100));
    sumGrossPaise += gPaise;
    sumNetPaise += nPaise;
    sumDedPaise += dPaise;
  }

  const storedGrossPaise = BigInt(Math.round(r.total_gross * 100));
  const storedNetPaise = BigInt(Math.round(r.total_net * 100));
  // Note: stored header does not have total_deductions column, so storedDed = storedGross - storedNet
  const storedDedPaise = storedGrossPaise - storedNetPaise;

  const diffGrossPaise = sumGrossPaise - storedGrossPaise;
  const diffNetPaise = sumNetPaise - storedNetPaise;
  const diffDedPaise = sumDedPaise - storedDedPaise;
  const diffHc = runSlips.length - r.employees_paid;

  // Check internal item consistency: Gross - Deductions = Net
  const itemEquationHolds = (sumGrossPaise - sumDedPaise) === sumNetPaise;

  results.push({
    runId,
    period: `${r.period_start} to ${r.period_end}`,
    status: r.status,
    headerHc: r.employees_paid,
    itemHc: runSlips.length,
    diffHc,
    storedGross: Number(storedGrossPaise) / 100,
    itemGross: Number(sumGrossPaise) / 100,
    diffGross: Number(diffGrossPaise) / 100,
    diffGrossPaise: diffGrossPaise.toString(),
    storedNet: Number(storedNetPaise) / 100,
    itemNet: Number(sumNetPaise) / 100,
    diffNet: Number(diffNetPaise) / 100,
    diffNetPaise: diffNetPaise.toString(),
    storedDed: Number(storedDedPaise) / 100,
    itemDed: Number(sumDedPaise) / 100,
    diffDed: Number(diffDedPaise) / 100,
    diffDedPaise: diffDedPaise.toString(),
    itemEquationHolds
  });
}

console.log(JSON.stringify(results, null, 2));

