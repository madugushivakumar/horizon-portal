import { execSync } from "child_process";

const testSuites = [
  { name: "Day 11: Payroll Console & RBAC", file: "scripts/test-day11-payroll.ts" },
  { name: "Day 11: Financial Reconciliation", file: "scripts/test-day11-payroll-reconciliation.ts" },
  { name: "Day 12: Finance Snapshot & Ageing", file: "scripts/test-day12-finance.ts" },
  { name: "Day 13: Task Board UI", file: "scripts/test-day13-phase3-board-ui.ts" },
  { name: "Day 13: Tasks API", file: "scripts/test-day13-tasks-api.ts" },
  { name: "Day 13: Drag-and-Drop & Rollback", file: "scripts/test-day13-phase4-dnd.ts" },
  { name: "Phase 3: Mini Challenge", file: "scripts/test-phase3-mini-challenge.ts" },
  { name: "Day 14: Capacity Engine", file: "scripts/test-day14-capacity-engine.ts" },
  { name: "Day 14: Capacity API", file: "scripts/test-day14-capacity-api.ts" },
  { name: "Day 14: Capacity UI", file: "scripts/test-day14-capacity-ui.ts" },
  { name: "Day 15: HR Insights API", file: "scripts/test-day15-api.ts" },
  { name: "Day 15: HR Insights UI", file: "scripts/test-day15-ui.ts" },
  { name: "Day 15: HR Insights Navigation", file: "scripts/test-day15-navigation.ts" },
  { name: "Day 11: Step 2A.1 Foundation Remediation", file: "scripts/test-day11-step2a1-remediation.ts" }
];

console.log("===============================================================================");
console.log("            EXECUTING ALL 14 PHASE 3 AUTOMATED TEST SUITES                    ");
console.log("===============================================================================\n");

let grandTotalPass = 0;
let grandTotalFail = 0;
const results = [];

for (const suite of testSuites) {
  const t0 = Date.now();
  try {
    const stdout = execSync(`npx tsx "${suite.file}"`, { stdio: ["ignore", "pipe", "pipe"] }).toString();
    const duration = Date.now() - t0;
    
    // Count assertions
    let passCount = 0;
    // Look for standard summary line first
    const summaryMatch = stdout.match(/(\d+)\s*(?:passed|PASSED)/i);
    if (summaryMatch) {
      passCount = parseInt(summaryMatch[1], 10);
    } else {
      const passMatches = stdout.match(/(?:✓|\[PASS\]|PASS)/g);
      passCount = passMatches ? passMatches.length : 0;
    }
    
    grandTotalPass += passCount;
    results.push({ ...suite, pass: passCount, fail: 0, duration, status: "PASS" });
    console.log(`✓ [PASS] ${suite.name} (${suite.file}) -> ${passCount} assertions (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - t0;
    grandTotalFail++;
    results.push({ ...suite, pass: 0, fail: 1, duration, status: "FAIL", error: err.message });
    console.error(`✗ [FAIL] ${suite.name} (${suite.file}): ${err.message}`);
  }
}

console.log("\n===============================================================================");
console.log(`GRAND TOTAL ASSERTIONS PASSED: ${grandTotalPass}`);
console.log(`GRAND TOTAL ASSERTIONS FAILED: ${grandTotalFail}`);
console.log(`TOTAL SUITES EXECUTED:         ${results.length}`);
console.log("===============================================================================");

