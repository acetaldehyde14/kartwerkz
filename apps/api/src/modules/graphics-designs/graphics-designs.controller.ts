import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GraphicsDesignsService } from './graphics-designs.service';

@ApiTags('graphics-designs')
@Controller('graphics-designs')
export class GraphicsDesignsController {
  constructor(private readonly graphicsDesignsService: GraphicsDesignsService) {}

  @Get()
  async list(@Query('kartModelId') kartModelId?: string) {
    return this.graphicsDesignsService.list(kartModelId);
  }
}
