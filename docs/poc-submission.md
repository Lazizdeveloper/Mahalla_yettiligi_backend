# MVP Coding Topshirig'i - Proof of Concept (PoC) Yuborish Hujjati

- Loyiha: Mahalla Yettiligi Backend
- Sana: 2026-03-04
- Hujjat turi: Yuborishga tayyor yagona PoC fayl

## 1. Maqsad

Ushbu PoC orqali taklif qilingan backend arxitekturaning asosiy qismi amalda ishlashi tasdiqlandi.

Tasdiqlangan vertikal oqim:

`Auth (OTP + 2FA) -> Complaint -> SLA Escalation -> Notification Queue -> Readiness Health`

## 2. Qamrov

PoC ichiga kiritilgan funksiyalar:

- OTP so'rash va tekshirish.
- Privileged rollar uchun majburiy 2FA.
- Murojaat (complaint) yaratish va javob berish.
- SLA muddat buzilganda cron asosida eskalatsiya.
- BullMQ queue orqali notification yuborish va worker bilan qayta ishlash.
- Readiness endpoint orqali DB, Redis, SLA worker holatini tekshirish.

## 3. Arxitektura bo'yicha kod dalillari

- Bootstrap, global security/error/logging:
  - `src/main.ts`
- Auth oqimi:
  - `src/auth/auth.controller.ts`
  - `src/auth/auth.service.ts`
- Complaint va notification triggerlari:
  - `src/complaints/complaints.service.ts`
- SLA scheduler:
  - `src/sla/sla.service.ts`
- Queue producer/consumer:
  - `src/notifications/notifications.service.ts`
  - `src/notifications/notifications.processor.ts`
- Readiness check:
  - `src/health/health.service.ts`

## 4. Muhit va seed mosligi

PoC uchun ishlatilgan seeded `SUPER_ADMIN` telefon:

- `+998949395123` (`prisma/seed.ts`)

Newman default admin telefoni seed bilan moslashtirildi:

- `scripts/run-newman.mjs`
- `scripts/generate-postman-assets.mjs`
- `postman/mahalla-yettiligi-local.postman_environment.json`
- `README.md`

## 5. Ishga tushirish buyruqlari

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Alohida terminalda:

```bash
npm run test -- --runInBand
npm run test:e2e -- --runInBand
npm run postman:generate
npm run test:newman
```

Ixtiyoriy override:

```bash
POSTMAN_ADMIN_PHONE=+998949395123 npm run test:newman
```

## 6. Bajarilgan verifikatsiya holati (2026-03-04)

- `npm run postman:generate`: PASS
- `npm run test -- --runInBand`: PASS
- `npm run test:e2e -- --runInBand`: PASS
- `npm run test:newman`: PASS
  - 41 ta request
  - 48 ta assertion
  - 0 ta xato
- `npm run perf:k6:baseline`: BLOCKED (`k6` CLI lokalda o'rnatilmagan)

## 7. Kutilgan natija va kuzatilgan holat

- `/api/v1/health` endpoint `200` qaytardi.
- `/api/v1/health/readiness` endpoint `200` qaytardi.
- OTP + 2FA auth oqimi ishladi.
- Complaint create/update/respond oqimi ishladi.
- Notification queue orqali email-channel yozuvlari qayta ishlanishi kuzatildi.
- Regression oqimi (Postman/Newman) to'liq yakunlandi.

## 8. Cheklovlar

- Integratsiyalar PoC bosqichida mock providerlar bilan tekshirildi.
- `k6` performance baseline bu muhitda CLI yo'qligi sabab yakunlanmadi.

## 9. Xulosa

PoC natijalari taklif qilingan backend arxitektura MVP bosqichi uchun texnik jihatdan ishlashini tasdiqlaydi: xavfsizlik oqimi, biznes jarayon, asinxron queue va operational readiness bir butun oqimda muvaffaqiyatli ko'rsatildi.

## 10. GitHub Havolalar

- Repository: `https://github.com/Lazizdeveloper/Mahalla_yettiligi_backend`
- Branch: `https://github.com/Lazizdeveloper/Mahalla_yettiligi_backend/tree/feat/backend-v1-bootstrap`
- PoC submission fayli: `https://github.com/Lazizdeveloper/Mahalla_yettiligi_backend/blob/feat/backend-v1-bootstrap/docs/poc-submission.md`
- So'nggi commit: `https://github.com/Lazizdeveloper/Mahalla_yettiligi_backend/commit/9fa412c57aec68cf7814e36627add1c50d641444`
