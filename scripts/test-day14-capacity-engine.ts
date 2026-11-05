/**
 * Horizon Portal — Day 14 Phase B Capacity Calculation Engine Test Suite
 * scripts/test-day14-capacity-engine.ts
 *
 * Verifies:
 * 1. Working-day calculations (Monday-Friday, weekend exclusion, holiday exclusion, UTC normalization)
 * 2. Non-double-subtraction of weekend holidays and boundary handling
 * 3. Leave overlap, date boundaries, status filtering, and deduplication
 * 4. The 2-day leave in a 10-day sprint capacity question (proportional capacity reduction, task preservation)
 * 5. Zero-capacity behavior (with and without workload)
 * 6. Task status partitioning (Open: To Do, In Progress, Blocked; Completed: Done; Excluded: Cancelled)
 * 7. Workload classification thresholds (Available, Near Capacity, At Capacity, Overloaded)
 * 8. Sprint summary aggregation and completion percentage calculations
 */

import {
  calculateOverlappingLeaveWorkingDays,
  calculateWorkingDaysInRange,
  formatDateToISOString,
  isWeekday,
  normalizeDateToUTC,
} from "../src/lib/capacity/working-days";
import {
  calculateUtilizationPercentage,
  classifyWorkload,
} from "../src/lib/capacity/workload-classifier";
import {
  calculateEmployeeCapacity,
  calculateSprintCapacitySummary,
  calculateSprintProgress,
} from "../src/lib/capacity/capacity-calculator";
import {
  DAILY_STORY_POINT_CAPACITY,
  LeavePeriodInput,
  TaskWorkloadInput,
} from "../src/lib/capacity/capacity-types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

