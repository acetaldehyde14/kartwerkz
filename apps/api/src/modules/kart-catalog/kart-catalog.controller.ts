import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KartCatalogService } from './kart-catalog.service';

@ApiTags('kart-catalog')
@Controller()
export class KartCatalogController {
  constructor(private readonly kartCatalogService: KartCatalogService) {}

  @Get('kart-manufacturers')
  async listManufacturers() {
    return this.kartCatalogService.listManufacturers();
  }

  @Get('kart-models')
  async listModels(@Query('manufacturerId') manufacturerId?: string) {
    return this.kartCatalogService.listModels(manufacturerId);
  }
}
