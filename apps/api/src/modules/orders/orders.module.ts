import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderStatusService],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}
