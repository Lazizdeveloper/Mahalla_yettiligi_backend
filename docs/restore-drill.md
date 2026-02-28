# Restore Drill Playbook

## Goal

Validate that a full restore can be executed from SQL backup in a controlled window.

## Frequency

- Monthly (recommended: first Saturday)

## Steps

1. Prepare target environment:
   - Dedicated staging database.
   - App traffic disabled.
2. Pick latest backup:
   - `Get-ChildItem .\backups\mahalla-backup-*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1`
3. Restore backup:
   - `.\scripts\restore-neon.ps1 -DatabaseUrl $env:STAGING_DATABASE_URL -BackupFile <backup-file> -Force`
4. Run validation:
   - `npm run prisma:generate`
   - `npm run test:e2e -- --runInBand`
   - `npm run test:newman`
5. Record metrics:
   - Restore duration.
   - Validation pass/fail.
   - Data integrity issues.
6. Close drill:
   - Document findings and action items.

## Success Criteria

- Restore completes without SQL errors.
- Health and readiness endpoints are `200`.
- Newman suite passes.
- No critical data integrity issue found.
