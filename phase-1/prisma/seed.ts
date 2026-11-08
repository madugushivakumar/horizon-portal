/**
 * Horizon Portal — Database Seed Script
 * prisma/seed.ts
 *
 * Seeds 25 verified workforce employees across 6 departments with realistic
 * reporting relationships, organizational roles, and the 4 demo users with bcrypt hashes.
 * Ensures strict idempotency (safe to run multiple times).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface DemoUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "Admin" | "HR" | "Manager" | "Employee";
  employee_id?: string;
  is_active?: boolean;
}

const VALID_ROLES = ["Admin", "HR", "Manager", "Employee"] as const;

async function seedDatabase() {
  console.log("\n🌱 Seeding Horizon Portal database with departments, roles, employees, and demo users...");

  // ── 1. Departments (6 Core Departments) ───────────────────────
  const departments = [
    {
      id: "DEPT-ADM",
      name: "Administration & Executive",
      code: "ADM",
      description: "Executive leadership, legal governance, and operations",
    },
    {
      id: "DEPT-HR",
      name: "Human Resources",
      code: "HR",
      description: "People operations, talent acquisition, and workforce culture",
    },
    {
      id: "DEPT-ENG",
      name: "Engineering & Operations",
      code: "ENG",
      description: "Core software engineering, cloud infrastructure, and security",
    },
    {
      id: "DEPT-PROD",
      name: "Product Management",
      code: "PROD",
      description: "Product strategy, roadmap planning, and feature lifecycle",
    },
    {
      id: "DEPT-DES",
      name: "Design & UX",
      code: "DES",
      description: "Product design, user experience research, and design systems",
    },
    {
      id: "DEPT-FIN",
      name: "Finance & Accounting",
      code: "FIN",
      description: "Corporate finance, payroll operations, and financial auditing",
    },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: { name: d.name, code: d.code, description: d.description },
      create: d,
    });
  }

  // ── 2. Organizational Roles ───────────────────────────────────
  const roles = [
    { id: "ROLE-ADM", name: "System Administrator", description: "Full administrative and security privileges" },
    { id: "ROLE-HR", name: "HR Lead", description: "Human resources director and policy management" },
    { id: "ROLE-MGR", name: "Engineering Manager", description: "Software team leadership and sprint reviews" },
    { id: "ROLE-EMP", name: "Senior Software Engineer", description: "Core platform and API engineering" },
    { id: "ROLE-STAFF-SWE", name: "Staff Backend Engineer", description: "Distributed systems and data architecture" },
    { id: "ROLE-DEVOPS", name: "DevOps & Infrastructure Lead", description: "Cloud reliability and CI/CD pipelines" },
    { id: "ROLE-FSD", name: "Full Stack Developer", description: "Web UI and application services" },
    { id: "ROLE-QA", name: "QA Automation Engineer", description: "Quality assurance and testing automation" },
    { id: "ROLE-PROD-DIR", name: "Head of Product", description: "Product division leadership and roadmap" },
    { id: "ROLE-SR-PM", name: "Senior Product Manager", description: "Workforce platform feature management" },
    { id: "ROLE-DES-DIR", name: "Design Director", description: "Design vision and brand coherence" },
    { id: "ROLE-PRIN-DES", name: "Principal UI/UX Designer", description: "Design systems and design architecture" },
    { id: "ROLE-PROD-DES", name: "Product Designer", description: "Interactive workflows and component mockups" },
    { id: "ROLE-FIN-DIR", name: "Finance Director", description: "Financial governance and compliance" },
    { id: "ROLE-PAYROLL", name: "Senior Payroll Specialist", description: "Payroll execution and tax calculations" },
    { id: "ROLE-HR-SPEC", name: "Talent Acquisition Specialist", description: "Recruiting pipelines and interviews" },
    { id: "ROLE-OPS-ANL", name: "Operations Analyst", description: "Corporate business operations and reporting" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { name: r.name, description: r.description },
      create: r,
    });
  }

  // ── 3. Employees (25 Verified Records with Hierarchy) ──────────
  const employees = [
    // Executive / Administration (Level 1)
    {
      id: "EMP-001",
      firstName: "Alexander",
      lastName: "Wright",
      email: "alexander.wright@growmar.com",
      phone: "+1 (555) 019-2831",
      departmentId: "DEPT-ADM",
      roleId: "ROLE-ADM",
      managerId: null, // Top-level executive
      salary: 145000,
      hireDate: new Date("2022-01-15"),
      status: "Active",
    },
    // Human Resources Management (Level 2)
    {
      id: "EMP-002",
      firstName: "Eleanor",
      lastName: "Vance",
      email: "eleanor.vance@growmar.com",
      phone: "+1 (555) 019-2832",
      departmentId: "DEPT-HR",
      roleId: "ROLE-HR",
      managerId: "EMP-001",
      salary: 115000,
      hireDate: new Date("2022-03-01"),
      status: "Active",
    },
    // Engineering Management (Level 2)
    {
      id: "EMP-003",
      firstName: "Marcus",
      lastName: "Brody",
      email: "marcus.brody@growmar.com",
      phone: "+1 (555) 019-2833",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-MGR",
      managerId: "EMP-001",
      salary: 130000,
      hireDate: new Date("2022-04-15"),
      status: "Active",
    },
    // Engineering Team Reports (Level 3 under Marcus Brody)
    {
      id: "EMP-004",
      firstName: "Sophie",
      lastName: "Chen",
      email: "sophie.chen@growmar.com",
      phone: "+1 (555) 019-2834",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-EMP",
      managerId: "EMP-003",
      salary: 98000,
      hireDate: new Date("2023-01-10"),
      status: "Active",
    },
    // HR Reports (under Eleanor Vance)
    {
      id: "EMP-005",
      firstName: "Lucas",
      lastName: "Meyer",
      email: "lucas.meyer@growmar.com",
      phone: "+1 (555) 019-2835",
      departmentId: "DEPT-HR",
      roleId: "ROLE-HR-SPEC",
      managerId: "EMP-002",
      salary: 78000,
      hireDate: new Date("2023-05-12"),
      status: "Active",
    },
    {
      id: "EMP-006",
      firstName: "Chloe",
      lastName: "Bennett",
      email: "chloe.bennett@growmar.com",
      phone: "+1 (555) 019-2836",
      departmentId: "DEPT-HR",
      roleId: "ROLE-HR-SPEC",
      managerId: "EMP-002",
      salary: 74000,
      hireDate: new Date("2023-08-20"),
      status: "Active",
    },
    // Engineering Staff (under Marcus Brody)
    {
      id: "EMP-007",
      firstName: "Ethan",
      lastName: "Davies",
      email: "ethan.davies@growmar.com",
      phone: "+1 (555) 019-2837",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-STAFF-SWE",
      managerId: "EMP-003",
      salary: 122000,
      hireDate: new Date("2022-06-15"),
      status: "Active",
    },
    {
      id: "EMP-008",
      firstName: "Maya",
      lastName: "Lin",
      email: "maya.lin@growmar.com",
      phone: "+1 (555) 019-2838",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-DEVOPS",
      managerId: "EMP-003",
      salary: 110000,
      hireDate: new Date("2022-09-01"),
      status: "Active",
    },
    {
      id: "EMP-009",
      firstName: "Liam",
      lastName: "Johnson",
      email: "liam.johnson@growmar.com",
      phone: "+1 (555) 019-2839",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-FSD",
      managerId: "EMP-003",
      salary: 89000,
      hireDate: new Date("2023-02-18"),
      status: "Active",
    },
    {
      id: "EMP-010",
      firstName: "Zoe",
      lastName: "Martinez",
      email: "zoe.martinez@growmar.com",
      phone: "+1 (555) 019-2840",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-QA",
      managerId: "EMP-003",
      salary: 82000,
      hireDate: new Date("2023-06-01"),
      status: "Active",
    },
    // Product Management Division
    {
      id: "EMP-011",
      firstName: "David",
      lastName: "Kim",
      email: "david.kim@growmar.com",
      phone: "+1 (555) 019-2841",
      departmentId: "DEPT-PROD",
      roleId: "ROLE-PROD-DIR",
      managerId: "EMP-001",
      salary: 138000,
      hireDate: new Date("2022-05-10"),
      status: "Active",
    },
    {
      id: "EMP-012",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.jenkins@growmar.com",
      phone: "+1 (555) 019-2842",
      departmentId: "DEPT-PROD",
      roleId: "ROLE-SR-PM",
      managerId: "EMP-011",
      salary: 108000,
      hireDate: new Date("2023-03-15"),
      status: "Active",
    },
    {
      id: "EMP-013",
      firstName: "Ryan",
      lastName: "Patel",
      email: "ryan.patel@growmar.com",
      phone: "+1 (555) 019-2843",
      departmentId: "DEPT-PROD",
      roleId: "ROLE-SR-PM",
      managerId: "EMP-011",
      salary: 95000,
      hireDate: new Date("2023-09-01"),
      status: "Active",
    },
    // Design Division
    {
      id: "EMP-014",
      firstName: "Olivia",
      lastName: "Taylor",
      email: "olivia.taylor@growmar.com",
      phone: "+1 (555) 019-2844",
      departmentId: "DEPT-DES",
      roleId: "ROLE-DES-DIR",
      managerId: "EMP-001",
      salary: 128000,
      hireDate: new Date("2022-07-01"),
      status: "Active",
    },
    {
      id: "EMP-015",
      firstName: "Noah",
      lastName: "Clark",
      email: "noah.clark@growmar.com",
      phone: "+1 (555) 019-2845",
      departmentId: "DEPT-DES",
      roleId: "ROLE-PRIN-DES",
      managerId: "EMP-014",
      salary: 112000,
      hireDate: new Date("2022-10-15"),
      status: "Active",
    },
    {
      id: "EMP-016",
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma.wilson@growmar.com",
      phone: "+1 (555) 019-2846",
      departmentId: "DEPT-DES",
      roleId: "ROLE-PROD-DES",
      managerId: "EMP-014",
      salary: 86000,
      hireDate: new Date("2023-04-01"),
      status: "Active",
    },
    {
      id: "EMP-017",
      firstName: "Aiden",
      lastName: "Thomas",
      email: "aiden.thomas@growmar.com",
      phone: "+1 (555) 019-2847",
      departmentId: "DEPT-DES",
      roleId: "ROLE-PROD-DES",
      managerId: "EMP-014",
      salary: 84000,
      hireDate: new Date("2023-07-15"),
      status: "Active",
    },
    // Finance Division
    {
      id: "EMP-018",
      firstName: "Isabella",
      lastName: "Santos",
      email: "isabella.santos@growmar.com",
      phone: "+1 (555) 019-2848",
      departmentId: "DEPT-FIN",
      roleId: "ROLE-FIN-DIR",
      managerId: "EMP-001",
      salary: 135000,
      hireDate: new Date("2022-02-01"),
      status: "Active",
    },
    {
      id: "EMP-019",
      firstName: "Mason",
      lastName: "Hall",
      email: "mason.hall@growmar.com",
      phone: "+1 (555) 019-2849",
      departmentId: "DEPT-FIN",
      roleId: "ROLE-PAYROLL",
      managerId: "EMP-018",
      salary: 92000,
      hireDate: new Date("2022-11-01"),
      status: "Active",
    },
    {
      id: "EMP-020",
      firstName: "Harper",
      lastName: "Lee",
      email: "harper.lee@growmar.com",
      phone: "+1 (555) 019-2850",
      departmentId: "DEPT-FIN",
      roleId: "ROLE-PAYROLL",
      managerId: "EMP-018",
      salary: 82000,
      hireDate: new Date("2023-05-01"),
      status: "Active",
    },
    // Operations & Engineering Support
    {
      id: "EMP-021",
      firstName: "Benjamin",
      lastName: "Adams",
      email: "benjamin.adams@growmar.com",
      phone: "+1 (555) 019-2851",
      departmentId: "DEPT-ADM",
      roleId: "ROLE-OPS-ANL",
      managerId: "EMP-001",
      salary: 85000,
      hireDate: new Date("2023-01-20"),
      status: "Active",
    },
    {
      id: "EMP-022",
      firstName: "Mia",
      lastName: "White",
      email: "mia.white@growmar.com",
      phone: "+1 (555) 019-2852",
      departmentId: "DEPT-ADM",
      roleId: "ROLE-OPS-ANL",
      managerId: "EMP-001",
      salary: 81000,
      hireDate: new Date("2023-06-15"),
      status: "Active",
    },
    {
      id: "EMP-023",
      firstName: "James",
      lastName: "Harris",
      email: "james.harris@growmar.com",
      phone: "+1 (555) 019-2853",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-FSD",
      managerId: "EMP-003",
      salary: 88000,
      hireDate: new Date("2023-08-10"),
      status: "Active",
    },
    {
      id: "EMP-024",
      firstName: "Charlotte",
      lastName: "Robinson",
      email: "charlotte.robinson@growmar.com",
      phone: "+1 (555) 019-2854",
      departmentId: "DEPT-HR",
      roleId: "ROLE-HR-SPEC",
      managerId: "EMP-002",
      salary: 76000,
      hireDate: new Date("2023-10-01"),
      status: "Active",
    },
    {
      id: "EMP-025",
      firstName: "Daniel",
      lastName: "Lewis",
      email: "daniel.lewis@growmar.com",
      phone: "+1 (555) 019-2855",
      departmentId: "DEPT-ENG",
      roleId: "ROLE-STAFF-SWE",
      managerId: "EMP-003",
      salary: 125000,
      hireDate: new Date("2022-08-01"),
      status: "Active",
    },
  ];

  // Upsert employees
  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        departmentId: emp.departmentId,
        roleId: emp.roleId,
        managerId: emp.managerId,
        salary: emp.salary,
        hireDate: emp.hireDate,
        status: emp.status,
      },
      create: emp,
    });
  }

  // ── 4. Seed Users with bcrypt hashes (The 4 Demo Users) ───────
  const demoUsersPath = path.join(process.cwd(), "demo_users.json");
  if (!fs.existsSync(demoUsersPath)) {
    throw new Error(`Demo users file not found at: ${demoUsersPath}`);
  }

  const demoUsers: DemoUserRecord[] = JSON.parse(fs.readFileSync(demoUsersPath, "utf-8"));

  for (const u of demoUsers) {
    if (!u.id || !u.email || !u.password || !u.role) {
      throw new Error(`Invalid demo user record: missing required field in ${JSON.stringify(u)}`);
    }

    if (!VALID_ROLES.includes(u.role)) {
      throw new Error(`Invalid role "${u.role}" for user ${u.email}`);
    }

    const passwordHash = await bcrypt.hash(u.password, 10);

    const upserted = await prisma.user.upsert({
      where: { email: u.email.toLowerCase().trim() },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
        isActive: u.is_active ?? true,
        employeeId: u.employee_id ?? null,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase().trim(),
        role: u.role,
        passwordHash,
        isActive: u.is_active ?? true,
        employeeId: u.employee_id ?? null,
      },
    });

    console.log(`  ✓ Demo User [${upserted.role.padEnd(8)}] ${upserted.email} (ID: ${upserted.id})`);
  }

  // ── 5. Summary Verification ───────────────────────────────────
  const userCount = await prisma.user.count();
  const empCount = await prisma.employee.count();
  const deptCount = await prisma.department.count();
  const roleCount = await prisma.role.count();

  console.log("\n=========================================");
  console.log("       DATABASE SEED SUMMARY");
  console.log("=========================================");
  console.log(`  Users:        ${userCount}`);
  console.log(`  Employees:    ${empCount}`);
  console.log(`  Departments:  ${deptCount}`);
  console.log(`  Roles:        ${roleCount}`);
  console.log("=========================================\n");
}

async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
