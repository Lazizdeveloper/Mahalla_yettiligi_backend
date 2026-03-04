# PoC Demo Runbook

This runbook is for a 5-10 minute live PoC demonstration.

## 1. Preconditions

- PostgreSQL is reachable via `DATABASE_URL`.
- Redis is running and reachable via `REDIS_HOST`/`REDIS_PORT`.
- `.env` is configured.
- Project dependencies are installed.

## 2. Setup Commands

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Open:

- Swagger: `http://localhost:4000/docs`
- Health: `http://localhost:4000/api/v1/health`
- Readiness: `http://localhost:4000/api/v1/health/readiness`

## 3. Demo Script

1. Health and readiness
- Call `/api/v1/health` and show status `ok`.
- Call `/api/v1/health/readiness` and show `database`, `redis`, `sla` checks.

2. Auth (privileged path with 2FA)
- `POST /api/v1/auth/otp/request` with phone `+998949395123`.
- `POST /api/v1/auth/otp/verify` using returned OTP in non-production mode.
- If `requiresTwoFactor=true`, call `POST /api/v1/auth/2fa/verify` and get `accessToken`.

3. Complaint flow
- `POST /api/v1/complaints` with bearer token.
- `PATCH /api/v1/complaints/{id}/status` to `IN_PROGRESS`.
- `POST /api/v1/complaints/{id}/respond` and show answered state.

4. Async notifications
- Show records in `Notification` table move from `PENDING` to `SENT` for email channel.

5. SLA worker proof
- Explain cron schedule (`EVERY_5_MINUTES`) from `src/sla/sla.service.ts`.
- Show escalation behavior on overdue complaint (`escalationFlag=true`).

## 4. Automated Evidence Commands

```bash
npm run test
npm run test:e2e
npm run postman:generate
npm run test:newman
npm run perf:k6:baseline
```

## 5. Evidence Checklist

- [ ] Screenshot: Swagger with modules visible.
- [ ] Screenshot: `/health` response.
- [ ] Screenshot: `/health/readiness` checks.
- [ ] Screenshot: Auth flow response with token.
- [ ] Screenshot: Complaint create/respond endpoints.
- [ ] Screenshot: Notification status transition.
- [ ] Terminal output: `test`, `test:e2e`, `test:newman`.

## 6. Troubleshooting

- Auth fails in Newman:
  - Confirm seeded super admin phone: `+998949395123`.
  - Run with explicit override:
    - `POSTMAN_ADMIN_PHONE=+998949395123 npm run test:newman`
- Readiness degraded:
  - Verify Redis is up and env vars are correct.
  - Verify database connectivity in `DATABASE_URL`.
- `k6` command not found:
  - Install `k6` CLI locally.
  - Re-run `npm run perf:k6:baseline` after installation.
