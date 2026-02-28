import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { IntegrationsService } from './integrations.service';
import { ESignRequestDto } from './dto/esign-request.dto';
import { ErpComplaintPushDto } from './dto/erp-complaint-push.dto';
import { OneIdVerifyDto } from './dto/oneid-verify.dto';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { SmsSendDto } from './dto/sms-send.dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('sms/send')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  sendSms(@Body() dto: SmsSendDto) {
    return this.integrationsService.sendSms(dto);
  }

  @Post('oneid/verify')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  verifyOneId(@Body() dto: OneIdVerifyDto) {
    return this.integrationsService.verifyOneId(dto);
  }

  @Post('geo/reverse-geocode')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  reverseGeocode(@Body() dto: ReverseGeocodeDto) {
    return this.integrationsService.reverseGeocode(dto);
  }

  @Post('e-sign/sign')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  requestESign(@Body() dto: ESignRequestDto) {
    return this.integrationsService.requestESign(dto);
  }

  @Post('erp/complaints/push')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  pushComplaintToErp(@Body() dto: ErpComplaintPushDto) {
    return this.integrationsService.pushComplaintToErp(dto);
  }
}
