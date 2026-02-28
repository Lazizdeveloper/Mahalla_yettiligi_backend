import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  upload(@Body() dto: UploadMediaDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.mediaService.upload(dto, actor.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() response: Response) {
    const media = await this.mediaService.getFile(id);
    response.setHeader('Content-Type', media.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${media.filename}"`,
    );
    response.send(Buffer.from(media.content));
  }
}
