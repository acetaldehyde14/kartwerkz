import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  savedConfigurationId!: string;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;
}
