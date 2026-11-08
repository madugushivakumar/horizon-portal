/**
 * Horizon Portal — Complete Master Data Pack Seeding Script
 * prisma/seed.ts
 *
 * Imports 100% of all 23 original datasets from 03_Data_Pack/:
 *  1. departments.json (11)
 *  2. roles.json (58)
 *  3. employees.json (441)
 *  4. demo_users.json (4 + 4 legacy test accounts)
 *  5. payroll_runs.json (18)
 *  6. payslips.json (2,469)
 *  7. leave_types.json (6)
 *  8. leave_balances.json (441)
 *  9. leave_requests.json (2,183)
 * 10. holidays.json (19)
 * 11. attendance_monthly.json (2,469)
 * 12. teams.json (16)
 * 13. sprints.json (38)
 * 14. tasks.json (4,844)
 * 15. clients.json (28)
 * 16. vendors.json (30)
 * 17. invoices.json (743)
 * 18. expenses.json (501)
 * 19. announcements.json (8)
 * 20. hr_faq.json (30)
 * 21. chatbot_responses.json (33)
 * 22. ai_anomaly_results.json (405)
 * 23. ai_attrition_risk.json (430)
 *
 * Guarantees strict idempotency, referential integrity, and bcrypt password hashing.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const DATA_PACK_DIR = path.join(process.cwd(), "03_Data_Pack");

function loadJson<T>(filename: string): T {
  const filePath = path.join(DATA_PACK_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CRITICAL: Required dataset file is missing: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

// Utility for chunking large arrays
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function seedDataPack() {
  console.log("\n=================================================================");
  console.log("       HORIZON PORTAL — COMPLETE DATA PACK SEEDING               ");
  console.log("=================================================================\n");

  const startTime = Date.now();

  // ─────────────────────────────────────────────────────────────
  // 0. Clean up initial temporary mock workforce records (Days 1-5)
  // ─────────────────────────────────────────────────────────────
  console.log("▶ [0/23] Clearing temporary mock workforce data...");
  const mockEmpIds = Array.from({ length: 25 }, (_, i) => `EMP-${String(i + 1).padStart(3, "0")}`);
  await prisma.user.updateMany({
    where: { employeeId: { in: mockEmpIds } },
    data: { employeeId: null },
  });
  await prisma.employee.deleteMany({
    where: { id: { in: mockEmpIds } },
  });
  await prisma.role.deleteMany({
    where: { id: { startsWith: "ROLE-" } },
  });
  await prisma.department.deleteMany({
    where: { id: { startsWith: "DEPT-" } },
  });

  // Prepare idempotent slate for large tables (clean children first to avoid stale duplicates)
  await prisma.aiAttritionRisk.deleteMany();
  await prisma.aiAnomalyResult.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.attendanceMonthly.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.team.deleteMany();
  console.log("   ✓ Cleaned slate prepared for idempotent data insertion.");

  // ─────────────────────────────────────────────────────────────
  // 1. Departments (11 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [1/23] Seeding Departments...");
  interface RawDepartment {
    department_id: string;
    department_name: string;
    cost_center: string;
    description: string;
  }
  const rawDepartments = loadJson<RawDepartment[]>("departments.json");
  console.log(`   Source records found: ${rawDepartments.length}`);

  for (const d of rawDepartments) {
    await prisma.department.upsert({
      where: { id: d.department_id },
      update: {
        name: d.department_name,
        code: d.cost_center,
        costCenter: d.cost_center,
        description: d.description,
      },
      create: {
        id: d.department_id,
        name: d.department_name,
        code: d.cost_center,
        costCenter: d.cost_center,
        description: d.description,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawDepartments.length} departments.`);

  // ─────────────────────────────────────────────────────────────
  // 2. Roles (58 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [2/23] Seeding Organizational Roles...");
  interface RawRole {
    role_id: string;
    department_id: string;
    role_title: string;
    level: number;
    grade: string;
  }
  const rawRoles = loadJson<RawRole[]>("roles.json");
  console.log(`   Source records found: ${rawRoles.length}`);

  for (const r of rawRoles) {
    await prisma.role.upsert({
      where: { id: r.role_id },
      update: {
        name: r.role_title,
        roleTitle: r.role_title,
        level: r.level,
        grade: r.grade,
        departmentId: r.department_id,
      },
      create: {
        id: r.role_id,
        name: r.role_title,
        roleTitle: r.role_title,
        level: r.level,
        grade: r.grade,
        departmentId: r.department_id,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawRoles.length} roles.`);

  // ─────────────────────────────────────────────────────────────
  // 3. Employees (441 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [3/23] Seeding Employees (441 records)...");
  interface RawEmployee {
    employee_id: string;
    full_name: string;
    work_email: string;
    department_id: string;
    role_id: string;
    manager_id: string | null;
    work_location: string;
    work_mode: string;
    employment_type: string;
    hire_date: string;
  }
  const rawEmployees = loadJson<RawEmployee[]>("employees.json");
  console.log(`   Source records found: ${rawEmployees.length}`);

  // Pass 1: Upsert all employees without managerId to resolve self-referential cycle
  for (const e of rawEmployees) {
    const parts = e.full_name.trim().split(/\s+/);
    const firstName = parts[0] || e.full_name;
    const lastName = parts.slice(1).join(" ") || parts[0];

    await prisma.employee.upsert({
      where: { id: e.employee_id },
      update: {
        fullName: e.full_name,
        firstName,
        lastName,
        email: e.work_email,
        workEmail: e.work_email,
        departmentId: e.department_id,
        roleId: e.role_id,
        workLocation: e.work_location,
        workMode: e.work_mode,
        employmentType: e.employment_type,
        hireDate: new Date(e.hire_date),
        status: "Active",
      },
      create: {
        id: e.employee_id,
        fullName: e.full_name,
        firstName,
        lastName,
        email: e.work_email,
        workEmail: e.work_email,
        departmentId: e.department_id,
        roleId: e.role_id,
        workLocation: e.work_location,
        workMode: e.work_mode,
        employmentType: e.employment_type,
        hireDate: new Date(e.hire_date),
        status: "Active",
        managerId: null,
      },
    });
  }

  // Pass 2: Connect all self-referencing manager relationships
  for (const e of rawEmployees) {
    if (e.manager_id) {
      await prisma.employee.update({
        where: { id: e.employee_id },
        data: { managerId: e.manager_id },
      });
    }
  }
  console.log(`   ✓ Seeded ${rawEmployees.length} employees with self-referential reporting hierarchy.`);

  // ─────────────────────────────────────────────────────────────
  // 4. Demo Users & Authentication
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [4/23] Seeding Demo Users (Data Pack + Test Accounts)...");
  interface RawDemoUser {
    label: string;
    employee_id: string;
    full_name: string;
    username: string;
    role: string;
    demo_password: string;
  }
  const rawDemoUsers = loadJson<RawDemoUser[]>("demo_users.json");

  // Normalize role names
  function normalizeRole(role: string): "Admin" | "HR" | "Manager" | "Employee" {
    const upper = role.toUpperCase();
    if (upper === "ADMIN") return "Admin";
    if (upper === "HR") return "HR";
    if (upper === "MANAGER") return "Manager";
    return "Employee";
  }

  // 4.1 Data Pack Demo Users (password: Horizon@2026)
  for (const u of rawDemoUsers) {
    const passwordHash = await bcrypt.hash("Horizon@2026", 10);
    const role = normalizeRole(u.role);
    await prisma.user.upsert({
      where: { email: u.username.toLowerCase().trim() },
      update: {
        name: u.full_name,
        role,
        passwordHash,
        isActive: true,
        employeeId: u.employee_id,
      },
      create: {
        email: u.username.toLowerCase().trim(),
        name: u.full_name,
        role,
        passwordHash,
        isActive: true,
        employeeId: u.employee_id,
      },
    });
    console.log(`   ✓ Data Pack Demo User [${role.padEnd(8)}] ${u.username} (Emp: ${u.employee_id})`);
  }

  // 4.2 Legacy Test Demo Users (from root demo_users.json) to preserve 100% Day 1-5 test suite compatibility
  const legacyUsers = [
    {
      id: "usr_admin_001",
      name: "Alexander Wright",
      email: "admin@growmar.com",
      password: "Admin@Horizon2026!",
      role: "Admin",
      employee_id: "EMP-0099", // Linked to real employee Sanjay Kumar
    },
    {
      id: "usr_hr_002",
      name: "Eleanor Vance",
      email: "hr@growmar.com",
      password: "HR@Horizon2026!",
      role: "HR",
      employee_id: "EMP-0011", // Linked to real employee Hemant Mathew
    },
    {
      id: "usr_mgr_003",
      name: "Marcus Brody",
      email: "manager@growmar.com",
      password: "Manager@Horizon2026!",
      role: "Manager",
      employee_id: "EMP-0547", // Linked to real employee Imran Philip
    },
    {
      id: "usr_emp_004",
      name: "Sophie Chen",
      email: "employee@growmar.com",
      password: "Employee@Horizon2026!",
      role: "Employee",
      employee_id: "EMP-0188", // Linked to real employee Sasi Shetty
    },
  ];

  for (const u of legacyUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase().trim() },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: true,
        employeeId: u.employee_id,
      },
      create: {
        id: u.id,
        email: u.email.toLowerCase().trim(),
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: true,
        employeeId: u.employee_id,
      },
    });
    console.log(`   ✓ Test Demo Account [${u.role.padEnd(8)}] ${u.email} (Emp: ${u.employee_id})`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Payroll Runs (18 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [5/23] Seeding Payroll Runs...");
  interface RawPayrollRun {
    run_id: string;
    period_start: string;
    period_end: string;
    pay_date: string | null;
    employees_paid: number;
    total_gross: number;
    total_net: number;
    status: string;
  }
  const rawPayrollRuns = loadJson<RawPayrollRun[]>("payroll_runs.json");
  console.log(`   Source records found: ${rawPayrollRuns.length}`);

  for (const pr of rawPayrollRuns) {
    await prisma.payrollRun.upsert({
      where: { id: pr.run_id },
      update: {
        periodStart: new Date(pr.period_start),
        periodEnd: new Date(pr.period_end),
        paymentDate: pr.pay_date ? new Date(pr.pay_date) : null,
        payDate: pr.pay_date ? new Date(pr.pay_date) : null,
        employeesPaid: pr.employees_paid,
        totalGross: pr.total_gross,
        totalNet: pr.total_net,
        status: pr.status,
      },
      create: {
        id: pr.run_id,
        periodStart: new Date(pr.period_start),
        periodEnd: new Date(pr.period_end),
        paymentDate: pr.pay_date ? new Date(pr.pay_date) : null,
        payDate: pr.pay_date ? new Date(pr.pay_date) : null,
        employeesPaid: pr.employees_paid,
        totalGross: pr.total_gross,
        totalNet: pr.total_net,
        status: pr.status,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawPayrollRuns.length} payroll runs.`);

  // ─────────────────────────────────────────────────────────────
  // 6. Payslips (2,469 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [6/23] Seeding Payslips (2,469 records)...");
  interface RawPayslip {
    payroll_item_id: string;
    run_id: string;
    employee_id: string;
    period_start: string;
    period_end: string;
    calendar_days: number;
    lop_days: number;
    payable_days: number;
    basic: number;
    hra: number;
    conveyance: number;
    medical: number;
    special_allowance: number;
    overtime_pay: number;
    variable_pay: number;
    gross_pay: number;
    pf_employee: number;
    esi_employee: number;
    professional_tax: number;
    tds: number;
    other_deductions: number;
    total_deductions: number;
    net_pay: number;
  }
  const rawPayslips = loadJson<RawPayslip[]>("payslips.json");
  console.log(`   Source records found: ${rawPayslips.length}`);

  const payslipChunks = chunkArray(rawPayslips, 300);
  for (const chunk of payslipChunks) {
    await prisma.payslip.createMany({
      data: chunk.map((p) => ({
        id: p.payroll_item_id,
        payrollRunId: p.run_id,
        employeeId: p.employee_id,
        periodStart: new Date(p.period_start),
        periodEnd: new Date(p.period_end),
        calendarDays: p.calendar_days,
        lopDays: p.lop_days,
        payableDays: p.payable_days,
        basic: p.basic,
        hra: p.hra,
        conveyance: p.conveyance,
        medical: p.medical,
        specialAllowance: p.special_allowance,
        overtimePay: p.overtime_pay,
        variablePay: p.variable_pay,
        grossPay: p.gross_pay,
        pfEmployee: p.pf_employee,
        esiEmployee: p.esi_employee,
        professionalTax: p.professional_tax,
        tds: p.tds,
        otherDeductions: p.other_deductions,
        totalDeductions: p.total_deductions,
        netPay: p.net_pay,
        deductions: p.total_deductions,
        currency: "INR",
        payPeriod: p.run_id,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawPayslips.length} payslips.`);

  // ─────────────────────────────────────────────────────────────
  // 7. Leave Types (6 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [7/23] Seeding Leave Types...");
  interface RawLeaveType {
    leave_type_code: string;
    leave_type_name: string;
    pay_type: string;
    annual_quota_days: number;
    prorated_for_joiners: string;
    carry_forward_allowed: string;
    max_carry_forward_days: number;
    policy_note: string;
  }
  const rawLeaveTypes = loadJson<RawLeaveType[]>("leave_types.json");
  console.log(`   Source records found: ${rawLeaveTypes.length}`);

  for (const lt of rawLeaveTypes) {
    await prisma.leaveType.upsert({
      where: { id: lt.leave_type_code },
      update: {
        code: lt.leave_type_code,
        name: lt.leave_type_name,
        leaveTypeName: lt.leave_type_name,
        payType: lt.pay_type,
        annualQuotaDays: lt.annual_quota_days,
        defaultDays: lt.annual_quota_days,
        proratedForJoiners: lt.prorated_for_joiners,
        carryForwardAllowed: lt.carry_forward_allowed,
        maxCarryForwardDays: lt.max_carry_forward_days,
        policyNote: lt.policy_note,
      },
      create: {
        id: lt.leave_type_code,
        code: lt.leave_type_code,
        name: lt.leave_type_name,
        leaveTypeName: lt.leave_type_name,
        payType: lt.pay_type,
        annualQuotaDays: lt.annual_quota_days,
        defaultDays: lt.annual_quota_days,
        proratedForJoiners: lt.prorated_for_joiners,
        carryForwardAllowed: lt.carry_forward_allowed,
        maxCarryForwardDays: lt.max_carry_forward_days,
        policyNote: lt.policy_note,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawLeaveTypes.length} leave types.`);

  // ─────────────────────────────────────────────────────────────
  // 8. Leave Balances (441 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [8/23] Seeding Leave Balances (441 records)...");
  interface RawLeaveBalance {
    employee_id: string;
    as_of_date: string;
    financial_year: string;
    cl_entitlement: number;
    cl_used: number;
    cl_balance: number;
    sl_entitlement: number;
    sl_used: number;
    sl_balance: number;
    el_used_fy: number;
    el_balance: number;
    pending_days: number;
  }
  const rawLeaveBalances = loadJson<RawLeaveBalance[]>("leave_balances.json");
  console.log(`   Source records found: ${rawLeaveBalances.length}`);

  const leaveBalanceChunks = chunkArray(rawLeaveBalances, 200);
  for (const chunk of leaveBalanceChunks) {
    await prisma.leaveBalance.createMany({
      data: chunk.map((lb) => ({
        id: lb.employee_id,
        employeeId: lb.employee_id,
        asOfDate: new Date(lb.as_of_date),
        financialYear: lb.financial_year,
        clEntitlement: lb.cl_entitlement,
        clUsed: lb.cl_used,
        clBalance: lb.cl_balance,
        slEntitlement: lb.sl_entitlement,
        slUsed: lb.sl_used,
        slBalance: lb.sl_balance,
        elUsedFy: lb.el_used_fy,
        elBalance: lb.el_balance,
        pendingDays: lb.pending_days,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawLeaveBalances.length} leave balances.`);

  // ─────────────────────────────────────────────────────────────
  // 9. Leave Requests (2,183 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [9/23] Seeding Leave Requests (2,183 records)...");
  interface RawLeaveRequest {
    leave_request_id: string;
    employee_id: string;
    leave_type_code: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: string;
    applied_on: string;
    approver_id: string | null;
    decided_on: string | null;
  }
  const rawLeaveRequests = loadJson<RawLeaveRequest[]>("leave_requests.json");
  console.log(`   Source records found: ${rawLeaveRequests.length}`);

  const leaveRequestChunks = chunkArray(rawLeaveRequests, 300);
  for (const chunk of leaveRequestChunks) {
    await prisma.leaveRequest.createMany({
      data: chunk.map((lr) => ({
        id: lr.leave_request_id,
        employeeId: lr.employee_id,
        leaveTypeCode: lr.leave_type_code,
        leaveTypeId: lr.leave_type_code,
        startDate: new Date(lr.start_date),
        endDate: new Date(lr.end_date),
        days: lr.days,
        reason: lr.reason,
        status: lr.status,
        appliedOn: lr.applied_on ? new Date(lr.applied_on) : null,
        approverId: lr.approver_id,
        decidedOn: lr.decided_on ? new Date(lr.decided_on) : null,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawLeaveRequests.length} leave requests.`);

  // ─────────────────────────────────────────────────────────────
  // 10. Holidays (19 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [10/23] Seeding Holidays...");
  interface RawHoliday {
    holiday_date: string;
    holiday_name: string;
    holiday_type: string;
    weekday: string;
    falls_on_weekend: string;
    calendar_note: string;
  }
  const rawHolidays = loadJson<RawHoliday[]>("holidays.json");
  console.log(`   Source records found: ${rawHolidays.length}`);

  for (const h of rawHolidays) {
    await prisma.holiday.upsert({
      where: { id: h.holiday_date },
      update: {
        name: h.holiday_name,
        holidayName: h.holiday_name,
        date: new Date(h.holiday_date),
        holidayDate: h.holiday_date,
        holidayType: h.holiday_type,
        weekday: h.weekday,
        fallsOnWeekend: h.falls_on_weekend,
        calendarNote: h.calendar_note,
      },
      create: {
        id: h.holiday_date,
        name: h.holiday_name,
        holidayName: h.holiday_name,
        date: new Date(h.holiday_date),
        holidayDate: h.holiday_date,
        holidayType: h.holiday_type,
        weekday: h.weekday,
        fallsOnWeekend: h.falls_on_weekend,
        calendarNote: h.calendar_note,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawHolidays.length} holidays.`);

  // ─────────────────────────────────────────────────────────────
  // 11. Monthly Attendance (2,469 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [11/23] Seeding Monthly Attendance (2,469 records)...");
  interface RawAttendance {
    employee_id: string;
    period_end_date: string;
    scheduled_days: number;
    present_days: number;
    wfh_days: number;
    paid_leave_days: number;
    unpaid_absence_days: number;
    late_arrivals: number;
    avg_hours_worked: number;
    overtime_hours: number;
    attendance_rate: number;
  }
  const rawAttendance = loadJson<RawAttendance[]>("attendance_monthly.json");
  console.log(`   Source records found: ${rawAttendance.length}`);

  const attendanceChunks = chunkArray(rawAttendance, 300);
  for (const chunk of attendanceChunks) {
    await prisma.attendanceMonthly.createMany({
      data: chunk.map((am) => ({
        employeeId: am.employee_id,
        periodEndDate: new Date(am.period_end_date),
        scheduledDays: am.scheduled_days,
        presentDays: am.present_days,
        wfhDays: am.wfh_days,
        paidLeaveDays: am.paid_leave_days,
        unpaidAbsenceDays: am.unpaid_absence_days,
        lateArrivals: am.late_arrivals,
        avgHoursWorked: am.avg_hours_worked,
        overtimeHours: am.overtime_hours,
        attendanceRate: am.attendance_rate,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawAttendance.length} monthly attendance records.`);

  // ─────────────────────────────────────────────────────────────
  // 12. Teams (16 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [12/23] Seeding Teams...");
  interface RawTeam {
    team_id: string;
    team_name: string;
    department_id: string;
    team_lead_employee_id: string | null;
    active_members: number;
    planning_cadence: string;
    board_tool: string;
  }
  const rawTeams = loadJson<RawTeam[]>("teams.json");
  console.log(`   Source records found: ${rawTeams.length}`);

  for (const t of rawTeams) {
    await prisma.team.upsert({
      where: { id: t.team_id },
      update: {
        teamName: t.team_name,
        departmentId: t.department_id,
        teamLeadEmployeeId: t.team_lead_employee_id,
        activeMembers: t.active_members,
        planningCadence: t.planning_cadence,
        boardTool: t.board_tool,
      },
      create: {
        id: t.team_id,
        teamName: t.team_name,
        departmentId: t.department_id,
        teamLeadEmployeeId: t.team_lead_employee_id,
        activeMembers: t.active_members,
        planningCadence: t.planning_cadence,
        boardTool: t.board_tool,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawTeams.length} teams.`);

  // ─────────────────────────────────────────────────────────────
  // 13. Sprints (38 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [13/23] Seeding Sprints...");
  interface RawSprint {
    sprint_id: string;
    sprint_name: string;
    start_date: string;
    end_date: string;
    working_days: number;
    financial_year: string;
  }
  const rawSprints = loadJson<RawSprint[]>("sprints.json");
  console.log(`   Source records found: ${rawSprints.length}`);

  for (const s of rawSprints) {
    await prisma.sprint.upsert({
      where: { id: s.sprint_id },
      update: {
        sprintName: s.sprint_name,
        startDate: new Date(s.start_date),
        endDate: new Date(s.end_date),
        workingDays: s.working_days,
        financialYear: s.financial_year,
      },
      create: {
        id: s.sprint_id,
        sprintName: s.sprint_name,
        startDate: new Date(s.start_date),
        endDate: new Date(s.end_date),
        workingDays: s.working_days,
        financialYear: s.financial_year,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawSprints.length} sprints.`);

  // ─────────────────────────────────────────────────────────────
  // 14. Tasks (4,844 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [14/23] Seeding Tasks (4,844 records)...");
  interface RawTask {
    task_id: string;
    team_id: string;
    sprint_id: string;
    assignee_employee_id: string;
    task_type: string;
    priority: string;
    story_points: number;
    created_date: string;
    started_date: string | null;
    due_date: string;
    completed_date: string | null;
    status: string;
    reopened_count: number;
    cycle_time_days: number | null;
    is_overdue_at_cutoff: string;
    completed_on_time: string | null;
  }
  const rawTasks = loadJson<RawTask[]>("tasks.json");
  console.log(`   Source records found: ${rawTasks.length}`);

  const taskChunks = chunkArray(rawTasks, 300);
  for (const chunk of taskChunks) {
    await prisma.task.createMany({
      data: chunk.map((tk) => ({
        id: tk.task_id,
        teamId: tk.team_id,
        sprintId: tk.sprint_id,
        assigneeEmployeeId: tk.assignee_employee_id,
        taskType: tk.task_type,
        priority: tk.priority,
        storyPoints: tk.story_points,
        createdDate: new Date(tk.created_date),
        startedDate: tk.started_date ? new Date(tk.started_date) : null,
        dueDate: new Date(tk.due_date),
        completedDate: tk.completed_date ? new Date(tk.completed_date) : null,
        status: tk.status,
        reopenedCount: tk.reopened_count ?? 0,
        cycleTimeDays: tk.cycle_time_days,
        isOverdueAtCutoff: tk.is_overdue_at_cutoff,
        completedOnTime: tk.completed_on_time,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawTasks.length} tasks.`);

  // ─────────────────────────────────────────────────────────────
  // 15. Clients (28 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [15/23] Seeding Clients...");
  interface RawClient {
    client_id: string;
    client_name: string;
    industry: string;
    country: string;
    payment_terms_days: number;
  }
  const rawClients = loadJson<RawClient[]>("clients.json");
  console.log(`   Source records found: ${rawClients.length}`);

  for (const c of rawClients) {
    await prisma.client.upsert({
      where: { id: c.client_id },
      update: {
        clientName: c.client_name,
        industry: c.industry,
        country: c.country,
        paymentTermsDays: c.payment_terms_days,
      },
      create: {
        id: c.client_id,
        clientName: c.client_name,
        industry: c.industry,
        country: c.country,
        paymentTermsDays: c.payment_terms_days,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawClients.length} clients.`);

  // ─────────────────────────────────────────────────────────────
  // 16. Vendors (30 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [16/23] Seeding Vendors...");
  interface RawVendor {
    vendor_id: string;
    vendor_name: string;
    primary_expense_account: number;
    payment_terms_days: number;
    city: string;
    gst_registration: string;
    is_active: string;
  }
  const rawVendors = loadJson<RawVendor[]>("vendors.json");
  console.log(`   Source records found: ${rawVendors.length}`);

  for (const v of rawVendors) {
    await prisma.vendor.upsert({
      where: { id: v.vendor_id },
      update: {
        vendorName: v.vendor_name,
        primaryExpenseAccount: v.primary_expense_account,
        paymentTermsDays: v.payment_terms_days,
        city: v.city,
        gstRegistration: v.gst_registration,
        isActive: v.is_active,
      },
      create: {
        id: v.vendor_id,
        vendorName: v.vendor_name,
        primaryExpenseAccount: v.primary_expense_account,
        paymentTermsDays: v.payment_terms_days,
        city: v.city,
        gstRegistration: v.gst_registration,
        isActive: v.is_active,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawVendors.length} vendors.`);

  // ─────────────────────────────────────────────────────────────
  // 17. Invoices (743 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [17/23] Seeding Invoices (743 records)...");
  interface RawInvoice {
    invoice_id: string;
    invoice_number: string;
    client_id: string;
    invoice_date: string;
    due_date: string;
    service_line_account: number;
    currency: string;
    subtotal: number;
    gst_rate_percent: number;
    gst_amount: number;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    status: string;
    last_payment_date: string | null;
    po_number: string | null;
    carried_in_from_prior_period: string;
    created_by: string;
    created_at: string;
    ledger_entry_id: string | null;
  }
  const rawInvoices = loadJson<RawInvoice[]>("invoices.json");
  console.log(`   Source records found: ${rawInvoices.length}`);

  const invoiceChunks = chunkArray(rawInvoices, 250);
  for (const chunk of invoiceChunks) {
    await prisma.invoice.createMany({
      data: chunk.map((inv) => ({
        id: inv.invoice_id,
        invoiceNumber: inv.invoice_number,
        clientId: inv.client_id,
        invoiceDate: new Date(inv.invoice_date),
        dueDate: new Date(inv.due_date),
        serviceLineAccount: inv.service_line_account,
        currency: inv.currency,
        subtotal: inv.subtotal,
        gstRatePercent: inv.gst_rate_percent,
        gstAmount: inv.gst_amount,
        totalAmount: inv.total_amount,
        amountPaid: inv.amount_paid,
        balanceDue: inv.balance_due,
        status: inv.status,
        lastPaymentDate: inv.last_payment_date ? new Date(inv.last_payment_date) : null,
        poNumber: inv.po_number,
        carriedInFromPriorPeriod: inv.carried_in_from_prior_period,
        createdBy: inv.created_by,
        createdAtSource: new Date(inv.created_at),
        ledgerEntryId: inv.ledger_entry_id,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawInvoices.length} invoices.`);

  // ─────────────────────────────────────────────────────────────
  // 18. Expenses (501 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [18/23] Seeding Expenses (501 records)...");
  interface RawExpense {
    expense_id: string;
    expense_date: string;
    category_account: number;
    vendor_id: string;
    bill_reference: string;
    description: string;
    department_id: string;
    amount_excl_gst: number;
    gst_rate_percent: number;
    gst_amount: number;
    total_amount: number;
    due_date: string;
    paid_date: string | null;
    status: string;
    payment_mode: string | null;
    submitted_by: string;
    approved_by: string;
    ledger_entry_id: string;
    payment_ledger_entry_id: string | null;
  }
  const rawExpenses = loadJson<RawExpense[]>("expenses.json");
  console.log(`   Source records found: ${rawExpenses.length}`);

  const expenseChunks = chunkArray(rawExpenses, 250);
  for (const chunk of expenseChunks) {
    await prisma.expense.createMany({
      data: chunk.map((exp) => ({
        id: exp.expense_id,
        expenseDate: new Date(exp.expense_date),
        categoryAccount: exp.category_account,
        vendorId: exp.vendor_id,
        billReference: exp.bill_reference,
        description: exp.description,
        departmentId: exp.department_id,
        amountExclGst: exp.amount_excl_gst,
        gstRatePercent: exp.gst_rate_percent,
        gstAmount: exp.gst_amount,
        totalAmount: exp.total_amount,
        dueDate: new Date(exp.due_date),
        paidDate: exp.paid_date ? new Date(exp.paid_date) : null,
        status: exp.status,
        paymentMode: exp.payment_mode,
        submittedBy: exp.submitted_by,
        approvedBy: exp.approved_by,
        ledgerEntryId: exp.ledger_entry_id,
        paymentLedgerEntryId: exp.payment_ledger_entry_id,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawExpenses.length} expenses.`);

  // ─────────────────────────────────────────────────────────────
  // 19. Announcements (8 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [19/23] Seeding Announcements...");
  interface RawAnnouncement {
    announcement_id?: string;
    title?: string;
    body?: string;
    category?: string;
    posted_on?: string;
  }
  const rawAnnouncements = loadJson<RawAnnouncement[]>("announcements.json");
  console.log(`   Source records found: ${rawAnnouncements.length}`);

  let validCount = 0;
  let rejectedCount = 0;

  for (const a of rawAnnouncements) {
    if (!a.announcement_id || !a.title || !a.body || !a.category || !a.posted_on) {
      console.warn(`   ⚠️ Skipping malformed announcement record: ${JSON.stringify(a)}`);
      rejectedCount++;
      continue;
    }
    const postedDate = new Date(a.posted_on);
    if (isNaN(postedDate.getTime())) {
      console.warn(`   ⚠️ Skipping announcement with invalid date: ${a.posted_on}`);
      rejectedCount++;
      continue;
    }

    await prisma.announcement.upsert({
      where: { id: a.announcement_id },
      update: {
        title: a.title,
        body: a.body,
        category: a.category,
        postedOn: postedDate,
      },
      create: {
        id: a.announcement_id,
        title: a.title,
        body: a.body,
        category: a.category,
        postedOn: postedDate,
      },
    });
    validCount++;
  }
  console.log(`   ✓ Seeded ${validCount} announcements (${rejectedCount} rejected).`);

  // ─────────────────────────────────────────────────────────────
  // 20. HR FAQ (30 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [20/23] Seeding HR FAQ...");
  interface RawFaq {
    faq_id: string;
    question: string;
    answer: string;
    category: string;
    policy_source: string;
  }
  const rawFaqs = loadJson<RawFaq[]>("hr_faq.json");
  console.log(`   Source records found: ${rawFaqs.length}`);

  for (const f of rawFaqs) {
    await prisma.hrFaq.upsert({
      where: { id: f.faq_id },
      update: {
        question: f.question,
        answer: f.answer,
        category: f.category,
        policySource: f.policy_source,
      },
      create: {
        id: f.faq_id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        policySource: f.policy_source,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawFaqs.length} HR FAQs.`);

  // ─────────────────────────────────────────────────────────────
  // 21. Chatbot Responses (33 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [21/23] Seeding Chatbot Responses...");
  interface RawChatbotResponse {
    intent: string;
    response_template: string;
    requires_login: string;
    allowed_roles: string;
    backend_or_service_call: string | null;
    on_failure: string | null;
    policy_note: string | null;
  }
  const rawChatbotResponses = loadJson<RawChatbotResponse[]>("chatbot_responses.json");
  console.log(`   Source records found: ${rawChatbotResponses.length}`);

  for (const cb of rawChatbotResponses) {
    await prisma.chatbotResponse.upsert({
      where: { intent: cb.intent },
      update: {
        responseTemplate: cb.response_template,
        requiresLogin: cb.requires_login,
        allowedRoles: cb.allowed_roles,
        backendOrServiceCall: cb.backend_or_service_call,
        onFailure: cb.on_failure,
        policyNote: cb.policy_note,
      },
      create: {
        intent: cb.intent,
        responseTemplate: cb.response_template,
        requiresLogin: cb.requires_login,
        allowedRoles: cb.allowed_roles,
        backendOrServiceCall: cb.backend_or_service_call,
        onFailure: cb.on_failure,
        policyNote: cb.policy_note,
      },
    });
  }
  console.log(`   ✓ Seeded ${rawChatbotResponses.length} chatbot responses.`);

  // ─────────────────────────────────────────────────────────────
  // 22. AI Anomaly Results (405 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [22/23] Seeding AI Anomaly Results (405 records)...");
  interface RawAnomaly {
    result_id: string;
    source_dataset: string;
    record_id: string;
    employee_id: string;
    period: string;
    anomaly_score: number;
    flagged: string;
    reason_code: string;
    reason_text: string;
    money_at_risk: number | null;
    model_version: string;
    scored_at: string;
  }
  const rawAnomalies = loadJson<RawAnomaly[]>("ai_anomaly_results.json");
  console.log(`   Source records found: ${rawAnomalies.length}`);

  const anomalyChunks = chunkArray(rawAnomalies, 200);
  for (const chunk of anomalyChunks) {
    await prisma.aiAnomalyResult.createMany({
      data: chunk.map((an) => ({
        id: an.result_id,
        sourceDataset: an.source_dataset,
        recordId: an.record_id,
        employeeId: an.employee_id,
        period: new Date(an.period),
        anomalyScore: an.anomaly_score,
        flagged: an.flagged,
        reasonCode: an.reason_code,
        reasonText: an.reason_text,
        moneyAtRisk: an.money_at_risk,
        modelVersion: an.model_version,
        scoredAt: new Date(an.scored_at),
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawAnomalies.length} AI anomaly results.`);

  // ─────────────────────────────────────────────────────────────
  // 23. AI Attrition Risk (430 records)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [23/23] Seeding AI Attrition Risk (430 records)...");
  interface RawAttrition {
    prediction_id: string;
    employee_id: string;
    department_id: string;
    as_of_date: string;
    risk_score_12m: number;
    risk_band: string;
    top_reason_1: string;
    top_reason_2: string;
    top_reason_3: string;
    model_version: string;
    model_note: string;
  }
  const rawAttrition = loadJson<RawAttrition[]>("ai_attrition_risk.json");
  console.log(`   Source records found: ${rawAttrition.length}`);

  const attritionChunks = chunkArray(rawAttrition, 200);
  for (const chunk of attritionChunks) {
    await prisma.aiAttritionRisk.createMany({
      data: chunk.map((ar) => ({
        id: ar.prediction_id,
        employeeId: ar.employee_id,
        departmentId: ar.department_id,
        asOfDate: new Date(ar.as_of_date),
        riskScore12m: ar.risk_score_12m,
        riskBand: ar.risk_band,
        topReason1: ar.top_reason_1,
        topReason2: ar.top_reason_2,
        topReason3: ar.top_reason_3,
        modelVersion: ar.model_version,
        modelNote: ar.model_note,
      })),
    });
  }
  console.log(`   ✓ Seeded ${rawAttrition.length} AI attrition risk predictions.`);

  // ─────────────────────────────────────────────────────────────
  // Verification Summary
  // ─────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.department.count(),
    prisma.role.count(),
    prisma.employee.count(),
    prisma.user.count(),
    prisma.payrollRun.count(),
    prisma.payslip.count(),
    prisma.leaveType.count(),
    prisma.leaveBalance.count(),
    prisma.leaveRequest.count(),
    prisma.holiday.count(),
    prisma.attendanceMonthly.count(),
    prisma.team.count(),
    prisma.sprint.count(),
    prisma.task.count(),
    prisma.client.count(),
    prisma.vendor.count(),
    prisma.invoice.count(),
    prisma.expense.count(),
    prisma.announcement.count(),
    prisma.hrFaq.count(),
    prisma.chatbotResponse.count(),
    prisma.aiAnomalyResult.count(),
    prisma.aiAttritionRisk.count(),
  ]);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n=================================================================");
  console.log("       DATABASE SEED SUMMARY — ALL 23 DATASETS                   ");
  console.log("=================================================================");
  console.log(`  1. departments:          ${counts[0]} / 11`);
  console.log(`  2. roles:                ${counts[1]} / 58`);
  console.log(`  3. employees:            ${counts[2]} / 441`);
  console.log(`  4. users (auth):         ${counts[3]} / 8 (4 data pack + 4 test accounts)`);
  console.log(`  5. payroll_runs:         ${counts[4]} / 18`);
  console.log(`  6. payslips:             ${counts[5]} / 2,469`);
  console.log(`  7. leave_types:          ${counts[6]} / 6`);
  console.log(`  8. leave_balances:       ${counts[7]} / 441`);
  console.log(`  9. leave_requests:       ${counts[8]} / 2,183`);
  console.log(` 10. holidays:             ${counts[9]} / 19`);
  console.log(` 11. attendance_monthly:   ${counts[10]} / 2,469`);
  console.log(` 12. teams:                ${counts[11]} / 16`);
  console.log(` 13. sprints:              ${counts[12]} / 38`);
  console.log(` 14. tasks:                ${counts[13]} / 4,844`);
  console.log(` 15. clients:              ${counts[14]} / 28`);
  console.log(` 16. vendors:              ${counts[15]} / 30`);
  console.log(` 17. invoices:             ${counts[16]} / 743`);
  console.log(` 18. expenses:             ${counts[17]} / 501`);
  console.log(` 19. announcements:        ${counts[18]} / 8`);
  console.log(` 20. hr_faqs:              ${counts[19]} / 30`);
  console.log(` 21. chatbot_responses:    ${counts[20]} / 33`);
  console.log(` 22. ai_anomaly_results:   ${counts[21]} / 405`);
  console.log(` 23. ai_attrition_risk:    ${counts[22]} / 430`);
  console.log("-----------------------------------------------------------------");
  const totalDbRecords = counts.reduce((sum, c) => sum + c, 0);
  console.log(`  TOTAL DATABASE RECORDS:  ${totalDbRecords} records seeded in ${durationSec}s`);
  console.log("=================================================================\n");
}

async function main() {
  try {
    await seedDataPack();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
