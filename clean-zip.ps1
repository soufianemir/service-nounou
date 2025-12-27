param(
  [string]$ZipName = "service-nounou-clean.zip"
)

# Crée un ZIP "propre" en CONSERVANT l'arborescence.
# ⚠️ À exécuter depuis la racine du projet (là où se trouve package.json).

$root = (Get-Location).Path

$excludeDirs = @(
  "node_modules",
  ".next",
  "dist",
  "coverage",
  ".git",
  ".idea",
  ".vscode"
)

$excludeFilePatterns = @(
  ".env",
  ".env.local",
  "*.log",
  "*.sqlite",
  "*.sqlite3"
)

function Is-ExcludedPath([string]$fullPath) {
  foreach ($d in $excludeDirs) {
    if ($fullPath -match ([regex]::Escape([IO.Path]::DirectorySeparatorChar + $d + [IO.Path]::DirectorySeparatorChar))) {
      return $true
    }
  }
  return $false
}

$files = Get-ChildItem -Path $root -Recurse -File -Force |
  Where-Object { -not (Is-ExcludedPath $_.FullName) } |
  Where-Object {
    $name = $_.Name
    foreach ($p in $excludeFilePatterns) {
      if ($name -like $p) { return $false }
    }
    return $true
  } |
  ForEach-Object { $_.FullName.Substring($root.Length + 1) }

if (Test-Path $ZipName) { Remove-Item $ZipName -Force }

# Important : on passe des chemins RELATIFS -> l'arborescence est conservée.
Compress-Archive -Path $files -DestinationPath $ZipName -Force

Write-Host "✅ ZIP créé : $ZipName"
Write-Host "📦 Fichiers inclus : $($files.Count)"
