import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupplierOrder, Shipment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatusService } from '../orders/order-status.service';
import { ArtworkService } from '../artwork/artwork.service';
import { ProductionPackage, SupplierAdapter } from './supplier-adapter.interface';
import { ManualFulfillmentAdapter } from './adapters/manual-fulfillment.adapter';
import {
  ApiFulfillmentAdapter,
  EmailFulfillmentAdapter,
  PortalFulfillmentAdapter,
  WebhookFulfillmentAdapter,
} from './adapters/unimplemented-fulfillment.adapters';

@Injectable()
export class SupplierFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderStatusService: OrderStatusService,
    private readonly artworkService: ArtworkService,
    private readonly manualAdapter: ManualFulfillmentAdapter,
    private readonly emailAdapter: EmailFulfillmentAdapter,
    private readonly apiAdapter: ApiFulfillmentAdapter,
    private readonly webhookAdapter: WebhookFulfillmentAdapter,
    private readonly portalAdapter: PortalFulfillmentAdapter,
  ) {}

  /** Strategy selection keyed by Supplier.integrationMethod. */
  private adapterFor(integrationMethod: string): SupplierAdapter {
    switch (integrationMethod) {
      case 'MANUAL':
        return this.manualAdapter;
      case 'EMAIL':
        return this.emailAdapter;
      case 'API':
        return this.apiAdapter;
      case 'WEBHOOK':
        return this.webhookAdapter;
      case 'PORTAL':
        return this.portalAdapter;
      default:
        throw new BadRequestException(`Unknown supplier integration method: ${integrationMethod}`);
    }
  }

  async sendToSupplier(
    orderId: string,
    supplierId: string | undefined,
    actor: string,
  ): Promise<SupplierOrder> {
    const approvedRevision = await this.artworkService.getApprovedRevisionForProduction(orderId);
    if (!approvedRevision) {
      throw new BadRequestException(
        'Order cannot be sent to supplier: artwork has not been approved for production',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const firstItem = order.items[0];
    if (!firstItem) throw new BadRequestException('Order has no items');

    const supplier = supplierId
      ? await this.prisma.supplier.findUnique({ where: { id: supplierId } })
      : await this.prisma.supplier.findFirst({ where: { isActive: true } });
    if (!supplier) throw new NotFoundException('No active supplier found');

    const snapshot = firstItem.configurationSnapshot as {
      kartModelId: string;
      graphicsDesignId: string;
      colours: { primary: string; secondary: string; accent: string };
      finish: string;
      driver?: { name?: string; number?: string; countryCode?: string };
      specialInstructions?: string;
    };

    const [kartModel, graphicsDesign] = await Promise.all([
      this.prisma.kartModel.findUnique({
        where: { id: snapshot.kartModelId },
        include: { manufacturer: true },
      }),
      this.prisma.graphicsDesign.findUnique({ where: { id: snapshot.graphicsDesignId } }),
    ]);

    const pkg: ProductionPackage = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      kartModel: {
        manufacturer: kartModel?.manufacturer.name ?? 'Unknown',
        model: kartModel?.name ?? 'Unknown',
      },
      graphicsDesign: {
        name: graphicsDesign?.name ?? 'Unknown',
        tier: graphicsDesign?.tier ?? 'PREMADE',
      },
      colours: snapshot.colours,
      finish: snapshot.finish,
      driver: snapshot.driver,
      specialInstructions: snapshot.specialInstructions,
      approvedArtworkObjectKey: approvedRevision.fileObjectKey,
    };

    const adapter = this.adapterFor(supplier.integrationMethod);
    const result = await adapter.submitProductionPackage(pkg);

    const supplierOrder = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplierOrder.create({
        data: {
          orderId: order.id,
          supplierId: supplier.id,
          status: 'SUBMITTED',
          approvedArtworkRevisionId: approvedRevision.id,
          productionPackageObjectKey: result.productionPackageObjectKey,
          submittedAt: result.submittedAt,
        },
      });
      return created;
    });

    await this.orderStatusService.transition(
      orderId,
      'SENT_TO_SUPPLIER',
      actor,
      `Sent to supplier ${supplier.name}`,
    );

    return supplierOrder;
  }

  async markInProduction(orderId: string, actor: string): Promise<SupplierOrder> {
    const supplierOrder = await this.prisma.supplierOrder.findUnique({ where: { orderId } });
    if (!supplierOrder) throw new NotFoundException('Supplier order not found');

    const updated = await this.prisma.supplierOrder.update({
      where: { orderId },
      data: { status: 'IN_PRODUCTION' },
    });
    await this.orderStatusService.transition(orderId, 'IN_PRODUCTION', actor);
    return updated;
  }

  async attachShipment(
    orderId: string,
    actor: string,
    data: {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
      destinationAddressId?: string;
    },
  ): Promise<Shipment> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const shipment = await this.prisma.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        destinationAddressId: data.destinationAddressId,
        status: 'SHIPPED',
        shippedAt: new Date(),
      },
      update: {
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        status: 'SHIPPED',
        shippedAt: new Date(),
      },
    });

    await this.prisma.supplierOrder.updateMany({
      where: { orderId },
      data: { status: 'COMPLETED' },
    });
    await this.orderStatusService.transition(
      orderId,
      'SHIPPED',
      actor,
      `Shipped via ${data.carrier}`,
    );
    return shipment;
  }

  async markDelivered(orderId: string, actor: string): Promise<Shipment> {
    const shipment = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const updated = await this.prisma.shipment.update({
      where: { orderId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
    await this.orderStatusService.transition(orderId, 'DELIVERED', actor);
    return updated;
  }
}
