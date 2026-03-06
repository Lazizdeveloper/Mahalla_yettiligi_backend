import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  APP_HOST: string = 'localhost';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL: string = '15m';

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL: string = '7d';

  @IsOptional()
  @IsInt()
  @Min(30)
  OTP_TTL_SECONDS: number = 300;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  OTP_MAX_ATTEMPTS: number = 5;

  @IsOptional()
  @IsString()
  REDIS_HOST: string = '127.0.0.1';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD: string = '';

  @IsOptional()
  @IsString()
  TIMEZONE: string = 'Asia/Tashkent';

  @IsOptional()
  @IsString()
  APP_NAME: string = 'Mahalla Yettiligi API';

  @IsOptional()
  @IsString()
  CORS_ORIGINS: string = '';

  @IsOptional()
  @IsString()
  BODY_LIMIT: string = '10mb';

  @IsOptional()
  @IsIn(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'])
  ENABLE_SECURITY_HEADERS: string = 'true';

  @IsOptional()
  @IsInt()
  @Min(30)
  OTP_REQUEST_WINDOW_SECONDS: number = 600;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  OTP_REQUEST_MAX: number = 5;

  @IsOptional()
  @IsInt()
  @Min(30)
  OTP_VERIFY_WINDOW_SECONDS: number = 300;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  OTP_VERIFY_MAX: number = 10;

  @IsOptional()
  @IsIn(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'])
  OTP_EXPOSE_CODE_IN_RESPONSE: string = 'false';

  @IsOptional()
  @IsInt()
  @Min(30)
  TWO_FA_TTL_SECONDS: number = 300;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  TWO_FA_MAX_ATTEMPTS: number = 5;

  @IsOptional()
  @IsIn(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'])
  ENFORCE_TWO_FACTOR_FOR_PRIVILEGED: string = 'true';

  @IsOptional()
  @IsIn(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'])
  TWO_FA_EXPOSE_CODE_IN_RESPONSE: string = 'false';

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(15)
  BCRYPT_SALT_ROUNDS: number = 10;

  @IsOptional()
  @IsString()
  SMS_PROVIDER: string = 'mock';

  @IsOptional()
  @IsString()
  SMS_FROM: string = '';

  @IsOptional()
  @IsString()
  TWILIO_ACCOUNT_SID: string = '';

  @IsOptional()
  @IsString()
  TWILIO_AUTH_TOKEN: string = '';

  @IsOptional()
  @IsString()
  TWILIO_FROM_NUMBER: string = '';

  @IsOptional()
  @IsString()
  ONEID_PROVIDER: string = 'mock-oneid';

  @IsOptional()
  @IsString()
  GEO_PROVIDER: string = 'mock-geo-api';

  @IsOptional()
  @IsString()
  ESIGN_PROVIDER: string = 'mock-e-sign';

  @IsOptional()
  @IsString()
  ERP_PROVIDER: string = 'mock-erp';
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
