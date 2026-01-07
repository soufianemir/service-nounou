param(
  [string]$ProjectDir = (Get-Location).Path,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "SERVICE NOUNOU - ONE SHOT"
Write-Host "========================================"
Write-Host "Project: $ProjectDir"
Write-Host ""

Set-Location $ProjectDir

if (-Not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example (EDIT secrets before production)."
  }
}

if (-Not $SkipInstall) {
  Write-Host "Installing dependencies (npm install)..."
  npm install
}

Write-Host "Preparing folders..."
New-Item -ItemType Directory -Force -Path "storage" | Out-Null
New-Item -ItemType Directory -Force -Path "prisma" | Out-Null

Write-Host "Prisma generate..."
npx prisma generate

Write-Host "Prisma db push (Postgres schema)..."
npx prisma db push

Write-Host "Seeding demo data..."
npm run seed

Write-Host ""
Write-Host "Starting dev server..."
npm run dev
