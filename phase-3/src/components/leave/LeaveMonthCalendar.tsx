"use client";

import React, { useState, useEffect, useMemo } from "react";

interface CalendarHoliday {
  id: string;
  date: string;
  title: string;
  holidayType: string;
}

interface CalendarLeave {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  leaveTypeCode: string;
  status: string;
  reason: string | null;
}

interface LeaveMonthCalendarProps {
  initialYear?: number;
  initialMonth?: number; // 1-12
  refreshTrigger?: number;
}

export function LeaveMonthCalendar({
  initialYear = 2026,
  initialMonth = 9, // default to September 2026 where latest data sits
  refreshTrigger = 0,
}: LeaveMonthCalendarProps) {
  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);

  const [holidays, setHolidays] = useState<CalendarHoliday[]>([]);
  const [leaves, setLeaves] = useState<CalendarLeave[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/leave/calendar?year=${currentYear}&month=${currentMonth.toString().padStart(2, "0")}`
        );
        if (!ignore && res.ok) {
          const json = await res.json();
          setHolidays(json.data.holidays || []);
          setLeaves(json.data.leaves || []);
        }
      } catch (err) {
        console.error("Error loading calendar events:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [currentYear, currentMonth, refreshTrigger]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Month metadata
  const monthName = useMemo(() => {
    const d = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    return d.toLocaleString("default", { month: "long" });
  }, [currentYear, currentMonth]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Preceding empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dateStr: "", dayNumber: 0, isCurrentMonth: false });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      days.push({ dateStr, dayNumber: day, isCurrentMonth: true });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map events to date strings
  const holidaysMap = useMemo(() => {
    const map = new Map<string, CalendarHoliday>();
    for (const h of holidays) {
      map.set(h.date, h);
    }
    return map;
  }, [holidays]);

  // Helper to check if a date falls between start and end date
  const getLeavesForDate = (dateStr: string) => {
    if (!dateStr) return [];
    return leaves.filter((l) => dateStr >= l.startDate && dateStr <= l.endDate);
  };

  return (
    <div className="bg-[var(--hz-surface-card)] rounded-xl border border-[var(--hz-border-subtle)] p-6 shadow-xs">
      {/* Calendar Header with Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--hz-text-title)]">
            Time-Off Calendar
          </h3>
          <p className="text-xs text-[var(--hz-text-muted)]">
            Holidays and scheduled personal leave for {monthName} {currentYear}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--hz-border-subtle)] bg-[var(--hz-surface-elevated)] hover:bg-[var(--hz-neutral-100)] text-[var(--hz-text-body)] text-xs font-semibold cursor-pointer transition-colors"
            title="Previous Month"
          >
            &larr; Prev
          </button>
          <span className="text-xs font-bold px-3 py-1 bg-[var(--hz-neutral-100)] dark:bg-[var(--hz-neutral-900)] rounded-md text-[var(--hz-text-title)] min-w-[120px] text-center">
            {monthName} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--hz-border-subtle)] bg-[var(--hz-surface-elevated)] hover:bg-[var(--hz-neutral-100)] text-[var(--hz-text-body)] text-xs font-semibold cursor-pointer transition-colors"
            title="Next Month"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--hz-text-muted)] mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[70px] bg-[var(--hz-surface-canvas)]/30 rounded-lg border border-transparent p-1.5"
              />
            );
          }

          const holiday = holidaysMap.get(cell.dateStr);
          const dayLeaves = getLeavesForDate(cell.dateStr);

          const isWeekend =
            new Date(cell.dateStr).getDay() === 0 || new Date(cell.dateStr).getDay() === 6;

          return (
            <div
              key={cell.dateStr}
              className={`min-h-[70px] rounded-lg border p-1.5 flex flex-col justify-between transition-colors ${
                isWeekend
                  ? "bg-[var(--hz-surface-canvas)]/60 border-[var(--hz-border-subtle)]/40 text-[var(--hz-text-muted)]"
                  : "bg-[var(--hz-surface-elevated)] border-[var(--hz-border-subtle)] text-[var(--hz-text-body)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isWeekend ? "text-[var(--hz-text-muted)]" : "text-[var(--hz-text-title)]"
                  }`}
                >
                  {cell.dayNumber}
                </span>
                {holiday && (
                  <span className="text-[10px]" title={holiday.title}>
                    ⭐
                  </span>
                )}
              </div>

              {/* Badges container */}
              <div className="space-y-1 mt-1 overflow-hidden">
                {holiday && (
                  <div
                    className="text-[10px] font-semibold px-1 py-0.5 rounded bg-[var(--hz-accent-50)] dark:bg-[var(--hz-accent-950)] text-[var(--hz-accent-700)] dark:text-[var(--hz-accent-300)] border border-[var(--hz-accent-200)] truncate"
                    title={`Holiday: ${holiday.title} (${holiday.holidayType})`}
                  >
                    {holiday.title}
                  </div>
                )}

                {dayLeaves.map((l) => (
                  <div
                    key={l.id}
                    className={`text-[10px] font-semibold px-1 py-0.5 rounded border truncate ${
                      l.status === "Approved"
                        ? "bg-[var(--hz-success-50)] text-[var(--hz-success-700)] border-[var(--hz-success-200)]"
                        : "bg-[var(--hz-warning-50)] text-[var(--hz-warning-700)] border-[var(--hz-warning-200)]"
                    }`}
                    title={`${l.status} Leave: ${l.title} (${l.startDate} to ${l.endDate})`}
                  >
                    {l.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-end gap-4 mt-4 pt-3 border-t border-[var(--hz-border-subtle)] text-xs text-[var(--hz-text-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--hz-accent-500)]"></span>
          <span>Official Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--hz-success-500)]"></span>
          <span>Approved Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--hz-warning-500)]"></span>
          <span>Pending Leave</span>
        </div>
      </div>
    </div>
  );
}
