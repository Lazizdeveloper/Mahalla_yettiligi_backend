# MVP Coding Task - Proof of Concept Report

- Project: Mahalla Yettiligi Backend
- Date: 2026-03-04
- Scope owner: Backend team

## 1. Objective

This PoC validates that the proposed backend architecture works in an end-to-end "vertical slice" and is ready for MVP implementation.

Validated flow:

`Auth (OTP + 2FA) -> Complaint -> SLA Escalation -> Notification Queue -> Readiness Health`

## 2. PoC Scope

Included:

- OTP request/verify and mandatory 2FA for privileged roles.
- Complaint creation and response flow.
- SLA worker that escalates overdue complaints (cron).
- BullMQ notification queue and worker processing.
- Operational readiness endpoint (database, redis, SLA worker status).
- Automated regression and baseline quality gates (unit/e2e/newman/k6 smoke).

Not included:

- Real external provider credentials in production mode.
- Full production observability stack (APM, alerting dashboards, on-call routing).

## 3. Architecture Evidence (Code References)

- API bootstrap, global filters/interceptors, CORS/security headers:
  - `src/main.ts`
- Auth endpoints:
  - `src/auth/auth.controller.ts`
  - `src/auth/auth.service.ts`
- Complaint flow and notifications:
  - `src/complaints/complaints.service.ts`
- SLA escalation scheduler:
  - `src/sla/sla.service.ts`
- Notification queue producer/consumer:
  - `src/notifications/notifications.service.ts`
  - `src/notifications/notifications.processor.ts`
- Readiness checks:
  - `src/health/health.service.ts`

## 4. Environment and Seed Alignment

Seeded privileged user used for PoC auth:

- `+998949395123` (`SUPER_ADMIN`) from `prisma/seed.ts`

PoC update completed:

- Newman default admin phone aligned to `+998949395123` in:
  - `scripts/run-newman.mjs`
  - `scripts/generate-postman-assets.mjs`
  - `postman/mahalla-yettiligi-local.postman_environment.json`

## 5. Execution Plan (Reproducible)

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

In another terminal:

```bash
npm run test
npm run test:e2e
npm run postman:generate
npm run test:newman
npm run perf:k6:baseline
```

If required:

```bash
POSTMAN_ADMIN_PHONE=+998949395123 npm run test:newman
```

## 6. Expected Validation Results

- `/api/v1/health` returns `200` with status `ok`.
- `/api/v1/health/readiness` returns `200` with checks for `database`, `redis`, `sla`.
- Auth flow returns tokens after OTP (+2FA for privileged roles).
- Complaint response creates audit records and notifications.
- SLA worker marks overdue complaints with `escalationFlag=true`.
- Email-channel notifications are queued and marked `SENT` by processor.

## 6.1 Execution Status (2026-03-04)

- `npm run postman:generate`: PASS
- `npm run test -- --runInBand`: PASS
- `npm run test:e2e -- --runInBand`: PASS
- `npm run test:newman`: PASS (full API flow observed in request logs)
- `npm run perf:k6:baseline`: BLOCKED (`k6` CLI is not installed locally)

## 7. Risks and Follow-up

- Current integrations are safe for PoC; production requires real provider secrets and SLA contracts.
- Add alert thresholds for readiness degradation and queue lag in production.
- Add dedicated load profile for complaint-heavy and notification-heavy windows.

## 8. Conclusion

The PoC confirms that the proposed backend architecture is technically sound for MVP: security flow, core business processing, asynchronous jobs, and operational readiness are all represented and testable in one coherent slice.
