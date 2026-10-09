import { Module } from '@nestjs/common';
import { KartCatalogController } from './kart-catalog.controller';
import { KartCatalogService } from './kart-catalog.service';

@Module({
  controllers: [KartCatalogController],
  providers: [KartCatalogService],
})
export class KartCatalogModule {}
