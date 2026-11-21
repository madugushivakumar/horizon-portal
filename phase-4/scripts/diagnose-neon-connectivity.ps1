# =====================================================================
# HORIZON PORTAL -- NEON CONNECTIVITY DIAGNOSTICS
# scripts/diagnose-neon-connectivity.ps1
#
# Safe PowerShell connectivity diagnostic for Neon PostgreSQL.
# NEVER prints passwords, credentials, or raw connection strings.
# =====================================================================

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "       HORIZON PORTAL -- NEON CONNECTIVITY DIAGNOSTICS            " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot "..\.env.production.local"
$directUrl = $env:DIRECT_URL
$pooledUrl = $env:DATABASE_URL

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            if ($key -eq "DIRECT_URL" -and -not $directUrl) { $directUrl = $val }
            if ($key -eq "DATABASE_URL" -and -not $pooledUrl) { $pooledUrl = $val }
        }
    }
}

function Test-Endpoint {
    param (
        [string]$label,
        [string]$rawUrl,
        [bool]$isDirectRequired
    )

    Write-Host "$label" -ForegroundColor Yellow

    if (-not $rawUrl) {
        Write-Host "  Hostname: [NOT CONFIGURED]" -ForegroundColor Red
        Write-Host "  Status:   Variable is missing in environment or .env.production.local" -ForegroundColor Red
        Write-Host ""
        return @{ Dns = $false; Tcp = $false; Valid = $false; Configured = $false }
    }

    # Clean any accidental 'psql' wrapping
    $cleaned = $rawUrl.Trim()
    if ($cleaned.StartsWith("psql ")) {
        $cleaned = $cleaned.Substring(5).Trim().Trim('"').Trim("'")
    }

    try {
        $uri = [System.Uri]$cleaned
    }
    catch {
        Write-Host "  Hostname: [INVALID URI FORMAT]" -ForegroundColor Red
        Write-Host "  Error:    Unable to parse URL. Check for unencoded characters in password." -ForegroundColor Red
        Write-Host ""
        return @{ Dns = $false; Tcp = $false; Valid = $false; Configured = $true }
    }

    $hostName = $uri.Host
    $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }

    # Mask host slightly for privacy if desired (displaying hostname is safe as it contains no secrets)
    Write-Host "  Hostname: $hostName" -ForegroundColor White
    Write-Host "  Port:     $port" -ForegroundColor White

    # Pooler detection
    $hasPoolerHost = $hostName.Contains("-pooler")
    if ($isDirectRequired -and $hasPoolerHost) {
        Write-Host "  Warning:  Direct endpoint contains '-pooler' in hostname." -ForegroundColor Yellow
    }
    if (-not $isDirectRequired -and -not $hasPoolerHost -and $port -ne 6543) {
        Write-Host "  Warning:  Pooled endpoint appears to point to direct host (missing '-pooler' and port 6543)." -ForegroundColor Yellow
    }

    # 1. DNS Resolution Test
    $dnsPass = $false
    try {
        $dnsResult = Resolve-DnsName -Name $hostName -ErrorAction Stop
        if ($dnsResult) {
            $dnsPass = $true
            Write-Host "  DNS:      PASS" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  DNS:      FAIL ($($_.Exception.Message))" -ForegroundColor Red
    }

    # 2. TCP Port Test
    $tcpPass = $false
    try {
        $tcpResult = Test-NetConnection -ComputerName $hostName -Port $port -WarningAction SilentlyContinue
        if ($tcpResult.TcpTestSucceeded) {
            $tcpPass = $true
            Write-Host "  TCP:      PASS" -ForegroundColor Green
        }
        else {
            Write-Host "  TCP:      FAIL (Port $port unreachable)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  TCP:      FAIL ($($_.Exception.Message))" -ForegroundColor Red
    }

    Write-Host ""
    return @{ Dns = $dnsPass; Tcp = $tcpPass; Valid = $true; Configured = $true; Host = $hostName; Port = $port }
}

$directRes = Test-Endpoint -label "Direct endpoint (DIRECT_URL):" -rawUrl $directUrl -isDirectRequired $true
$pooledRes = Test-Endpoint -label "Pooled endpoint (DATABASE_URL):" -rawUrl $pooledUrl -isDirectRequired $false

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC SUMMARY:" -ForegroundColor Cyan

$overallStatus = "NOT READY"

if (-not $directRes.Configured -or -not $pooledRes.Configured) {
    $overallStatus = "CONFIGURATION REQUIRED (.env.production.local missing variables)"
    Write-Host "Overall: $overallStatus" -ForegroundColor Red
}
elseif (-not $directRes.Valid -or -not $pooledRes.Valid) {
    $overallStatus = "CONFIGURATION REQUIRED (Invalid URL syntax)"
    Write-Host "Overall: $overallStatus" -ForegroundColor Red
}
elseif ($directRes.Tcp -and $pooledRes.Tcp) {
    $overallStatus = "READY (Network reachability verified for both endpoints)"
    Write-Host "Overall: $overallStatus" -ForegroundColor Green
}
elseif ($directRes.Tcp -and -not $pooledRes.Tcp) {
    $overallStatus = "CONFIGURATION REQUIRED (Direct endpoint reachable, but pooled endpoint unreachable)"
    Write-Host "Overall: $overallStatus" -ForegroundColor Yellow
}
elseif (-not $directRes.Tcp -and $pooledRes.Tcp) {
    $overallStatus = "CONFIGURATION REQUIRED (Direct endpoint unreachable - port 5432 or cold-start issue)"
    Write-Host "Overall: $overallStatus" -ForegroundColor Yellow
}
else {
    $overallStatus = "NOT READY (Both TCP endpoints unreachable - check DNS, network, and Neon compute state)"
    Write-Host "Overall: $overallStatus" -ForegroundColor Red
}

Write-Host "=================================================================" -ForegroundColor Cyan
