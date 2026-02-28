param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [Parameter(Mandatory = $false)]
  [string]$OutputDirectory = ".\\backups"
)

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump is not installed or not available in PATH."
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filePath = Join-Path $OutputDirectory "mahalla-backup-$timestamp.sql"

$env:DATABASE_URL = $DatabaseUrl
pg_dump "$DatabaseUrl" --format=plain --no-owner --no-privileges --file "$filePath"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Backup failed."
  exit $LASTEXITCODE
}

Write-Output "Backup created: $filePath"
