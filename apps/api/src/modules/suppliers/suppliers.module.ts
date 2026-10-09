import { Module } from '@nestjs/common';
import { SuppliersAdminController } from './suppliers-admin.controller';
import { SupplierFulfillmentService } from './supplier-fulfillment.service';
import { ManualFulfillmentAdapter } from './adapters/manual-fulfillment.adapter';
import {
  ApiFulfillmentAdapter,
  EmailFulfillmentAdapter,
  PortalFulfillmentAdapter,
  WebhookFulfillmentAdapter,
} from './adapters/unimplemented-fulfillment.adapters';
import { OrdersModule } from '../orders/orders.module';
import { ArtworkModule } from '../artwork/artwork.module';

@Module({
  imports: [OrdersModule, ArtworkModule],
  controllers: [SuppliersAdminController],
  providers: [
    SupplierFulfillmentService,
    ManualFulfillmentAdapter,
    EmailFulfillmentAdapter,
    ApiFulfillmentAdapter,
    WebhookFulfillmentAdapter,
    PortalFulfillmentAdapter,
  ],
})
export class SuppliersModule {}
