import { Module } from '@nestjs/common';
import { ArtworkAdminController } from './artwork-admin.controller';
import { ArtworkCustomerController } from './artwork-customer.controller';
import { ArtworkService } from './artwork.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [ArtworkAdminController, ArtworkCustomerController],
  providers: [ArtworkService],
  exports: [ArtworkService],
})
export class ArtworkModule {}
