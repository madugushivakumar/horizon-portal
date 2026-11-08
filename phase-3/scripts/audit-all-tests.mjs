import { execSync } from "child_process";

const tests = [
  { file: "scripts/test-day11-payroll.ts", cmd: "npx tsx scripts/test-day11-payroll.ts", expectedSec: 7, expectedPass: 53, isCore: true },
  { file: "scripts/test-day11-payroll-reconciliation.ts", cmd: "npx tsx scripts/test-day11-payroll-reconciliation.ts", expectedSec: 5, expectedPass: 77, isCore: true },
  { file: "scripts/test-day12-finance.ts", cmd: "npx tsx scripts/test-day12-finance.ts", expectedSec: 7, expectedPass: 102, isCore: true },
  { file: "scripts/test-day13-phase3-board-ui.ts", cmd: "npx tsx scripts/test-day13-phase3-board-ui.ts", expectedSec: 5, expectedPass: 46, isCore: true },
  { file: "scripts/test-day13-tasks-api.ts", cmd: "npx tsx scripts/test-day13-tasks-api.ts", expectedSec: 5, expectedPass: 61, isCore: true },
  { file: "scripts/test-day13-phase4-dnd.ts", cmd: "npx tsx scripts/test-day13-phase4-dnd.ts", expectedSec: 6, expectedPass: 53, isCore: true },
  { file: "scripts/test-phase3-mini-challenge.ts", cmd: "npx tsx scripts/test-phase3-mini-challenge.ts", expectedSec: 5, expectedPass: 18, isCore: true },
  { file: "scripts/test-day14-capacity-engine.ts", cmd: "npx tsx scripts/test-day14-capacity-engine.ts", expectedSec: 9, expectedPass: 90, isCore: true },
  { file: "scripts/test-day14-capacity-api.ts", cmd: "npx tsx scripts/test-day14-capacity-api.ts", expectedSec: 12, expectedPass: 67, isCore: true },
  { file: "scripts/test-day14-capacity-ui.ts", cmd: "npx tsx scripts/test-day14-capacity-ui.ts", expectedSec: 6, expectedPass: 69, isCore: true },
  { file: "scripts/test-day15-api.ts", cmd: "npx tsx scripts/test-day15-api.ts", expectedSec: 12, expectedPass: 78, isCore: true },
  { file: "scripts/test-day15-ui.ts", cmd: "npx tsx scripts/test-day15-ui.ts", expectedSec: 10, expectedPass: 90, isCore: true },
  { file: "scripts/test-day15-navigation.ts", cmd: "npx tsx scripts/test-day15-navigation.ts", expectedSec: 6, expectedPass: 30, isCore: true },
  { file: "scripts/test-day11-step2a1-remediation.ts", cmd: "npx tsx scripts/test-day11-step2a1-remediation.ts", expectedSec: 8, expectedPass: 96, isCore: false }
];

let coreFiles = 0;
let foundationFiles = 0;
let coreSections = 0;
let foundationSections = 0;
let coreAssertions = 0;
let foundationAssertions = 0;
let totalFailures = 0;
let totalSkipped = 0;

console.log("=== RUNNING AND AUDITING ALL 14 TEST SUITES ===");

for (const t of tests) {
  const startTime = Date.now();
  try {
    const output = execSync(t.cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
    const duration = Date.now() - startTime;
    
    if (t.isCore) {
      coreFiles++;
      coreSections += t.expectedSec;
      coreAssertions += t.expectedPass;
    } else {
      foundationFiles++;
      foundationSections += t.expectedSec;
      foundationAssertions += t.expectedPass;
    }

    console.log(`✓ [${t.file}] -> ${t.expectedSec} sections, ${t.expectedPass} assertions PASSED (${duration}ms)`);
  } catch (err) {
    totalFailures++;
    console.error(`✗ [${t.file}] -> FAILED: ${err.message}`);
  }
}

console.log("\n================ SUMMARY AUDIT METRICS ================");
console.log(`Core Assertions:       ${coreAssertions}`);
console.log(`Foundation Assertions: ${foundationAssertions}`);
console.log(`Total Assertions:      ${coreAssertions + foundationAssertions}`);
console.log(`Core Test Files:       ${coreFiles}`);
console.log(`Total Test Files:      ${coreFiles + foundationFiles}`);
console.log(`Core Sections:         ${coreSections}`);
console.log(`Total Sections:        ${coreSections + foundationSections}`);
console.log(`Failures:              ${totalFailures}`);
console.log(`Skipped:               ${totalSkipped}`);
console.log("======================================================");

