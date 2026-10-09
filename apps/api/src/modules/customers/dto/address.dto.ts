import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2)
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateAddressDto extends CreateAddressDto {}
