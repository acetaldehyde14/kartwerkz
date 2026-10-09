import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PricingRuleType } from '@prisma/client';

export class CreatePricingRuleDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ enum: PricingRuleType })
  @IsEnum(PricingRuleType)
  type!: PricingRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeKey?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountMinorUnits!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}
