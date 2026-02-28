# Release Checklist

## 1. Pre-release validation

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run test -- --runInBand`
- [ ] `npm run test:e2e -- --runInBand`
- [ ] `npm run test:cov -- --runInBand`
- [ ] `npm run postman:generate`
- [ ] `npm run test:newman`

## 2. Database safety

- [ ] Run backup:
  - `.\scripts\backup-neon-rotation.ps1 -DatabaseUrl $env:DATABASE_URL -OutputDirectory .\backups -RetentionDays 30`
- [ ] Verify backup file exists and is non-empty.
- [ ] Ensure migration plan is reviewed.

## 3. Deployment

- [ ] `npm run build`
- [ ] `npm run prisma:migrate:deploy`
- [ ] Deploy `dist/` artifacts.
- [ ] Confirm service starts and `/api/v1/health` returns `200`.

## 4. Post-deploy smoke checks

- [ ] `/api/v1/health`
- [ ] `/api/v1/health/readiness`
- [ ] Auth flow: OTP request + verify + 2FA verify
- [ ] Core CRUD smoke (mahalla, users, posts, complaints)

## 5. Rollback readiness

- [ ] Previous deployment artifact is available.
- [ ] Restore script tested:
  - `.\scripts\restore-neon.ps1 -DatabaseUrl $env:DATABASE_URL -BackupFile .\backups\mahalla-backup-<timestamp>.sql -Force`
- [ ] Rollback contact owner assigned.
