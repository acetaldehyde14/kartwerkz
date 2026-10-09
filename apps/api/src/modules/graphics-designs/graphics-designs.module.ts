import { Module } from '@nestjs/common';
import { GraphicsDesignsController } from './graphics-designs.controller';
import { GraphicsDesignsService } from './graphics-designs.service';

@Module({
  controllers: [GraphicsDesignsController],
  providers: [GraphicsDesignsService],
})
export class GraphicsDesignsModule {}
