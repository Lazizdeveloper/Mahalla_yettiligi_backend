import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({ example: 'image.jpg' })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @ApiProperty({
    description: 'Base64 encoded file content',
  })
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  contentBase64!: string;
}
