import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderStatus, User } from '@prisma/client';
import { AdminService } from './admin.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatusService } from '../orders/order-status.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('admin-orders')
@Controller('admin/orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrdersController {
  constructor(
    private readonly adminService: AdminService,
    private readonly orderStatusService: OrderStatusService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async list(
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listOrders(
      status,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    const order = await this.orderStatusService.transition(
      id,
      dto.status,
      `admin:${user.id}`,
      dto.note,
    );
    await this.auditService.log(user.id, 'order.status.update', 'Order', id, {
      toStatus: dto.status,
      note: dto.note,
    });
    return order;
  }
}
