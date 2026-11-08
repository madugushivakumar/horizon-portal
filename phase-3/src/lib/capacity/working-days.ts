/**
 * Horizon Portal — Working Days & Leave Overlap Engine
 * src/lib/capacity/working-days.ts
 *
 * Provides deterministic, timezone-safe working day calculations:
 * - Monday through Friday are working days.
 * - Saturdays and Sundays are excluded.
 * - Weekday holidays are excluded.
 * - Weekends and holidays are never double-subtracted.
 * - Dates are normalized to UTC midnight (00:00:00.000Z) to prevent daylight-saving drift.
 * - Only Approved leave reduces capacity.
 * - Leave dates overlapping the sprint are deduplicated to prevent double-counting.
 * - Leave outside the sprint is strictly ignored.
 */

import {
  DAILY_STORY_POINT_CAPACITY,
  EmployeeLeaveCalculationResult,
  LeavePeriodInput,
  SprintWorkingDaysResult,
} from "./capacity-types";

/**
 * Normalizes any valid Date or ISO date string to UTC midnight.
 * Returns null if the input is invalid or NaN.
 */
export function normalizeDateToUTC(dateInput: Date | string | null | undefined): Date | null {
  if (!dateInput) return null;
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return null;

  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0)
  );
}

/**
 * Formats a Date object to YYYY-MM-DD string using UTC values.
 */
export function formatDateToISOString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether a given UTC Date is a weekday (Monday = 1 through Friday = 5).
 * Sunday = 0, Saturday = 6.
 */
export function isWeekday(date: Date): boolean {
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

/**
 * Calculates working days between two dates (inclusive), excluding weekends
 * and official organization holidays that fall on weekdays.
 *
 * Guarantees:
 * - If start > end: returns 0 working days.
 * - If start or end is invalid: returns 0 working days.
 * - Holidays falling on weekends are not double-subtracted.
 * - Returns array of individual working dates and encountered holiday dates.
 */
export function calculateWorkingDaysInRange(
  startDate: Date | string,
  endDate: Date | string,
  holidayDateStrings?: string[] | Set<string>
): SprintWorkingDaysResult {
  const start = normalizeDateToUTC(startDate);
  const end = normalizeDateToUTC(endDate);

  const emptyResult: SprintWorkingDaysResult = {
    workingDays: 0,
    totalCalendarDays: 0,
    weekendDays: 0,
    holidayDays: 0,
    workingDateStrings: [],
    holidaysEncountered: [],
  };

  if (!start || !end || start > end) {
    return emptyResult;
  }

  const holidaySet =
    holidayDateStrings instanceof Set
      ? holidayDateStrings
      : new Set(holidayDateStrings || []);

  let workingDays = 0;
  let totalCalendarDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  const workingDateStrings: string[] = [];
  const holidaysEncountered: string[] = [];

  const curr = new Date(start.getTime());

  while (curr <= end) {
    totalCalendarDays++;
    const dateStr = formatDateToISOString(curr);
    const dayOfWeek = curr.getUTCDay();
    const weekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (weekend) {
      weekendDays++;
    } else if (holidaySet.has(dateStr)) {
      holidayDays++;
      holidaysEncountered.push(dateStr);
    } else {
      workingDays++;
      workingDateStrings.push(dateStr);
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return {
    workingDays,
    totalCalendarDays,
    weekendDays,
    holidayDays,
    workingDateStrings,
    holidaysEncountered,
  };
}

/**
 * Calculates the number of approved leave working days that overlap a given sprint.
 *
 * Rules:
 * 1. Only leave with status === 'Approved' is counted. Pending, rejected, or cancelled leave is ignored.
 * 2. Overlap is computed: [ max(sprintStart, leaveStart), min(sprintEnd, leaveEnd) ].
 * 3. Only weekdays that are NOT holidays (i.e. valid sprint working days) are counted.
 * 4. All leave working dates are stored in a Set to prevent double-counting of multiple leaves covering the same day.
 * 5. Available working days = max(0, sprintWorkingDays - approvedLeaveWorkingDays).
 */
export function calculateOverlappingLeaveWorkingDays(
  sprintStartDate: Date | string,
  sprintEndDate: Date | string,
  leaveRequests: LeavePeriodInput[],
  holidayDateStrings?: string[] | Set<string>,
  dailyStoryPointCapacity = DAILY_STORY_POINT_CAPACITY
): EmployeeLeaveCalculationResult {
  const sprintResult = calculateWorkingDaysInRange(
    sprintStartDate,
    sprintEndDate,
    holidayDateStrings
  );

  const sprintWorkingDateSet = new Set(sprintResult.workingDateStrings);
  const sprintStart = normalizeDateToUTC(sprintStartDate);
  const sprintEnd = normalizeDateToUTC(sprintEndDate);

  if (!sprintStart || !sprintEnd || sprintStart > sprintEnd || sprintResult.workingDays === 0) {
    return {
      approvedLeaveWorkingDays: 0,
      leaveDatesInSprint: [],
      leaveReductionPoints: 0,
      availableWorkingDays: 0,
    };
  }

  const deduplicatedLeaveDates = new Set<string>();

  for (const leave of leaveRequests) {
    // Only 'Approved' leave reduces capacity
    if (leave.status !== "Approved") {
      continue;
    }

    const leaveStart = normalizeDateToUTC(leave.startDate);
    const leaveEnd = normalizeDateToUTC(leave.endDate);

    if (!leaveStart || !leaveEnd || leaveStart > leaveEnd) {
      continue;
    }

    // Determine overlap with sprint boundaries
    const overlapStart = new Date(Math.max(sprintStart.getTime(), leaveStart.getTime()));
    const overlapEnd = new Date(Math.min(sprintEnd.getTime(), leaveEnd.getTime()));

    // No overlap
    if (overlapStart > overlapEnd) {
      continue;
    }

    // Traverse each day in the overlap
    const curr = new Date(overlapStart.getTime());
    while (curr <= overlapEnd) {
      const dateStr = formatDateToISOString(curr);
      // Only count if this date was an actual working day in the sprint
      // (This automatically excludes weekends AND holidays!)
      if (sprintWorkingDateSet.has(dateStr)) {
        deduplicatedLeaveDates.add(dateStr);
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
  }

  const approvedLeaveWorkingDays = deduplicatedLeaveDates.size;
  const leaveReductionPoints = approvedLeaveWorkingDays * dailyStoryPointCapacity;
  const availableWorkingDays = Math.max(0, sprintResult.workingDays - approvedLeaveWorkingDays);

  return {
    approvedLeaveWorkingDays,
    leaveDatesInSprint: Array.from(deduplicatedLeaveDates).sort(),
    leaveReductionPoints,
    availableWorkingDays,
  };
}
