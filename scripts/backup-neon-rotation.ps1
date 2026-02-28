param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [Parameter(Mandatory = $false)]
  [string]$OutputDirectory = ".\\backups",
  [Parameter(Mandatory = $false)]
  [int]$RetentionDays = 30
)

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump is not installed or not available in PATH."
  exit 1
}

if ($RetentionDays -lt 1) {
  Write-Error "RetentionDays must be at least 1."
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filePath = Join-Path $OutputDirectory "mahalla-backup-$timestamp.sql"

Write-Output "Creating backup: $filePath"
pg_dump "$DatabaseUrl" --format=plain --no-owner --no-privileges --file "$filePath"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Backup failed."
  exit $LASTEXITCODE
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
$deleted = 0
Get-ChildItem -Path $OutputDirectory -Filter "mahalla-backup-*.sql" -File |
  Where-Object { $_.LastWriteTime -lt $cutoff } |
  ForEach-Object {
    Remove-Item $_.FullName -Force
    $deleted++
  }

Write-Output "Backup created: $filePath"
Write-Output "Old backups deleted: $deleted"
