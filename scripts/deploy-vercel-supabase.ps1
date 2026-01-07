[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectName,
  [Parameter(Mandatory = $true)]
  [string]$SupabaseRef,
  [string]$SupabaseDbUser = "postgres",
  [string]$SupabaseDbName = "postgres",
  [string]$RuntimeDatabaseUrl = "",
  [string]$BaseUrl = "",
  [string]$VercelScope = "",
  [switch]$Seed
)

$ErrorActionPreference = "Stop"

function Get-PlainText([System.Security.SecureString]$secure) {
  return [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

function New-JwtSecret {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return -join ($bytes | ForEach-Object { $_.ToString("x2") })
}

function Ensure-Vercel {
  if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..."
    cmd /c npm.cmd i -g vercel
  }
}

function Quote-CmdArg([string]$s) {
  if ($null -eq $s) { return '""' }
  $escaped = $s -replace '"', '\"'
  return '"' + $escaped + '"'
}

function Invoke-Vercel([string[]]$args, [string]$token, [string]$scope = "") {
  $final = @() + $args + @("--token", $token)
  if ($scope) { $final += @("--scope", $scope) }
  # Use cmd.exe to force vercel.cmd (avoid PowerShell script signing issues).
  $cmdLine = "vercel " + (($final | ForEach-Object { Quote-CmdArg $_ }) -join " ")
  cmd /c $cmdLine
}

function Set-VercelEnv([string]$key, [string]$value, [string]$token, [string]$scope = "") {
  if ([string]::IsNullOrWhiteSpace($value)) { return }
  try {
    Invoke-Vercel @("env","rm",$key,"production","--yes") $token $scope | Out-Null
  } catch {
    # ignore if not present
  }
  $value | Invoke-Vercel @("env","add",$key,"production","--yes") $token $scope
}

if (-not $BaseUrl) {
  $slug = $ProjectName.ToLower().Replace(" ", "-")
  $BaseUrl = "https://$slug.vercel.app"
}

Write-Host "Supabase ref: $SupabaseRef"
Write-Host "Project name: $ProjectName"
Write-Host "Base URL (default): $BaseUrl"

$dbPassSecure = Read-Host "Supabase DB password" -AsSecureString
$tokenSecure = Read-Host "Vercel token" -AsSecureString
$dbPassPlain = Get-PlainText $dbPassSecure
$tokenPlain = Get-PlainText $tokenSecure

$dbPassEncoded = [uri]::EscapeDataString($dbPassPlain)
$directUrl = "postgresql://$SupabaseDbUser`:$dbPassEncoded@db.$SupabaseRef.supabase.co:5432/$SupabaseDbName?schema=public&sslmode=require"

if (-not $RuntimeDatabaseUrl) {
  $RuntimeDatabaseUrl = $directUrl
  Write-Host "Runtime DB URL is using direct connection (ok for tests)."
  Write-Host "For serverless scale, use Supabase pooler URL and pass -RuntimeDatabaseUrl."
}

Ensure-Vercel

Push-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Prisma generate + db push (Supabase)..."
$env:PRISMA_SCHEMA = "prisma/schema.postgres.prisma"
$env:DATABASE_URL = $directUrl
cmd /c npm.cmd run prisma:generate
# Use cmd.exe to force npx.cmd (avoid PowerShell script signing issues).
cmd /c npx.cmd prisma db push --schema prisma/schema.postgres.prisma

if ($Seed) {
  Write-Host "Seeding demo data..."
  cmd /c npm.cmd run seed
}

Write-Host "Linking Vercel project..."
Invoke-Vercel @("link","--project",$ProjectName,"--yes") $tokenPlain $VercelScope

Write-Host "Setting Vercel env vars (production)..."
Set-VercelEnv "DATABASE_URL" $RuntimeDatabaseUrl $tokenPlain $VercelScope
Set-VercelEnv "PRISMA_SCHEMA" "prisma/schema.postgres.prisma" $tokenPlain $VercelScope
Set-VercelEnv "SESSION_JWT_SECRET" (New-JwtSecret) $tokenPlain $VercelScope
Set-VercelEnv "SESSION_COOKIE_SECURE" "true" $tokenPlain $VercelScope
Set-VercelEnv "NEXT_PUBLIC_BASE_URL" $BaseUrl $tokenPlain $VercelScope

Write-Host "Deploying to Vercel..."
Invoke-Vercel @("deploy","--prod") $tokenPlain $VercelScope

Write-Host "Done."

Pop-Location
