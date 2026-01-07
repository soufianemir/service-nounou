[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectName,
  [Parameter(Mandatory = $true)]
  [string]$SupabaseRef,
  [string]$SupabaseDbUser = "postgres",
  [string]$SupabaseDbName = "postgres",
  # Supabase pooler host depends on the region of your project.
  # Default is EU (Paris). You can copy the exact value from Supabase → Settings → Database → Connection string.
  [string]$SupabasePoolerHost = "aws-1-eu-west-3.pooler.supabase.com",
  [int]$SupabasePoolerPort = 6543,
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
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
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
    $finalRm = @("env","rm",$key,"production")
    if ($scope) { $finalRm += @("--scope", $scope) }
    $finalRm += @("--token", $token)
    $cmdRm = "vercel " + (($finalRm | ForEach-Object { Quote-CmdArg $_ }) -join " ")
    cmd /c ("echo y | " + $cmdRm) | Out-Null
  } catch {
    # ignore if not present
  }

  $tmp = Join-Path $env:TEMP ("vercel-env-" + $key + "-" + [Guid]::NewGuid().ToString("n") + ".txt")
  try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmp, ($value + "`n"), $utf8NoBom)
    $final = @("env","add",$key,"production")
    if ($scope) { $final += @("--scope", $scope) }
    $final += @("--token", $token)
    $cmdLine = "vercel " + (($final | ForEach-Object { Quote-CmdArg $_ }) -join " ") + " < " + (Quote-CmdArg $tmp)
    cmd /c $cmdLine
  } finally {
    Remove-Item -Force $tmp -ErrorAction SilentlyContinue
  }
}

function Remove-VercelEnv([string]$key, [string]$token, [string]$scope = "") {
  try {
    $finalRm = @("env","rm",$key,"production")
    if ($scope) { $finalRm += @("--scope", $scope) }
    $finalRm += @("--token", $token)
    $cmdRm = "vercel " + (($finalRm | ForEach-Object { Quote-CmdArg $_ }) -join " ")
    cmd /c ("echo y | " + $cmdRm) | Out-Null
  } catch {
    # ignore if not present
  }
}

function Add-PgbouncerFlag([string]$url) {
  if ([string]::IsNullOrWhiteSpace($url)) { return $url }
  if ($url -match "pooler\\.supabase\\.com") {
    # Supabase pooler uses PgBouncer. Prisma must disable prepared statements (statement_cache_size=0),
    # otherwise you can hit: "prepared statement \"s0\" already exists".
    $out = $url

    foreach ($param in @("pgbouncer=true", "statement_cache_size=0", "connection_limit=1")) {
      $key = ($param -split "=", 2)[0]
      if ($out -match ("(^|[?&])" + [regex]::Escape($key) + "=")) { continue }
      if ($out -match "\\?") { $out = $out + "&" + $param }
      else { $out = $out + "?" + $param }
    }

    return $out
  }
  return $url
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$linkedProjectName = $null
try {
  $vercelProjectFile = Join-Path $repoRoot ".vercel\project.json"
  if (Test-Path $vercelProjectFile) {
    $linked = (Get-Content $vercelProjectFile -Raw | ConvertFrom-Json)
    if ($linked.projectName) { $linkedProjectName = [string]$linked.projectName }
  }
} catch {
  $linkedProjectName = $null
}

if (-not $BaseUrl) {
  $slugSource = if ($linkedProjectName) { $linkedProjectName } else { $ProjectName }
  $slug = $slugSource.ToLower().Replace(" ", "-")
  $BaseUrl = "https://$slug.vercel.app"
}

Write-Host "Supabase ref: $SupabaseRef"
Write-Host "Project name: $ProjectName"
Write-Host "Base URL (default): $BaseUrl"

$dbPassPlain = $env:SUPABASE_DB_PASSWORD
$tokenPlain = $env:VERCEL_TOKEN

if ([string]::IsNullOrWhiteSpace($dbPassPlain)) {
  $dbPassSecure = Read-Host "Supabase DB password" -AsSecureString
  $dbPassPlain = Get-PlainText $dbPassSecure
}

if ([string]::IsNullOrWhiteSpace($tokenPlain)) {
  $tokenSecure = Read-Host "Vercel token" -AsSecureString
  $tokenPlain = Get-PlainText $tokenSecure
}

$dbPassEncoded = [uri]::EscapeDataString($dbPassPlain)
$directUrl = "postgresql://$SupabaseDbUser`:$dbPassEncoded@db.$SupabaseRef.supabase.co:5432/$SupabaseDbName?schema=public&sslmode=require"

if (-not $RuntimeDatabaseUrl) {
  if ($SupabasePoolerHost) {
    $poolerUser = "$SupabaseDbUser.$SupabaseRef"
    $RuntimeDatabaseUrl = "postgresql://$poolerUser`:$dbPassEncoded@$SupabasePoolerHost`:$SupabasePoolerPort/$SupabaseDbName?schema=public&sslmode=require&pgbouncer=true"
    Write-Host "Runtime DB URL: using Supabase pooler ($($SupabasePoolerHost):$SupabasePoolerPort)."
  } else {
    $RuntimeDatabaseUrl = Read-Host "Supabase pooler DATABASE_URL (recommended for Vercel)"
    if (-not $RuntimeDatabaseUrl) {
      $RuntimeDatabaseUrl = $directUrl
      Write-Host "Runtime DB URL is using direct connection (not recommended for serverless)."
    }
  }
}
$runtimeWithFlag = Add-PgbouncerFlag $RuntimeDatabaseUrl
if ($runtimeWithFlag -ne $RuntimeDatabaseUrl) {
  Write-Host "Applied PgBouncer-safe settings to runtime DATABASE_URL."
  $RuntimeDatabaseUrl = $runtimeWithFlag
}

Ensure-Vercel

Push-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Prisma generate + db push (Supabase)..."
$env:DATABASE_URL = $directUrl
cmd /c npm.cmd run prisma:generate
# Use cmd.exe to force npx.cmd (avoid PowerShell script signing issues).
cmd /c npx.cmd prisma db push

if ($Seed) {
  Write-Host "Seeding demo data..."
  cmd /c npm.cmd run seed
}

$vercelProjectFile = Join-Path (Get-Location) ".vercel\project.json"
if (Test-Path $vercelProjectFile) {
  Write-Host "Vercel project already linked (found .vercel/project.json)."
} else {
  Write-Host "Linking Vercel project..."
  Write-Host "When prompted 'Set up and deploy?', answer 'no' (we deploy after env vars are set)."
  Invoke-Vercel @("link","--project",$ProjectName) $tokenPlain $VercelScope
}

Write-Host "Setting Vercel env vars (production)..."
Set-VercelEnv "DATABASE_URL" $RuntimeDatabaseUrl $tokenPlain $VercelScope
Set-VercelEnv "SESSION_JWT_SECRET" (New-JwtSecret) $tokenPlain $VercelScope
Set-VercelEnv "SESSION_COOKIE_SECURE" "true" $tokenPlain $VercelScope
Set-VercelEnv "NEXT_PUBLIC_BASE_URL" $BaseUrl $tokenPlain $VercelScope
Remove-VercelEnv "PRISMA_SCHEMA" $tokenPlain $VercelScope

Write-Host "Deploying to Vercel..."
Invoke-Vercel @("deploy","--prod") $tokenPlain $VercelScope

Write-Host "Done."

Pop-Location