function runTests() {
  console.log("==================================================================");
  console.log("  HORIZON PORTAL — DAY 14 PHASE B CAPACITY CALCULATION ENGINE     ");
  console.log("==================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. DATE NORMALIZATION & WEEKDAY DETECTION
  // ---------------------------------------------------------------------------
  console.log("--- 1. DATE NORMALIZATION & WEEKDAY UTILITIES ---");

  const utcMon = normalizeDateToUTC("2026-09-07T14:32:00.000Z");
  assert(
    utcMon !== null && utcMon.toISOString() === "2026-09-07T00:00:00.000Z",
    "normalizeDateToUTC resets time to UTC midnight"
  );
  assert(formatDateToISOString(utcMon!) === "2026-09-07", "formatDateToISOString formats UTC Date to YYYY-MM-DD");
  assert(DAILY_STORY_POINT_CAPACITY === 5, "DAILY_STORY_POINT_CAPACITY is centralized at 5");
  assert(isWeekday(utcMon!), "Monday is identified as weekday");

  const utcSat = normalizeDateToUTC("2026-09-12");
  const utcSun = normalizeDateToUTC("2026-09-13");
  assert(utcSat !== null && !isWeekday(utcSat), "Saturday is NOT a weekday");
  assert(utcSun !== null && !isWeekday(utcSun), "Sunday is NOT a weekday");

  const invalidDate = normalizeDateToUTC("not-a-valid-date");
  assert(invalidDate === null, "Invalid date string safely returns null");

  const emptyDate = normalizeDateToUTC(null);
  assert(emptyDate === null, "Null date input safely returns null");

  // ---------------------------------------------------------------------------
  // 2. WORKING-DAY RANGE CALCULATIONS & HOLIDAY EXCLUSIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. WORKING-DAY RANGE CALCULATIONS ---");

  // 2-week standard sprint: Mon 2026-09-07 to Fri 2026-09-18 (12 calendar days)
  const sprintRes = calculateWorkingDaysInRange("2026-09-07", "2026-09-18");
  assert(sprintRes.workingDays === 10, "Standard 2-week sprint has exactly 10 working days");
  assert(sprintRes.totalCalendarDays === 12, "Calendar days count is 12 (Mon to next Fri inclusive)");
  assert(sprintRes.weekendDays === 2, "Includes exactly 2 weekend days (Sat + Sun)");
  assert(sprintRes.holidayDays === 0, "0 holidays when no holiday calendar is passed");

  // Weekend-only range: Sat to Sun
  const weekendRes = calculateWorkingDaysInRange("2026-09-12", "2026-09-13");
  assert(weekendRes.workingDays === 0, "Weekend range (Sat-Sun) has 0 working days");
  assert(weekendRes.weekendDays === 2, "Weekend range has 2 weekend days");

  // Single weekday
  const singleDayRes = calculateWorkingDaysInRange("2026-09-07", "2026-09-07");
  assert(singleDayRes.workingDays === 1, "Single Monday range has 1 working day");

  // Single weekend day
  const singleSatRes = calculateWorkingDaysInRange("2026-09-12", "2026-09-12");
  assert(singleSatRes.workingDays === 0, "Single Saturday range has 0 working days");

  // With a weekday holiday (Wednesday 2026-09-09)
  const holidayRes = calculateWorkingDaysInRange("2026-09-07", "2026-09-18", ["2026-09-09"]);
  assert(holidayRes.workingDays === 9, "Weekday holiday reduces sprint working days to 9");
  assert(holidayRes.holidayDays === 1, "Recorded 1 holiday day");
  assert(holidayRes.holidaysEncountered.includes("2026-09-09"), "Recorded specific holiday date");

  // Non-double-subtraction: Holiday falling on a weekend (Sunday 2026-09-13)
  const weekendHolidayRes = calculateWorkingDaysInRange("2026-09-07", "2026-09-18", ["2026-09-13"]);
  assert(
    weekendHolidayRes.workingDays === 10,
    "Weekend holiday does NOT reduce working days (no double subtraction)"
  );
  assert(weekendHolidayRes.weekendDays === 2, "Weekend days remain 2");
  assert(weekendHolidayRes.holidayDays === 0, "Weekend holiday is not counted under holiday deduction");

  // Inverted range (start > end)
  const invertedRes = calculateWorkingDaysInRange("2026-09-18", "2026-09-07");
  assert(invertedRes.workingDays === 0, "Inverted date range returns 0 working days safely");

  // ---------------------------------------------------------------------------
  // 3. LEAVE STATUS FILTERING & OVERLAP CALCULATIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. LEAVE OVERLAP, FILTERING & DEDUPLICATION ---");

  const sprintStart = "2026-09-07";
  const sprintEnd = "2026-09-18"; // 10 working days

  // Only Approved leaves reduce capacity
  const mixedStatusLeaves: LeavePeriodInput[] = [
    { id: "L-PENDING", startDate: "2026-09-08", endDate: "2026-09-09", status: "Pending" },
    { id: "L-REJECTED", startDate: "2026-09-10", endDate: "2026-09-11", status: "Rejected" },
    { id: "L-CANCELLED", startDate: "2026-09-14", endDate: "2026-09-15", status: "Cancelled" },
  ];
  const unapprovedRes = calculateOverlappingLeaveWorkingDays(sprintStart, sprintEnd, mixedStatusLeaves);
  assert(unapprovedRes.approvedLeaveWorkingDays === 0, "Pending, Rejected, and Cancelled leaves do NOT reduce capacity");
  assert(unapprovedRes.availableWorkingDays === 10, "Available working days remain 10");

  // Single approved leave completely inside sprint (Wed to Thu = 2 working days)
  const insideSprintLeaves: LeavePeriodInput[] = [
    { id: "L-APPROVED", startDate: "2026-09-09", endDate: "2026-09-10", status: "Approved" },
  ];
  const insideRes = calculateOverlappingLeaveWorkingDays(sprintStart, sprintEnd, insideSprintLeaves);
  assert(insideRes.approvedLeaveWorkingDays === 2, "Approved leave inside sprint counts exactly 2 working days");
  assert(insideRes.availableWorkingDays === 8, "Available working days = 10 - 2 = 8");
  assert(insideRes.leaveReductionPoints === 10, "Leave capacity reduction = 2 days * 5 pts = 10 pts");

  // Leave spanning before sprint to mid-sprint
  // Leave from 2026-09-01 (before sprint) to 2026-09-09 (Wed of week 1)
  // Overlap in sprint: Mon Sep 7, Tue Sep 8, Wed Sep 9 = 3 working days
  const spanBeforeLeaves: LeavePeriodInput[] = [
    { id: "L-SPAN-BEFORE", startDate: "2026-09-01", endDate: "2026-09-09", status: "Approved" },
  ];
  const spanBeforeRes = calculateOverlappingLeaveWorkingDays(sprintStart, sprintEnd, spanBeforeLeaves);
  assert(spanBeforeRes.approvedLeaveWorkingDays === 3, "Leave starting before sprint only counts days inside sprint (3 days)");
  assert(spanBeforeRes.availableWorkingDays === 7, "Available working days = 10 - 3 = 7");

  // Leave completely outside sprint (prior week)
  const outsideLeaves: LeavePeriodInput[] = [
    { id: "L-OUTSIDE", startDate: "2026-08-20", endDate: "2026-08-25", status: "Approved" },
  ];
  const outsideRes = calculateOverlappingLeaveWorkingDays(sprintStart, sprintEnd, outsideLeaves);
  assert(outsideRes.approvedLeaveWorkingDays === 0, "Leave completely outside sprint does NOT reduce sprint capacity");
  assert(outsideRes.availableWorkingDays === 10, "Available working days remain 10");

  // Overlapping weekend: Fri to Mon leave (Fri 11, Sat 12, Sun 13, Mon 14)
  // Weekends must NOT count as leave working days
  const weekendLeave: LeavePeriodInput[] = [
    { id: "L-WEEKEND", startDate: "2026-09-11", endDate: "2026-09-14", status: "Approved" },
  ];
  const weekendLeaveRes = calculateOverlappingLeaveWorkingDays(sprintStart, sprintEnd, weekendLeave);
  assert(weekendLeaveRes.approvedLeaveWorkingDays === 2, "Fri to Mon leave counts exactly 2 working days (Sat/Sun excluded)");

  // Overlapping approved leave deduplication: two overlapping leaves for the same employee
  // Leave 1: Mon Sep 7 to Wed Sep 9 (3 days)
  // Leave 2: Tue Sep 8 to Thu Sep 10 (3 days)
  // Union of working days: Mon, Tue, Wed, Thu = 4 unique working days (NOT 6)
  const duplicateLeaves: LeavePeriodInput[] = [
    { id: "L-DUP-1", startDate: "2026-09-07", endDate: "2026-09-09", status: "Approved" },
    { id: "L-DUP-2", startDate: "2026-09-08", endDate: "2026-09-10", status: "Approved" },
  ];
  const dupRes = calculateOverlappingLeaveWorkingDays(sprintStart, sprintEnd, duplicateLeaves);
  assert(dupRes.approvedLeaveWorkingDays === 4, "Concurrent approved leaves are deduplicated to 4 unique working days");
  assert(dupRes.availableWorkingDays === 6, "Available working days = 10 - 4 = 6");

  // Leave on a holiday: holiday is excluded from leave working days
  // Leave Mon Sep 7 to Fri Sep 11 (5 weekdays) with holiday on Wed Sep 9
  // Leave working days must be 4, NOT 5
  const holidayLeaveRes = calculateOverlappingLeaveWorkingDays(
    sprintStart,
    sprintEnd,
    [{ id: "L-HOL", startDate: "2026-09-07", endDate: "2026-09-11", status: "Approved" }],
    ["2026-09-09"]
  );
  assert(holidayLeaveRes.approvedLeaveWorkingDays === 4, "Leave falling on holiday is excluded from leave working days");
  assert(holidayLeaveRes.availableWorkingDays === 5, "Sprint working days (9) - leave days (4) = 5 available days");

  // ---------------------------------------------------------------------------
  // 4. THE 2-DAY LEAVE IN A 10-DAY SPRINT CAPACITY QUESTION
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. THE 2-DAY LEAVE IN A 10-DAY SPRINT QUESTION ---");

  // Problem statement:
  // Sprint has 10 working days. Daily baseline is 5 points.
  // Employee takes 2 days of approved leave.
  // Question: Do you reduce assigned points by 20%?
  // Answer: No! Estimated capacity is reduced by 20% (50 -> 40). Assigned tasks remain intact (e.g. 45 points).
  const tasksForQuestion: TaskWorkloadInput[] = [
    { id: "T-1", storyPoints: 25, status: "In Progress", assigneeEmployeeId: "EMP-A" },
    { id: "T-2", storyPoints: 20, status: "To Do", assigneeEmployeeId: "EMP-A" },
  ];

  const questionResult = calculateEmployeeCapacity({
    employeeId: "EMP-A",
    sprintWorkingDays: 10,
    approvedLeaveWorkingDays: 2,
    tasks: tasksForQuestion,
    dailyStoryPointCapacity: 5,
  });

  assert(questionResult.grossCapacity === 50, "Gross capacity = 10 days * 5 = 50 story points");
  assert(questionResult.leaveCapacityReduction === 10, "Leave capacity reduction = 2 days * 5 = 10 story points (20% reduction)");
  assert(questionResult.netCapacity === 40, "Net capacity = 50 - 10 = 40 story points");
  assert(questionResult.availableWorkingDays === 8, "Available working days = 10 - 2 = 8 days");
  assert(questionResult.plannedOpenPoints === 45, "Assigned open points are preserved at 45 (NOT reduced by 20%)");
  assert(questionResult.utilizationPercentage === 112.5, "Utilization = (45 / 40) * 100 = 112.5%");
  assert(questionResult.classification === "Overloaded", "Classification is Overloaded");
  assert(questionResult.isOverloaded === true, "isOverloaded flag is true");
  assert(questionResult.excessPoints === 5, "Excess workload is 5 story points above net capacity");

  // ---------------------------------------------------------------------------
  // 5. WORKLOAD CLASSIFICATION THRESHOLDS
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. WORKLOAD CLASSIFICATION THRESHOLDS ---");

  // Below 80%: Available
  const c0 = classifyWorkload(0, 50);
  assert(c0.classification === "Available" && c0.utilizationPercentage === 0, "0% utilization -> Available");

  const c79 = classifyWorkload(39.5, 50); // 79%
  assert(c79.classification === "Available" && c79.utilizationPercentage === 79, "79% utilization -> Available");

  // 80% to below 100%: Near Capacity
  const c80 = classifyWorkload(40, 50); // 80%
  assert(c80.classification === "Near Capacity" && c80.utilizationPercentage === 80, "80% utilization -> Near Capacity");

  const c98 = classifyWorkload(49, 50); // 98%
  assert(c98.classification === "Near Capacity" && c98.utilizationPercentage === 98, "98% utilization -> Near Capacity");

  // Exactly 100%: At Capacity
  const c100 = classifyWorkload(50, 50); // 100%
  assert(c100.classification === "At Capacity" && c100.utilizationPercentage === 100, "100% utilization -> At Capacity");

  // Above 100%: Overloaded
  const c102 = classifyWorkload(51, 50); // 102%
  assert(c102.classification === "Overloaded" && c102.isOverloaded && c102.excessPoints === 1, "102% utilization -> Overloaded (1 excess pt)");

  const c150 = classifyWorkload(75, 50); // 150%
  assert(c150.classification === "Overloaded" && c150.excessPoints === 25, "150% utilization -> Overloaded (25 excess pts)");

  // ---------------------------------------------------------------------------
  // 6. ZERO-CAPACITY BEHAVIOR (DIVISION BY ZERO SAFETY)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. ZERO-CAPACITY EDGE CASES ---");

  // Net capacity = 0 and planned open points = 0
  const zeroCapNoWorkload = classifyWorkload(0, 0);
  assert(
    zeroCapNoWorkload.classification === "Available",
    "0 net capacity with 0 workload classifies as Available"
  );
  assert(zeroCapNoWorkload.utilizationPercentage === 0, "0 net capacity with 0 workload returns 0% utilization");
  assert(zeroCapNoWorkload.isOverloaded === false, "0 net capacity with 0 workload is NOT overloaded");

  // Net capacity = 0 and planned open points > 0 (e.g. employee on full-sprint leave with open tasks)
  const zeroCapWithWorkload = classifyWorkload(10, 0);
  assert(
    zeroCapWithWorkload.classification === "Overloaded",
    "0 net capacity with open workload classifies as Overloaded"
  );
  assert(zeroCapWithWorkload.isOverloaded === true, "0 net capacity with open workload is marked isOverloaded: true");
  assert(zeroCapWithWorkload.excessPoints === 10, "Excess points equal all open points (10)");
  assert(
    calculateUtilizationPercentage(10, 0) === Number.POSITIVE_INFINITY,
    "Raw mathematical utilization percentage is Infinity"
  );

  // ---------------------------------------------------------------------------
  // 7. TASK STATUS PARTITIONING & CANCELLED EXCLUSION
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. TASK STATUS PARTITIONING ---");

  const sampleTasks: TaskWorkloadInput[] = [
    { id: "T-TODO", storyPoints: 5, status: "To Do", assigneeEmployeeId: "EMP-B" },
    { id: "T-INP", storyPoints: 8, status: "In Progress", assigneeEmployeeId: "EMP-B" },
    { id: "T-BLK", storyPoints: 3, status: "Blocked", assigneeEmployeeId: "EMP-B" },
    { id: "T-DONE", storyPoints: 12, status: "Done", assigneeEmployeeId: "EMP-B" },
    { id: "T-CANC", storyPoints: 20, status: "Cancelled", assigneeEmployeeId: "EMP-B" },
    // Another employee's task (must not be counted for EMP-B)
    { id: "T-OTHER", storyPoints: 30, status: "In Progress", assigneeEmployeeId: "EMP-OTHER" },
  ];

  const empBResult = calculateEmployeeCapacity({
    employeeId: "EMP-B",
    sprintWorkingDays: 10,
    approvedLeaveWorkingDays: 0,
    tasks: sampleTasks,
  });

  assert(empBResult.plannedOpenPoints === 16, "Planned Open Points = 5 (To Do) + 8 (In Progress) + 3 (Blocked) = 16");
  assert(empBResult.completedPoints === 12, "Completed Points = 12 (Done)");
  assert(empBResult.totalPlannedPoints === 28, "Total Planned Points = 16 open + 12 done = 28");
  assert(empBResult.netCapacity === 50, "Net Capacity = 10 * 5 = 50");
  assert(empBResult.utilizationPercentage === 32.0, "Utilization = (16 / 50) * 100 = 32.0%");
  assert(empBResult.classification === "Available", "Classification is Available");

  // ---------------------------------------------------------------------------
  // 8. EMPLOYEES WITH NO TASKS & EMPLOYEES WITH DONE TASKS ONLY
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. EMPLOYEES WITH NO TASKS & DONE-ONLY TASKS ---");

  // Employee with no tasks
  const empNoTasks = calculateEmployeeCapacity({
    employeeId: "EMP-EMPTY",
    sprintWorkingDays: 10,
    approvedLeaveWorkingDays: 0,
    tasks: [],
  });
  assert(empNoTasks.plannedOpenPoints === 0, "No tasks -> 0 open points");
  assert(empNoTasks.completedPoints === 0, "No tasks -> 0 completed points");
  assert(empNoTasks.utilizationPercentage === 0, "No tasks -> 0% utilization");
  assert(empNoTasks.classification === "Available", "No tasks -> Available");

  // Employee with completed tasks only
  const empDoneOnly = calculateEmployeeCapacity({
    employeeId: "EMP-DONE",
    sprintWorkingDays: 10,
    approvedLeaveWorkingDays: 0,
    tasks: [{ id: "T-DONE-1", storyPoints: 25, status: "Done", assigneeEmployeeId: "EMP-DONE" }],
  });
  assert(empDoneOnly.plannedOpenPoints === 0, "Done tasks only -> 0 open points");
  assert(empDoneOnly.completedPoints === 25, "Done tasks only -> 25 completed points");
  assert(empDoneOnly.utilizationPercentage === 0, "Done tasks only -> 0% utilization (open workload is 0)");
  assert(empDoneOnly.classification === "Available", "Done tasks only -> Available");

  // ---------------------------------------------------------------------------
  // 9. SPRINT SUMMARY AGGREGATION & PROGRESS METRICS
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. SPRINT SUMMARY & PROGRESS AGGREGATION ---");

  const progress = calculateSprintProgress(127, 43);
  assert(progress.plannedPoints === 170, "Total planned points = 127 open + 43 done = 170");
  assert(progress.completedPoints === 43, "Completed points = 43");
  assert(progress.remainingPoints === 127, "Remaining points = 127");
  assert(progress.completionPercentage === 25.3, "Completion percentage = (43 / 170) * 100 = 25.3%");

  // Progress with 0 planned points
  const zeroProgress = calculateSprintProgress(0, 0);
  assert(zeroProgress.completionPercentage === 0, "0 planned points safely yields 0% completion");

  // Sprint Summary across 4 diverse employee metrics
  const mockMetrics = [
    questionResult, // Overloaded (open: 45, done: 0, netCap: 40)
    calculateEmployeeCapacity({
      employeeId: "EMP-2",
      sprintWorkingDays: 10,
      approvedLeaveWorkingDays: 0,
      tasks: [
        { id: "T-2A", storyPoints: 50, status: "In Progress", assigneeEmployeeId: "EMP-2" },
        { id: "T-2B", storyPoints: 10, status: "Done", assigneeEmployeeId: "EMP-2" },
      ],
    }), // At Capacity (open: 50, done: 10, netCap: 50)
    calculateEmployeeCapacity({
      employeeId: "EMP-3",
      sprintWorkingDays: 10,
      approvedLeaveWorkingDays: 0,
      tasks: [
        { id: "T-3A", storyPoints: 40, status: "To Do", assigneeEmployeeId: "EMP-3" },
        { id: "T-3B", storyPoints: 5, status: "Done", assigneeEmployeeId: "EMP-3" },
      ],
    }), // Near Capacity (open: 40, done: 5, netCap: 50, util: 80%)
    empBResult, // Available (open: 16, done: 12, netCap: 50, util: 32%)
  ];

  const summary = calculateSprintCapacitySummary(mockMetrics, 10);
  assert(summary.totalEmployees === 4, "Total employees = 4");
  assert(summary.overloadedEmployees === 1, "Overloaded employees count = 1");
  assert(summary.atCapacityEmployees === 1, "At Capacity employees count = 1");
  assert(summary.nearCapacityEmployees === 1, "Near Capacity employees count = 1");
  assert(summary.availableEmployees === 1, "Available employees count = 1");
  assert(summary.totalGrossCapacity === 200, "Total Gross Capacity = 50 * 4 = 200");
  assert(summary.totalNetCapacity === 190, "Total Net Capacity = 40 + 50 + 50 + 50 = 190");
  assert(summary.totalOpenPoints === 151, "Total Open Points = 45 + 50 + 40 + 16 = 151");
  assert(summary.totalCompletedPoints === 27, "Total Completed Points = 0 + 10 + 5 + 12 = 27");
  assert(summary.totalPlannedPoints === 178, "Total Planned Points = 151 + 27 = 178");
  assert(summary.completionPercentage === 15.2, "Completion percentage = (27 / 178) * 100 = 15.2%");

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  PHASE B SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
