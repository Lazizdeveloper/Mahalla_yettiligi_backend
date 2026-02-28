param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [switch]$Force
)

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql is not installed or not available in PATH."
  exit 1
}

if (-not (Test-Path $BackupFile)) {
  Write-Error "Backup file not found: $BackupFile"
  exit 1
}

if (-not $Force) {
  Write-Error "Restore is destructive. Re-run with -Force to continue."
  exit 1
}

Write-Output "Restoring backup from $BackupFile"
psql "$DatabaseUrl" -v ON_ERROR_STOP=1 -f "$BackupFile"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Restore failed."
  exit $LASTEXITCODE
}

Write-Output "Restore completed successfully."
