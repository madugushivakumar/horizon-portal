<#
.SYNOPSIS
  Orchestrates safe, ordered Prisma migration deployment and post-migration isolation.
.DESCRIPTION
  Enforces the mandatory 4-step security sequence:
  1. Executes pre-flight configuration validation (rejects missing DIRECT_URL, Production endpoints, endpoint mismatches).
  2. Runs `prisma migrate deploy` using the migration-only DIRECT_URL with prisma.config.postgresql.ts.
  3. Executes `scripts/post-migration-reconcile.sql` with ON_ERROR_STOP=1 to isolate _prisma_migrations.
  4. Enforces strict native-command failure propagation: wrapper aborts immediately if any step fails.
#>

[CmdletBinding()]
param (
  [string]$DirectUrl = $env:DIRECT_URL,
  [string]$ExpectedEndpoint = $env:EXPECTED_PREVIEW_ENDPOINT,
  [string]$MigrateEnv = $env:MIGRATE_ENV,
  [string]$VercelEnv = $env:VERCEL_ENV
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================="
Write-Host "   HORIZON PORTAL -- CONTROLLED DATABASE MIGRATION PIPELINE       "
Write-Host "=================================================================="

# 1. Enforce DIRECT_URL presence without silent fallback to DATABASE_URL
if (-not $DirectUrl -or $DirectUrl.Trim() -eq "") {
  [Console]::Error.WriteLine("DEPLOYMENT HALTED: DIRECT_URL environment variable is missing. DATABASE_URL cannot be used as migration fallback.")
  exit 1
}

# 2. Pre-flight Security Guard Validation
Write-Host "`nStep 1: Pre-flight Configuration and Endpoint Validation..." -ForegroundColor Cyan
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repoRoot
try {
  $env:DIRECT_URL = $DirectUrl
  if ($ExpectedEndpoint) { $env:EXPECTED_PREVIEW_ENDPOINT = $ExpectedEndpoint }
  if ($MigrateEnv) { $env:MIGRATE_ENV = $MigrateEnv }
  if ($VercelEnv) { $env:VERCEL_ENV = $VercelEnv }

  npx tsx -e "import { validateMigrationDatabaseConfig } from './prisma.config.postgresql'; validateMigrationDatabaseConfig();"
  if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("DEPLOYMENT HALTED: Pre-flight migration validation failed with exit code $LASTEXITCODE.")
    exit $LASTEXITCODE
  }
} catch {
  [Console]::Error.WriteLine("DEPLOYMENT HALTED: Pre-flight validation error: $_")
  exit 1
} finally {
  Pop-Location
}
Write-Host "Step 1 Passed: Pre-flight security guards validated successfully." -ForegroundColor Green

# 3. Execute Prisma Migrate Deploy
Write-Host "`nStep 2: Executing Prisma Migrate Deploy..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
  npx prisma migrate deploy --config prisma.config.postgresql.ts --schema prisma/schema.postgresql.prisma
  if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("DEPLOYMENT HALTED: Prisma migration deployment failed with exit code $LASTEXITCODE.")
    exit $LASTEXITCODE
  }
} catch {
  [Console]::Error.WriteLine("DEPLOYMENT HALTED: Prisma migrate error: $_")
  exit 1
} finally {
  Pop-Location
}
Write-Host "Step 2 Passed: Prisma schema migrations applied successfully." -ForegroundColor Green

# 4. Locate psql binary
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $psqlPath -and (Test-Path "C:\Program Files\PostgreSQL\18\bin\psql.exe")) {
  $psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
}

# 5. Execute Post-Migration Isolation Hook
Write-Host "`nStep 3: Executing Post-Migration Privilege Reconciliation Hook..." -ForegroundColor Cyan
$sqlScript = Join-Path $PSScriptRoot "post-migration-reconcile.sql"

if ($psqlPath) {
  & $psqlPath "$DirectUrl" -v ON_ERROR_STOP=1 -f "$sqlScript"
  if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("SECURITY GATE FAILED: Post-migration privilege reconciliation failed with exit code $LASTEXITCODE.")
    exit $LASTEXITCODE
  }
  Write-Host "Step 3 Passed: Effective privilege audit passed. public._prisma_migrations is completely shielded." -ForegroundColor Green
} else {
  [Console]::Error.WriteLine("SECURITY GATE FAILED: psql CLI binary not found in PATH or standard installation directory. Post-migration privilege reconciliation cannot execute.")
  exit 1
}

Write-Host "`n=================================================================="
Write-Host "   MIGRATION AND SECURITY RECONCILIATION COMPLETED SUCCESSFULLY   "
Write-Host "=================================================================="
exit 0
