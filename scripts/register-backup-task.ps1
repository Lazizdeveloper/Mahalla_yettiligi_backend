param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [Parameter(Mandatory = $false)]
  [string]$OutputDirectory = ".\\backups",
  [Parameter(Mandatory = $false)]
  [string]$Schedule = "02:30",
  [Parameter(Mandatory = $false)]
  [string]$TaskName = "MahallaDailyBackup"
)

$scriptPath = Join-Path $PSScriptRoot "backup-neon-rotation.ps1"
if (-not (Test-Path $scriptPath)) {
  Write-Error "Backup script not found: $scriptPath"
  exit 1
}

$escapedUrl = $DatabaseUrl.Replace('"', '\"')
$escapedDir = $OutputDirectory.Replace('"', '\"')
$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -DatabaseUrl `"$escapedUrl`" -OutputDirectory `"$escapedDir`""

schtasks /Create /F /SC DAILY /ST $Schedule /TN $TaskName /TR $taskCommand | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to register scheduled task."
  exit $LASTEXITCODE
}

Write-Output "Scheduled task created: $TaskName at $Schedule"
