import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { SupplierFulfillmentService } from './supplier-fulfillment.service';
import { SendToSupplierDto } from './dto/send-to-supplier.dto';
import { AttachShipmentDto } from './dto/attach-shipment.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('admin-suppliers')
@Controller('admin/orders/:orderId')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class SuppliersAdminController {
  constructor(
    private readonly supplierFulfillmentService: SupplierFulfillmentService,
    private readonly auditService: AuditService,
  ) {}

  @Post('send-to-supplier')
  async sendToSupplier(
    @Param('orderId') orderId: string,
    @Body() dto: SendToSupplierDto,
    @CurrentUser() user: User,
  ) {
    const supplierOrder = await this.supplierFulfillmentService.sendToSupplier(
      orderId,
      dto.supplierId,
      `admin:${user.id}`,
    );
    await this.auditService.log(user.id, 'order.send_to_supplier', 'Order', orderId, {
      supplierOrderId: supplierOrder.id,
    });
    return supplierOrder;
  }

  @Post('supplier-order/in-production')
  async markInProduction(@Param('orderId') orderId: string, @CurrentUser() user: User) {
    const result = await this.supplierFulfillmentService.markInProduction(
      orderId,
      `admin:${user.id}`,
    );
    await this.auditService.log(user.id, 'order.supplier_order.in_production', 'Order', orderId);
    return result;
  }

  @Post('shipment')
  async attachShipment(
    @Param('orderId') orderId: string,
    @Body() dto: AttachShipmentDto,
    @CurrentUser() user: User,
  ) {
    const shipment = await this.supplierFulfillmentService.attachShipment(
      orderId,
      `admin:${user.id}`,
      dto,
    );
    await this.auditService.log(user.id, 'order.shipment.attach', 'Order', orderId, { ...dto });
    return shipment;
  }

  @Post('shipment/delivered')
  async markDelivered(@Param('orderId') orderId: string, @CurrentUser() user: User) {
    const shipment = await this.supplierFulfillmentService.markDelivered(
      orderId,
      `admin:${user.id}`,
    );
    await this.auditService.log(user.id, 'order.shipment.delivered', 'Order', orderId);
    return shipment;
  }
}
