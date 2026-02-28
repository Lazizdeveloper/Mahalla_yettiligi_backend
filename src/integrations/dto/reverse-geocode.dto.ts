import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty()
  @IsLatitude()
  latitude!: string;

  @ApiProperty()
  @IsLongitude()
  longitude!: string;
}
