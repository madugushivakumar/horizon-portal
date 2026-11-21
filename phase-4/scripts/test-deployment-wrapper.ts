/**
 * Deterministic Failure Propagation & Pre-flight Tests for deploy-migrations.ps1
 *
 * Verifies that scripts/deploy-migrations.ps1 and scripts/post-migration-reconcile.sql:
 * 1. Rejects missing DIRECT_URL immediately (exit 1).
 * 2. Rejects Production endpoint in Preview during pre-flight before Prisma runs.
 * 3. Rejects missing EXPECTED_PREVIEW_ENDPOINT during pre-flight.
 * 4. Rejects endpoint mismatches during pre-flight.
 * 5. Does not print passwords or credentials to stdout/stderr.
 * 6. Enforces ON_ERROR_STOP=1 in post-migration reconciliation SQL.
 * 7. Enforces atomic rollback via BEGIN / COMMIT transaction block.
 * 8. Enforces fail-closed psql execution (halts if psql missing or fails).
 * 9. Reconciles object ownership (all tables + migrations owned by horizon_preview_migrator).
 * 10. Reconciles recursive and transitive role memberships to prevent SET ROLE privilege assumption.
 * 11. Reconciles schema public privileges (CREATE denied to app role).
 * 12. Correctly verifies failure propagation without connecting to remote databases.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("==================================================================");
console.log("   DEPLOYMENT WRAPPER & RECONCILIATION DETERMINISTIC AUDIT        ");
console.log("==================================================================\n");

const wrapperPath = path.resolve(__dirname, "deploy-migrations.ps1");
const reconcileSqlPath = path.resolve(__dirname, "post-migration-reconcile.sql");

// Test 1: File Existence & Path Invariance
assert(fs.existsSync(wrapperPath), "scripts/deploy-migrations.ps1 exists");
assert(fs.existsSync(reconcileSqlPath), "scripts/post-migration-reconcile.sql exists");

// Test 2: Wrapper Rejects Missing DIRECT_URL (Exit 1)
try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${wrapperPath}" -DirectUrl ""`, {
    stdio: "pipe",
    env: { ...process.env, DIRECT_URL: "" },
  });
  assert(false, "Wrapper should fail when DIRECT_URL is empty");
} catch (err: any) {
  assert(err.status !== 0, "Wrapper exits with non-zero exit code when DIRECT_URL is missing");
  const output = (err.stderr?.toString() || "") + (err.stdout?.toString() || "");
  assert(output.includes("DIRECT_URL environment variable is missing"), "Error message explicitly identifies missing DIRECT_URL");
}

// Test 3: Wrapper Fails Pre-flight on Production Endpoint under Preview
try {
  const dummyProdUrl = "postgresql://horizon_preview_migrator:supersecretpass@ep-broad-hall-b3dtqwdp.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  execSync(
    `powershell -ExecutionPolicy Bypass -File "${wrapperPath}" -DirectUrl "${dummyProdUrl}" -MigrateEnv "preview" -ExpectedEndpoint "ep-preview-fake123"`,
    {
      stdio: "pipe",
      env: {
        ...process.env,
        DIRECT_URL: dummyProdUrl,
        MIGRATE_ENV: "preview",
        EXPECTED_PREVIEW_ENDPOINT: "ep-preview-fake123",
      },
    }
  );
  assert(false, "Wrapper should fail pre-flight when Production endpoint is targeted under Preview");
} catch (err: any) {
  assert(err.status !== 0, "Wrapper exits non-zero on Production endpoint targeted under Preview");
  const output = (err.stderr?.toString() || "") + (err.stdout?.toString() || "");
  assert(output.includes("SECURITY VIOLATION"), "Pre-flight outputs fatal SECURITY VIOLATION");
  assert(!output.includes("supersecretpass"), "Pre-flight error output does not leak password credentials");
}

// Test 4: Wrapper Fails Pre-flight on Missing EXPECTED_PREVIEW_ENDPOINT under Preview
try {
  const dummyPreviewUrl = "postgresql://horizon_preview_migrator:pass@ep-preview-custom.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  execSync(
    `powershell -ExecutionPolicy Bypass -File "${wrapperPath}" -DirectUrl "${dummyPreviewUrl}" -MigrateEnv "preview" -ExpectedEndpoint ""`,
    {
      stdio: "pipe",
      env: {
        ...process.env,
        DIRECT_URL: dummyPreviewUrl,
        MIGRATE_ENV: "preview",
        EXPECTED_PREVIEW_ENDPOINT: "",
      },
    }
  );
  assert(false, "Wrapper should fail pre-flight when EXPECTED_PREVIEW_ENDPOINT is missing under Preview");
} catch (err: any) {
  assert(err.status !== 0, "Wrapper exits non-zero on missing EXPECTED_PREVIEW_ENDPOINT under Preview");
  const output = (err.stderr?.toString() || "") + (err.stdout?.toString() || "");
  assert(output.includes("CONFIGURATION ERROR"), "Pre-flight outputs CONFIGURATION ERROR for missing allowlist endpoint");
}

// Test 5: Reconcile SQL Structure & Hardening Audit
const sqlContent = fs.readFileSync(reconcileSqlPath, "utf8");
assert(sqlContent.includes("\\set ON_ERROR_STOP on"), "Reconciliation SQL enforces \\set ON_ERROR_STOP on");
assert(sqlContent.includes("BEGIN;") && sqlContent.includes("COMMIT;"), "Reconciliation SQL executes inside an atomic transaction block");
assert(sqlContent.includes("has_table_privilege('horizon_preview_app', 'public._prisma_migrations'"), "Reconciliation checks effective privileges using has_table_privilege");
assert(sqlContent.includes("v_migration_owner != 'horizon_preview_migrator'"), "Reconciliation checks that migrator owns _prisma_migrations");
assert(sqlContent.includes("v_unowned_table IS NOT NULL"), "Reconciliation audits ownership of all application tables");
assert(sqlContent.includes("has_schema_privilege('horizon_preview_app', 'public', 'CREATE')"), "Reconciliation checks that runtime role has 0 CREATE on public");
assert(sqlContent.includes("WITH RECURSIVE member_roles"), "Reconciliation performs recursive CTE role-membership audit");
assert(sqlContent.includes("RAISE EXCEPTION"), "Reconciliation raises fatal PostgreSQL exception on permission violation");
assert(sqlContent.includes("v_app_bypassrls") && sqlContent.includes("v_migrator_bypassrls"), "Reconciliation audits rolbypassrls for both runtime and migrator roles");
assert(sqlContent.includes("v_delete_violating_table IS NOT NULL"), "Reconciliation enforces zero-DELETE invariant for horizon_preview_app across all tables");
assert(sqlContent.includes("v_audit_update"), "Reconciliation enforces audit_logs immutability invariant (zero UPDATE)");
assert(sqlContent.includes("REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM PUBLIC"), "Reconciliation explicitly revokes any PUBLIC privileges on _prisma_migrations");

// Test 6: Sequence Privilege Schema Inspection
const migrationSql = fs.readFileSync(path.resolve(__dirname, "../prisma/migrations_postgresql/20261117000000_init_postgresql/migration.sql"), "utf8");
const sequenceCount = (migrationSql.match(/CREATE SEQUENCE/gi) || []).length;
const serialCount = (migrationSql.match(/SERIAL/gi) || []).length;
assert(sequenceCount === 0, "Verified zero CREATE SEQUENCE statements exist in PostgreSQL baseline migration");
assert(serialCount === 0, "Verified zero SERIAL column definitions exist in PostgreSQL baseline migration");

// Test 7: Audit Log Immutable Append-Only Verification
const auditLoggerPath = path.resolve(__dirname, "../src/lib/audit/audit-logger.ts");
const auditLoggerCode = fs.readFileSync(auditLoggerPath, "utf8");
assert(auditLoggerCode.includes(".auditLog.create("), "auditLog implementation uses create");
assert(!auditLoggerCode.includes(".auditLog.update(") && !auditLoggerCode.includes(".auditLog.updateMany("), "auditLog implementation contains zero update calls (immutable)");
assert(!auditLoggerCode.includes(".auditLog.delete(") && !auditLoggerCode.includes(".auditLog.deleteMany("), "auditLog implementation contains zero delete calls (immutable)");

// Test 8: Wrapper Script Structure & Native Failure Handling Audit
const wrapperContent = fs.readFileSync(wrapperPath, "utf8");
assert(wrapperContent.includes("$ErrorActionPreference = \"Stop\""), "Wrapper configures strict ErrorActionPreference Stop");
assert(wrapperContent.includes("prisma migrate deploy"), "Wrapper executes prisma migrate deploy");
assert(wrapperContent.includes("if ($LASTEXITCODE -ne 0)") && wrapperContent.includes("exit $LASTEXITCODE"), "Wrapper checks $LASTEXITCODE after native binary execution");
assert(wrapperContent.includes("-v ON_ERROR_STOP=1"), "Wrapper passes ON_ERROR_STOP=1 to psql invocation");
assert(wrapperContent.includes("psql CLI binary not found") && wrapperContent.includes("exit 1"), "Wrapper fails closed if psql CLI binary is absent");

console.log("\n==================================================================");
console.log(`  DEPLOYMENT WRAPPER & SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}
