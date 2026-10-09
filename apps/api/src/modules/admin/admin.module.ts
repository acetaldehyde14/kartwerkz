import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminService } from './admin.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [AdminOrdersController, AdminDashboardController],
  providers: [AdminService],
})
export class AdminModule {}
