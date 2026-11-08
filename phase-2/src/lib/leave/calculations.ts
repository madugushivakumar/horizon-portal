/**
 * Leave Calculation Utilities & Working Day Logic
 * src/lib/leave/calculations.ts
 */

import { prisma } from "@/lib/prisma";

/**
 * Calculates working days between two dates, excluding weekends and official holidays.
 */
export async function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string
): Promise<{ workingDays: number; holidaysEncountered: string[] }> {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start or end date format.");
  }

  // Normalize to UTC midnight
  const curr = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  if (curr > last) {
    throw new Error("Start date cannot be after end date.");
  }

  // Fetch all holidays in range
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: curr,
        lte: last,
      },
    },
    select: { holidayDate: true, name: true, date: true },
  });

  const holidayDateSet = new Set(
    holidays.map((h) => h.holidayDate || h.date.toISOString().split("T")[0])
  );

  let workingDays = 0;
  const holidaysEncountered: string[] = [];

  while (curr <= last) {
    const dayOfWeek = curr.getUTCDay(); // 0 = Sun, 6 = Sat
    const dateStr = curr.toISOString().split("T")[0];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDateSet.has(dateStr);

    if (isHoliday) {
      holidaysEncountered.push(dateStr);
    }

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return { workingDays, holidaysEncountered };
}
