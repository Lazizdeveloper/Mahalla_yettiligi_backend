# Mahalla Yettiligi Backend

NestJS + Prisma + Neon PostgreSQL backend for Mahalla monitoring platform.

## Stack

- NestJS 11
- Prisma ORM
- PostgreSQL (Neon)
- Redis + BullMQ (notifications queue)
- Swagger (`/docs`)
- Newman (API regression)
- k6 (performance baseline)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

4. Optional seed data:

```bash
npm run prisma:seed
```

5. Run application:

```bash
npm run start:dev
```

Base API: `http://localhost:4000/api/v1`  
Swagger: `http://localhost:4000/docs`

## API modules

- Auth (`/auth/otp/request`, `/auth/otp/verify`, `/auth/2fa/verify`, `/auth/refresh`, `/auth/logout`)
- Users
- Mahallas
- Posts
- Media (DB blob, 10MB/file)
- Complaints + SLA escalation (every 5 minutes)
- Events calendar
- Work tracking (check-in/check-out/location logs)
- Monthly Reports
- Ratings
- Dashboard analytics
- Audit logs
- Notifications queue
- Integration providers (SMS real/mock, OneID/Geo/E-sign/ERP provider flags)

## Security and reliability

- JWT access/refresh with refresh-token rotation and revocation.
- OTP request/verify rate limiting.
- Mandatory 2FA flow for privileged roles (`STAFF`, `ADMIN`, `SUPER_ADMIN`).
- Configurable CORS allowlist (`CORS_ORIGINS`).
- Request body limit (`BODY_LIMIT`).
- Security headers via `helmet`.
- Standardized error contract (`code`, `message`, `details`, `path`, `timestamp`, `requestId`).
- Structured request logs with request IDs.
- Readiness endpoint: `/api/v1/health/readiness` (DB, Redis, SLA worker checks).

## Tests

```bash
npm run test
npm run test:e2e
npm run test:cov -- --runInBand
```

## API regression (Postman/Newman)

Generate assets:

```bash
npm run postman:generate
```

Run full regression:

```bash
npm run test:newman
```

Optional override:

```bash
POSTMAN_ADMIN_PHONE=+998900000001 npm run test:newman
```

## Backup and restore

Use the helper script for manual SQL backups:

```powershell
.\scripts\backup-neon.ps1 -DatabaseUrl $env:DATABASE_URL
```

Daily backup with retention:

```powershell
.\scripts\backup-neon-rotation.ps1 -DatabaseUrl $env:DATABASE_URL -OutputDirectory .\backups -RetentionDays 30
```

Register scheduled daily backup task (Windows):

```powershell
.\scripts\register-backup-task.ps1 -DatabaseUrl $env:DATABASE_URL -OutputDirectory .\backups -Schedule "02:30"
```

Restore from backup:

```powershell
.\scripts\restore-neon.ps1 -DatabaseUrl $env:DATABASE_URL -BackupFile .\backups\mahalla-backup-YYYYMMDD-HHmmss.sql -Force
```

## Performance baseline

Run k6 baseline:

```bash
npm run perf:k6:baseline
```

## CI quality gate

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs:

- `lint`
- `test:cov`
- `test:e2e`
- Prisma migrate + seed
- Newman regression suite

## Operational docs

- Release checklist: `docs/release-checklist.md`
- Restore drill playbook: `docs/restore-drill.md`
