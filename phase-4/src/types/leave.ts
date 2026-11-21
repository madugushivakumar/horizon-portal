/**
 * Leave & Attendance Type Definitions
 * src/types/leave.ts
 */

export interface LeaveBalanceItem {
  code: string;
  name: string;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
  payType: string;
  policyNote?: string | null;
}

export interface LeaveBalancesResponse {
  financialYear: string;
  asOfDate: string;
  employeeId: string;
  balances: LeaveBalanceItem[];
}

export interface LeaveRequestItem {
  id: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled" | string;
  reason: string | null;
  appliedOn: string | null;
  approverId: string | null;
  decidedOn: string | null;
}

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: "holiday" | "leave";
  title: string;
  status?: string;
  leaveTypeCode?: string;
  holidayType?: string;
}

export interface AttendanceSummary {
  periodEndDate: string;
  scheduledDays: number;
  presentDays: number;
  wfhDays: number;
  paidLeaveDays: number;
  unpaidAbsenceDays: number;
  lateArrivals: number;
  avgHoursWorked: number;
  overtimeHours: number;
  attendanceRate: number;
}
