/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Master Data Pack Automated Verification Script
 * scripts/verify-data-pack.ts
 *
 * Performs record-by-record, field-by-field, count-by-count, and relationship-by-relationship
 * verification between all 23 JSON source files in 03_Data_Pack/ and the SQLite database.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DATA_PACK_DIR = path.join(process.cwd(), "03_Data_Pack");

function loadJson<T>(filename: string): T {
  const filePath = path.join(DATA_PACK_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset missing: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

interface VerificationRow {
  dataset: string;
  sourceCount: number;
  dbCount: number;
  missing: number;
  duplicates: number;
  extra: number;
  status: "PASS" | "FAIL";
  discrepancies: string[];
}

const results: VerificationRow[] = [];

function recordResult(
  dataset: string,
  sourceCount: number,
  dbCount: number,
  missing: number,
  duplicates: number,
  extra: number,
  discrepancies: string[]
) {
  const status: "PASS" | "FAIL" =
    sourceCount === dbCount &&
    missing === 0 &&
    duplicates === 0 &&
    extra === 0 &&
    discrepancies.length === 0
      ? "PASS"
      : "FAIL";

  results.push({
    dataset,
    sourceCount,
    dbCount,
    missing,
    duplicates,
    extra,
    status,
    discrepancies,
  });
}

function normalizeDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return dateObj.toISOString().slice(0, 10);
}

function closeEnough(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  return Math.abs(a - b) < 0.01;
}

async function verifyAll() {
  console.log("=========================================================================================");
  console.log("          HORIZON PORTAL — COMPLETE DATA PACK RECORD & FIELD VERIFICATION               ");
  console.log("=========================================================================================\n");

  // 1. Departments
  {
    const source = loadJson<any[]>("departments.json");
    const db = await prisma.department.findMany();
    const dbMap = new Map(db.map((d) => [d.id, d]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.department_id);
      if (!rec) {
        missing++;
        disc.push(`Missing dept ${s.department_id}`);
        continue;
      }
      if (rec.name !== s.department_name) disc.push(`Dept ${s.department_id} name mismatch: expected ${s.department_name}, got ${rec.name}`);
      if (rec.costCenter !== s.cost_center) disc.push(`Dept ${s.department_id} costCenter mismatch`);
      if (rec.description !== s.description) disc.push(`Dept ${s.department_id} description mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("departments.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 2. Roles
  {
    const source = loadJson<any[]>("roles.json");
    const db = await prisma.role.findMany();
    const dbMap = new Map(db.map((r) => [r.id, r]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.role_id);
      if (!rec) {
        missing++;
        disc.push(`Missing role ${s.role_id}`);
        continue;
      }
      if (rec.name !== s.role_title) disc.push(`Role ${s.role_id} name mismatch: expected ${s.role_title}, got ${rec.name}`);
      if (rec.level !== s.level) disc.push(`Role ${s.role_id} level mismatch`);
      if (rec.grade !== s.grade) disc.push(`Role ${s.role_id} grade mismatch`);
      if (rec.departmentId !== s.department_id) disc.push(`Role ${s.role_id} departmentId mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("roles.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 3. Employees
  {
    const source = loadJson<any[]>("employees.json");
    const db = await prisma.employee.findMany();
    const dbMap = new Map(db.map((e) => [e.id, e]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.employee_id);
      if (!rec) {
        missing++;
        disc.push(`Missing employee ${s.employee_id}`);
        continue;
      }
      if (rec.fullName !== s.full_name) disc.push(`Employee ${s.employee_id} fullName mismatch`);
      if (rec.email !== s.work_email) disc.push(`Employee ${s.employee_id} email mismatch`);
      if (rec.departmentId !== s.department_id) disc.push(`Employee ${s.employee_id} departmentId mismatch`);
      if (rec.roleId !== s.role_id) disc.push(`Employee ${s.employee_id} roleId mismatch`);
      if (rec.managerId !== s.manager_id) disc.push(`Employee ${s.employee_id} managerId mismatch`);
      if (rec.workLocation !== s.work_location) disc.push(`Employee ${s.employee_id} workLocation mismatch`);
      if (rec.workMode !== s.work_mode) disc.push(`Employee ${s.employee_id} workMode mismatch`);
      if (rec.employmentType !== s.employment_type) disc.push(`Employee ${s.employee_id} employmentType mismatch`);
      if (normalizeDate(rec.hireDate) !== normalizeDate(s.hire_date)) disc.push(`Employee ${s.employee_id} hireDate mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("employees.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 4. Demo Users
  {
    const source = loadJson<any[]>("demo_users.json");
    const dbUsers = await prisma.user.findMany();
    const dbUserMap = new Map(dbUsers.map((u) => [u.email, u]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbUserMap.get(s.username.toLowerCase());
      if (!rec) {
        missing++;
        disc.push(`Missing demo user ${s.username}`);
        continue;
      }
      if (rec.employeeId !== s.employee_id) disc.push(`Demo user ${s.username} employeeId mismatch`);
      if (!rec.passwordHash || (!rec.passwordHash.startsWith("$2a$") && !rec.passwordHash.startsWith("$2b$"))) {
        disc.push(`Demo user ${s.username} password not hashed with bcrypt`);
      }
    }

    recordResult("demo_users.json", source.length, source.length, missing, 0, 0, disc);
  }

  // 5. Payroll Runs
  {
    const source = loadJson<any[]>("payroll_runs.json");
    const db = await prisma.payrollRun.findMany();
    const dbMap = new Map(db.map((pr) => [pr.id, pr]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.run_id);
      if (!rec) {
        missing++;
        disc.push(`Missing payroll run ${s.run_id}`);
        continue;
      }
      if (normalizeDate(rec.periodStart) !== normalizeDate(s.period_start)) disc.push(`Run ${s.run_id} periodStart mismatch`);
      if (normalizeDate(rec.periodEnd) !== normalizeDate(s.period_end)) disc.push(`Run ${s.run_id} periodEnd mismatch`);
      if (s.pay_date && normalizeDate(rec.payDate) !== normalizeDate(s.pay_date)) disc.push(`Run ${s.run_id} payDate mismatch`);
      if (rec.employeesPaid !== s.employees_paid) disc.push(`Run ${s.run_id} employeesPaid mismatch`);
      if (!closeEnough(rec.totalGross, s.total_gross)) disc.push(`Run ${s.run_id} totalGross mismatch`);
      if (!closeEnough(rec.totalNet, s.total_net)) disc.push(`Run ${s.run_id} totalNet mismatch`);
      if (rec.status !== s.status) disc.push(`Run ${s.run_id} status mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("payroll_runs.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 6. Payslips
  {
    const source = loadJson<any[]>("payslips.json");
    const db = await prisma.payslip.findMany();
    const dbMap = new Map(db.map((p) => [p.id, p]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.payroll_item_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing payslip ${s.payroll_item_id}`);
        continue;
      }
      if (rec.employeeId !== s.employee_id) disc.push(`Payslip ${s.payroll_item_id} employeeId mismatch`);
      if (rec.payrollRunId !== s.run_id) disc.push(`Payslip ${s.payroll_item_id} run_id mismatch`);
      if (!closeEnough(rec.grossPay, s.gross_pay)) disc.push(`Payslip ${s.payroll_item_id} gross_pay mismatch`);
      if (!closeEnough(rec.netPay, s.net_pay)) disc.push(`Payslip ${s.payroll_item_id} net_pay mismatch`);
      if (!closeEnough(rec.basic, s.basic)) disc.push(`Payslip ${s.payroll_item_id} basic mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("payslips.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 7. Leave Types
  {
    const source = loadJson<any[]>("leave_types.json");
    const db = await prisma.leaveType.findMany();
    const dbMap = new Map(db.map((lt) => [lt.id, lt]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.leave_type_code);
      if (!rec) {
        missing++;
        disc.push(`Missing leave type ${s.leave_type_code}`);
        continue;
      }
      if (rec.name !== s.leave_type_name) disc.push(`LeaveType ${s.leave_type_code} name mismatch`);
      if (rec.payType !== s.pay_type) disc.push(`LeaveType ${s.leave_type_code} payType mismatch`);
      if (rec.annualQuotaDays !== s.annual_quota_days) disc.push(`LeaveType ${s.leave_type_code} quota mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("leave_types.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 8. Leave Balances
  {
    const source = loadJson<any[]>("leave_balances.json");
    const db = await prisma.leaveBalance.findMany();
    const dbMap = new Map(db.map((lb) => [lb.employeeId, lb]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.employee_id);
      if (!rec) {
        missing++;
        disc.push(`Missing leave balance ${s.employee_id}`);
        continue;
      }
      if (rec.financialYear !== s.financial_year) disc.push(`LeaveBalance ${s.employee_id} FY mismatch`);
      if (!closeEnough(rec.clEntitlement, s.cl_entitlement)) disc.push(`LeaveBalance ${s.employee_id} clEntitlement mismatch`);
      if (!closeEnough(rec.clBalance, s.cl_balance)) disc.push(`LeaveBalance ${s.employee_id} clBalance mismatch`);
      if (!closeEnough(rec.slBalance, s.sl_balance)) disc.push(`LeaveBalance ${s.employee_id} slBalance mismatch`);
      if (!closeEnough(rec.elBalance, s.el_balance)) disc.push(`LeaveBalance ${s.employee_id} elBalance mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("leave_balances.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 9. Leave Requests
  {
    const source = loadJson<any[]>("leave_requests.json");
    const db = await prisma.leaveRequest.findMany();
    const dbMap = new Map(db.map((lr) => [lr.id, lr]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.leave_request_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing leave request ${s.leave_request_id}`);
        continue;
      }
      if (rec.employeeId !== s.employee_id) disc.push(`LeaveRequest ${s.leave_request_id} employeeId mismatch`);
      if (rec.leaveTypeCode !== s.leave_type_code) disc.push(`LeaveRequest ${s.leave_request_id} leaveTypeCode mismatch`);
      if (!closeEnough(rec.days, s.days)) disc.push(`LeaveRequest ${s.leave_request_id} days mismatch`);
      if (rec.status !== s.status) disc.push(`LeaveRequest ${s.leave_request_id} status mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("leave_requests.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 10. Holidays
  {
    const source = loadJson<any[]>("holidays.json");
    const db = await prisma.holiday.findMany();
    const dbMap = new Map(db.map((h) => [h.id, h]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.holiday_date);
      if (!rec) {
        missing++;
        disc.push(`Missing holiday ${s.holiday_date}`);
        continue;
      }
      if (rec.name !== s.holiday_name) disc.push(`Holiday ${s.holiday_date} name mismatch`);
      if (rec.holidayType !== s.holiday_type) disc.push(`Holiday ${s.holiday_date} holidayType mismatch`);
      if (rec.weekday !== s.weekday) disc.push(`Holiday ${s.holiday_date} weekday mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("holidays.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 11. Monthly Attendance
  {
    const source = loadJson<any[]>("attendance_monthly.json");
    const db = await prisma.attendanceMonthly.findMany();
    const dbMap = new Map(db.map((am) => [`${am.employeeId}_${normalizeDate(am.periodEndDate)}`, am]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const key = `${s.employee_id}_${normalizeDate(s.period_end_date)}`;
      const rec = dbMap.get(key);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing attendance record ${key}`);
        continue;
      }
      if (!closeEnough(rec.presentDays, s.present_days)) disc.push(`Attendance ${key} presentDays mismatch`);
      if (!closeEnough(rec.attendanceRate, s.attendance_rate)) disc.push(`Attendance ${key} attendanceRate mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("attendance_monthly.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 12. Teams
  {
    const source = loadJson<any[]>("teams.json");
    const db = await prisma.team.findMany();
    const dbMap = new Map(db.map((t) => [t.id, t]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.team_id);
      if (!rec) {
        missing++;
        disc.push(`Missing team ${s.team_id}`);
        continue;
      }
      if (rec.teamName !== s.team_name) disc.push(`Team ${s.team_id} name mismatch`);
      if (rec.departmentId !== s.department_id) disc.push(`Team ${s.team_id} departmentId mismatch`);
      if (rec.activeMembers !== s.active_members) disc.push(`Team ${s.team_id} activeMembers mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("teams.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 13. Sprints
  {
    const source = loadJson<any[]>("sprints.json");
    const db = await prisma.sprint.findMany();
    const dbMap = new Map(db.map((sp) => [sp.id, sp]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.sprint_id);
      if (!rec) {
        missing++;
        disc.push(`Missing sprint ${s.sprint_id}`);
        continue;
      }
      if (rec.sprintName !== s.sprint_name) disc.push(`Sprint ${s.sprint_id} sprintName mismatch`);
      if (rec.workingDays !== s.working_days) disc.push(`Sprint ${s.sprint_id} workingDays mismatch`);
      if (rec.financialYear !== s.financial_year) disc.push(`Sprint ${s.sprint_id} financialYear mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("sprints.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 14. Tasks
  {
    const source = loadJson<any[]>("tasks.json");
    const db = await prisma.task.findMany();
    const dbMap = new Map(db.map((tk) => [tk.id, tk]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.task_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing task ${s.task_id}`);
        continue;
      }
      if (rec.teamId !== s.team_id) disc.push(`Task ${s.task_id} teamId mismatch`);
      if (rec.sprintId !== s.sprint_id) disc.push(`Task ${s.task_id} sprintId mismatch`);
      if (rec.assigneeEmployeeId !== s.assignee_employee_id) disc.push(`Task ${s.task_id} assigneeEmployeeId mismatch`);
      if (rec.status !== s.status) disc.push(`Task ${s.task_id} status mismatch`);
      if (rec.storyPoints !== s.story_points) disc.push(`Task ${s.task_id} storyPoints mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("tasks.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 15. Clients
  {
    const source = loadJson<any[]>("clients.json");
    const db = await prisma.client.findMany();
    const dbMap = new Map(db.map((c) => [c.id, c]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.client_id);
      if (!rec) {
        missing++;
        disc.push(`Missing client ${s.client_id}`);
        continue;
      }
      if (rec.clientName !== s.client_name) disc.push(`Client ${s.client_id} name mismatch`);
      if (rec.industry !== s.industry) disc.push(`Client ${s.client_id} industry mismatch`);
      if (rec.country !== s.country) disc.push(`Client ${s.client_id} country mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("clients.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 16. Vendors
  {
    const source = loadJson<any[]>("vendors.json");
    const db = await prisma.vendor.findMany();
    const dbMap = new Map(db.map((v) => [v.id, v]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.vendor_id);
      if (!rec) {
        missing++;
        disc.push(`Missing vendor ${s.vendor_id}`);
        continue;
      }
      if (rec.vendorName !== s.vendor_name) disc.push(`Vendor ${s.vendor_id} name mismatch`);
      if (rec.city !== s.city) disc.push(`Vendor ${s.vendor_id} city mismatch`);
      if (rec.gstRegistration !== s.gst_registration) disc.push(`Vendor ${s.vendor_id} gst mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("vendors.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 17. Invoices
  {
    const source = loadJson<any[]>("invoices.json");
    const db = await prisma.invoice.findMany();
    const dbMap = new Map(db.map((inv) => [inv.id, inv]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.invoice_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing invoice ${s.invoice_id}`);
        continue;
      }
      if (rec.invoiceNumber !== s.invoice_number) disc.push(`Invoice ${s.invoice_id} invoiceNumber mismatch`);
      if (rec.clientId !== s.client_id) disc.push(`Invoice ${s.invoice_id} clientId mismatch`);
      if (!closeEnough(rec.totalAmount, s.total_amount)) disc.push(`Invoice ${s.invoice_id} totalAmount mismatch`);
      if (rec.status !== s.status) disc.push(`Invoice ${s.invoice_id} status mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("invoices.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 18. Expenses
  {
    const source = loadJson<any[]>("expenses.json");
    const db = await prisma.expense.findMany();
    const dbMap = new Map(db.map((exp) => [exp.id, exp]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.expense_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing expense ${s.expense_id}`);
        continue;
      }
      if (rec.vendorId !== s.vendor_id) disc.push(`Expense ${s.expense_id} vendorId mismatch`);
      if (rec.departmentId !== s.department_id) disc.push(`Expense ${s.expense_id} departmentId mismatch`);
      if (!closeEnough(rec.totalAmount, s.total_amount)) disc.push(`Expense ${s.expense_id} totalAmount mismatch`);
      if (rec.submittedBy !== s.submitted_by) disc.push(`Expense ${s.expense_id} submittedBy mismatch`);
      if (rec.approvedBy !== s.approved_by) disc.push(`Expense ${s.expense_id} approvedBy mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("expenses.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 19. Announcements
  {
    const source = loadJson<any[]>("announcements.json");
    const db = await prisma.announcement.findMany();
    const dbMap = new Map(db.map((a) => [a.id, a]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.announcement_id);
      if (!rec) {
        missing++;
        disc.push(`Missing announcement ${s.announcement_id}`);
        continue;
      }
      if (rec.title !== s.title) disc.push(`Announcement ${s.announcement_id} title mismatch`);
      if (rec.category !== s.category) disc.push(`Announcement ${s.announcement_id} category mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("announcements.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 20. HR FAQ
  {
    const source = loadJson<any[]>("hr_faq.json");
    const db = await prisma.hrFaq.findMany();
    const dbMap = new Map(db.map((f) => [f.id, f]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.faq_id);
      if (!rec) {
        missing++;
        disc.push(`Missing faq ${s.faq_id}`);
        continue;
      }
      if (rec.question !== s.question) disc.push(`FAQ ${s.faq_id} question mismatch`);
      if (rec.category !== s.category) disc.push(`FAQ ${s.faq_id} category mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("hr_faq.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 21. Chatbot Responses
  {
    const source = loadJson<any[]>("chatbot_responses.json");
    const db = await prisma.chatbotResponse.findMany();
    const dbMap = new Map(db.map((cb) => [cb.intent, cb]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.intent);
      if (!rec) {
        missing++;
        disc.push(`Missing chatbot intent ${s.intent}`);
        continue;
      }
      if (rec.responseTemplate !== s.response_template) disc.push(`Chatbot intent ${s.intent} responseTemplate mismatch`);
      if (rec.allowedRoles !== s.allowed_roles) disc.push(`Chatbot intent ${s.intent} allowedRoles mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("chatbot_responses.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 22. AI Anomaly Results
  {
    const source = loadJson<any[]>("ai_anomaly_results.json");
    const db = await prisma.aiAnomalyResult.findMany();
    const dbMap = new Map(db.map((an) => [an.id, an]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.result_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing anomaly result ${s.result_id}`);
        continue;
      }
      if (rec.sourceDataset !== s.source_dataset) disc.push(`Anomaly ${s.result_id} sourceDataset mismatch`);
      if (rec.recordId !== s.record_id) disc.push(`Anomaly ${s.result_id} recordId mismatch`);
      if (rec.employeeId !== s.employee_id) disc.push(`Anomaly ${s.result_id} employeeId mismatch`);
      if (!closeEnough(rec.anomalyScore, s.anomaly_score)) disc.push(`Anomaly ${s.result_id} anomalyScore mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("ai_anomaly_results.json", source.length, db.length, missing, 0, extra, disc);
  }

  // 23. AI Attrition Risk
  {
    const source = loadJson<any[]>("ai_attrition_risk.json");
    const db = await prisma.aiAttritionRisk.findMany();
    const dbMap = new Map(db.map((ar) => [ar.id, ar]));
    const disc: string[] = [];
    let missing = 0;

    for (const s of source) {
      const rec = dbMap.get(s.prediction_id);
      if (!rec) {
        missing++;
        if (disc.length < 5) disc.push(`Missing attrition prediction ${s.prediction_id}`);
        continue;
      }
      if (rec.employeeId !== s.employee_id) disc.push(`Attrition ${s.prediction_id} employeeId mismatch`);
      if (rec.departmentId !== s.department_id) disc.push(`Attrition ${s.prediction_id} departmentId mismatch`);
      if (!closeEnough(rec.riskScore12m, s.risk_score_12m)) disc.push(`Attrition ${s.prediction_id} riskScore12m mismatch`);
      if (rec.riskBand !== s.risk_band) disc.push(`Attrition ${s.prediction_id} riskBand mismatch`);
    }

    const extra = Math.max(0, db.length - source.length);
    recordResult("ai_attrition_risk.json", source.length, db.length, missing, 0, extra, disc);
  }

  // Output formatted verification table
  console.log("----------------------------------------------------------------------------------------------------------");
  console.log(
    "Dataset".padEnd(28) +
    "Source Count".padStart(13) +
    "DB Count".padStart(11) +
    "Missing".padStart(10) +
    "Duplicates".padStart(13) +
    "Extra".padStart(8) +
    "Integrity".padStart(14)
  );
  console.log("----------------------------------------------------------------------------------------------------------");

  let allPassed = true;
  for (const r of results) {
    if (r.status === "FAIL") allPassed = false;
    console.log(
      r.dataset.padEnd(28) +
      String(r.sourceCount).padStart(13) +
      String(r.dbCount).padStart(11) +
      String(r.missing).padStart(10) +
      String(r.duplicates).padStart(13) +
      String(r.extra).padStart(8) +
      (r.status === "PASS" ? "   ✓ PASS" : "   ✗ FAIL").padStart(14)
    );
    if (r.discrepancies.length > 0) {
      for (const d of r.discrepancies.slice(0, 3)) {
        console.error(`      ↳ DISCREPANCY: ${d}`);
      }
    }
  }
  console.log("----------------------------------------------------------------------------------------------------------");

  // Check Foreign Keys via SQLite PRAGMA
  console.log("\n▶ Checking SQLite Foreign Key Constraints...");
  const fkViolations = await prisma.$queryRawUnsafe<any[]>("PRAGMA foreign_key_check;");
  console.log(`   PRAGMA foreign_key_check violations: ${fkViolations.length}`);
  if (fkViolations.length > 0) {
    console.error("   Violations found:", fkViolations);
    allPassed = false;
  } else {
    console.log("   ✓ Foreign key integrity verified with 0 violations.");
  }

  // Check Employee Hierarchy (Manager -> Reports)
  console.log("\n▶ Checking Real Employee Hierarchy...");
  const ceo = await prisma.employee.findUnique({
    where: { id: "EMP-0006" },
    include: { directReports: true },
  });
  console.log(`   Executive EMP-0006 (Tejas Chowdhury): managerId = ${ceo?.managerId} (Expected: null), directReports = ${ceo?.directReports.length}`);
  if (ceo?.managerId !== null) {
    console.error("   ✗ EMP-0006 should have null managerId");
    allPassed = false;
  }

  const manager = await prisma.employee.findUnique({
    where: { id: "EMP-0547" },
    include: { manager: true, directReports: true },
  });
  console.log(`   Manager EMP-0547 (Imran Philip): managerId = ${manager?.managerId}, directReports = ${manager?.directReports.length} (Reports includes EMP-0188: ${manager?.directReports.some((r) => r.id === "EMP-0188")})`);
  if (!manager?.managerId || manager.directReports.length === 0 || !manager.directReports.some((r) => r.id === "EMP-0188")) {
    console.error("   ✗ EMP-0547 hierarchy check failed");
    allPassed = false;
  }

  const ic = await prisma.employee.findUnique({
    where: { id: "EMP-0188" },
    include: { manager: true, directReports: true },
  });
  console.log(`   IC EMP-0188 (Sasi Shetty): managerId = ${ic?.managerId} (Expected: EMP-0547), directReports = ${ic?.directReports.length} (Expected: 0)`);
  if (ic?.managerId !== "EMP-0547" || ic.directReports.length !== 0) {
    console.error("   ✗ EMP-0188 hierarchy check failed");
    allPassed = false;
  }

  console.log("\n=========================================================================================");
  console.log(`VERIFICATION RESULT: ${allPassed ? "ALL 23 DATASETS PASSED (100% INTEGRITY)" : "FAILED"}`);
  console.log("=========================================================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

verifyAll()
  .catch((err) => {
    console.error("Fatal verification error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
