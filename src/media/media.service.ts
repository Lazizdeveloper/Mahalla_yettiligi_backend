import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@Injectable()
export class MediaService {
  private static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async upload(dto: UploadMediaDto, actorId: string) {
    const buffer = Buffer.from(dto.contentBase64, 'base64');

    if (buffer.length > MediaService.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const checksum = createHash('sha256').update(buffer).digest('hex');

    const media = await this.prisma.mediaFile.create({
      data: {
        filename: dto.filename,
        mimeType: dto.mimeType,
        sizeBytes: buffer.length,
        content: buffer,
        checksum,
        uploadedById: actorId,
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        checksum: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'MEDIA_UPLOAD',
      entityType: 'MediaFile',
      entityId: media.id,
      payload: {
        filename: media.filename,
        sizeBytes: media.sizeBytes,
      },
    });

    return media;
  }

  async findOne(id: string) {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        checksum: true,
        createdAt: true,
        uploadedById: true,
      },
    });

    if (!media) {
      throw new NotFoundException('Media file is not found');
    }

    return media;
  }

  async getFile(id: string) {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        content: true,
      },
    });

    if (!media) {
      throw new NotFoundException('Media file is not found');
    }

    return media;
  }
}
