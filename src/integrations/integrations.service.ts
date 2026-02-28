import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { ESignRequestDto } from './dto/esign-request.dto';
import { ErpComplaintPushDto } from './dto/erp-complaint-push.dto';
import { OneIdVerifyDto } from './dto/oneid-verify.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { SmsSendDto } from './dto/sms-send.dto';

@Injectable()
export class IntegrationsService {
  constructor(private readonly configService: ConfigService) {}

  async sendSms(dto: SmsSendDto) {
    const provider = this.configService.get<string>(
      'integrations.sms.provider',
      'mock',
    );

    if (provider === 'twilio') {
      return this.sendViaTwilio(dto);
    }

    return this.sendViaMock(dto);
  }

  verifyOneId(dto: OneIdVerifyDto) {
    const provider = this.configService.get<string>(
      'integrations.oneId.provider',
      'mock-oneid',
    );
    return {
      provider,
      verified: dto.token.length > 10,
      externalUserId: createHash('md5').update(dto.token).digest('hex'),
    };
  }

  reverseGeocode(dto: ReverseGeocodeDto) {
    const provider = this.configService.get<string>(
      'integrations.geo.provider',
      'mock-geo-api',
    );
    return {
      provider,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: 'Mocked address, Tashkent, Uzbekistan',
    };
  }

  requestESign(dto: ESignRequestDto) {
    const provider = this.configService.get<string>(
      'integrations.eSign.provider',
      'mock-e-sign',
    );
    return {
      provider,
      requestId: createHash('sha1').update(dto.content).digest('hex'),
      status: 'pending_signature',
      createdAt: new Date().toISOString(),
    };
  }

  pushComplaintToErp(dto: ErpComplaintPushDto) {
    const provider = this.configService.get<string>(
      'integrations.erp.provider',
      'mock-erp',
    );
    return {
      provider,
      complaintId: dto.complaintId,
      status: 'accepted',
      externalRef: `ERP-${dto.complaintId.slice(0, 8).toUpperCase()}`,
      pushedAt: new Date().toISOString(),
    };
  }

  private sendViaMock(dto: SmsSendDto) {
    return {
      provider: 'mock-sms-gateway',
      status: 'queued',
      phone: dto.phone,
      messageLength: dto.message.length,
      sentAt: new Date().toISOString(),
    };
  }

  private async sendViaTwilio(dto: SmsSendDto) {
    const accountSid = this.configService.get<string>(
      'integrations.sms.twilio.accountSid',
    );
    const authToken = this.configService.get<string>(
      'integrations.sms.twilio.authToken',
    );
    const configuredFrom = this.configService.get<string>(
      'integrations.sms.twilio.fromNumber',
    );
    const fallbackFrom = this.configService.get<string>(
      'integrations.sms.from',
    );
    const from = configuredFrom || fallbackFrom;

    if (!accountSid || !authToken || !from) {
      throw new InternalServerErrorException(
        'Twilio SMS provider is not fully configured',
      );
    }

    const body = new URLSearchParams({
      To: dto.phone,
      From: from,
      Body: dto.message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

    let responseJson: Record<string, unknown> = {};
    try {
      responseJson = (await response.json()) as Record<string, unknown>;
    } catch {
      responseJson = {};
    }

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Twilio SMS request failed',
        provider: 'twilio',
        status: response.status,
        providerCode:
          typeof responseJson.code === 'number' ? responseJson.code : undefined,
      });
    }

    return {
      provider: 'twilio',
      status: 'queued',
      phone: dto.phone,
      sid: typeof responseJson.sid === 'string' ? responseJson.sid : undefined,
      sentAt: new Date().toISOString(),
    };
  }
}
