import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendToSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;
}
