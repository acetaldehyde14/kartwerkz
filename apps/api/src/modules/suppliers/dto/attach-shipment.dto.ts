import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AttachShipmentDto {
  @ApiProperty()
  @IsString()
  carrier!: string;

  @ApiProperty()
  @IsString()
  trackingNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationAddressId?: string;
}
