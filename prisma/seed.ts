/**
 * Horizon Portal — Database Seed Script
 * prisma/seed.ts
 *
 * Seeds the 4 demo users from demo_users.json with secure bcrypt password hashes,
 * ensuring idempotency (safe to run multiple times).
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

async function seedDemoUsers() {
  const filePath = path.join(process.cwd(), "demo_users.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Demo users file not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let demoUsers: DemoUserRecord[];
  try {
    demoUsers = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse demo_users.json: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!Array.isArray(demoUsers) || demoUsers.length === 0) {
    throw new Error("demo_users.json must contain a non-empty array of demo users.");
  }

  console.log(`\n🌱 Seeding ${demoUsers.length} demo users...`);

  // First, create demo departments and employees if needed to satisfy foreign keys
  const deptAdmin = await prisma.department.upsert({
    where: { id: "DEPT-ADM" },
    update: {},
    create: {
      id: "DEPT-ADM",
      name: "Administration & Executive",
      code: "ADM",
      description: "Executive and administrative leadership",
    },
  });

  const deptHR = await prisma.department.upsert({
    where: { id: "DEPT-HR" },
    update: {},
    create: {
      id: "DEPT-HR",
      name: "Human Resources",
      code: "HR",
      description: "People operations and talent acquisition",
    },
  });

  const deptEng = await prisma.department.upsert({
    where: { id: "DEPT-ENG" },
    update: {},
    create: {
      id: "DEPT-ENG",
      name: "Engineering & Operations",
      code: "ENG",
      description: "Product engineering and infrastructure",
    },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { id: "ROLE-ADM" },
    update: {},
    create: { id: "ROLE-ADM", name: "System Administrator", description: "Full administrative access" },
  });

  const roleHR = await prisma.role.upsert({
    where: { id: "ROLE-HR" },
    update: {},
    create: { id: "ROLE-HR", name: "HR Lead", description: "Human resources management" },
  });

  const roleMgr = await prisma.role.upsert({
    where: { id: "ROLE-MGR" },
    update: {},
    create: { id: "ROLE-MGR", name: "Engineering Manager", description: "Team leadership and reviews" },
  });

  const roleEmp = await prisma.role.upsert({
    where: { id: "ROLE-EMP" },
    update: {},
    create: { id: "ROLE-EMP", name: "Senior Software Engineer", description: "Core platform engineering" },
  });

  // Create demo employees corresponding to the demo users
  const employeeData = [
    {
      id: "EMP-001",
      firstName: "Alexander",
      lastName: "Wright",
      email: "alexander.wright@growmar.com",
      departmentId: deptAdmin.id,
      roleId: roleAdmin.id,
      salary: 145000,
      status: "Active",
    },
    {
      id: "EMP-002",
      firstName: "Eleanor",
      lastName: "Vance",
      email: "eleanor.vance@growmar.com",
      departmentId: deptHR.id,
      roleId: roleHR.id,
      salary: 115000,
      status: "Active",
    },
    {
      id: "EMP-003",
      firstName: "Marcus",
      lastName: "Brody",
      email: "marcus.brody@growmar.com",
      departmentId: deptEng.id,
      roleId: roleMgr.id,
      salary: 130000,
      status: "Active",
    },
    {
      id: "EMP-004",
      firstName: "Sophie",
      lastName: "Chen",
      email: "sophie.chen@growmar.com",
      departmentId: deptEng.id,
      roleId: roleEmp.id,
      managerId: "EMP-003",
      salary: 98000,
      status: "Active",
    },
  ];

  for (const emp of employeeData) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        departmentId: emp.departmentId,
        roleId: emp.roleId,
        managerId: emp.managerId ?? null,
        salary: emp.salary,
        status: emp.status,
      },
      create: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        departmentId: emp.departmentId,
        roleId: emp.roleId,
        managerId: emp.managerId ?? null,
        salary: emp.salary,
        status: emp.status,
      },
    });
  }

  // Seed users with bcrypt hashes
  for (const u of demoUsers) {
    if (!u.id || !u.email || !u.password || !u.role) {
      throw new Error(`Invalid demo user record: missing required field in ${JSON.stringify(u)}`);
    }

    if (!VALID_ROLES.includes(u.role)) {
      throw new Error(`Invalid role "${u.role}" for user ${u.email}. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    // Hash password with bcryptjs salt rounds = 10
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

    console.log(`  ✓ User [${upserted.role.padEnd(8)}] ${upserted.email} (ID: ${upserted.id})`);
  }

  // Print verification report
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
    await seedDemoUsers();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
