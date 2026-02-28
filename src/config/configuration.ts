const parseIntValue = (raw: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (raw: string | undefined, fallback: boolean) => {
  if (raw === undefined) {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const splitCsv = (raw: string | undefined) =>
  (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'Mahalla Yettiligi API',
    host: process.env.APP_HOST ?? 'localhost',
    port: parseIntValue(process.env.PORT, 3000),
    timezone: process.env.TIMEZONE ?? 'Asia/Tashkent',
    environment: process.env.NODE_ENV ?? 'development',
    corsOrigins: splitCsv(process.env.CORS_ORIGINS),
    bodyLimit: process.env.BODY_LIMIT ?? '10mb',
    enableSecurityHeaders: parseBoolean(
      process.env.ENABLE_SECURITY_HEADERS,
      true,
    ),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  otp: {
    ttlSeconds: parseIntValue(process.env.OTP_TTL_SECONDS, 300),
    maxAttempts: parseIntValue(process.env.OTP_MAX_ATTEMPTS, 5),
    requestWindowSeconds: parseIntValue(
      process.env.OTP_REQUEST_WINDOW_SECONDS,
      600,
    ),
    requestMax: parseIntValue(process.env.OTP_REQUEST_MAX, 5),
    verifyWindowSeconds: parseIntValue(
      process.env.OTP_VERIFY_WINDOW_SECONDS,
      300,
    ),
    verifyMax: parseIntValue(process.env.OTP_VERIFY_MAX, 10),
  },
  twoFactor: {
    ttlSeconds: parseIntValue(process.env.TWO_FA_TTL_SECONDS, 300),
    maxAttempts: parseIntValue(process.env.TWO_FA_MAX_ATTEMPTS, 5),
    enforceForPrivileged: parseBoolean(
      process.env.ENFORCE_TWO_FACTOR_FOR_PRIVILEGED,
      true,
    ),
  },
  security: {
    bcryptSaltRounds: parseIntValue(process.env.BCRYPT_SALT_ROUNDS, 10),
  },
  integrations: {
    sms: {
      provider: process.env.SMS_PROVIDER ?? 'mock',
      from: process.env.SMS_FROM ?? '',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
        authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
        fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
      },
    },
    oneId: {
      provider: process.env.ONEID_PROVIDER ?? 'mock-oneid',
    },
    geo: {
      provider: process.env.GEO_PROVIDER ?? 'mock-geo-api',
    },
    eSign: {
      provider: process.env.ESIGN_PROVIDER ?? 'mock-e-sign',
    },
    erp: {
      provider: process.env.ERP_PROVIDER ?? 'mock-erp',
    },
  },
  redis: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseIntValue(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
  },
});
