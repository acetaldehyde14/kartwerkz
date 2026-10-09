import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty()
  @IsEmail()
  contactEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddressId?: string;
}
