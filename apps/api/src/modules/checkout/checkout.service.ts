import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { CURRENT_CONFIGURATION_SCHEMA_VERSION, type KitConfiguration } from '@kartwerkz/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { OwnerContext } from '../configurations/configurations.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider.interface';

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  checkoutSessionId: string;
  checkoutUrl: string;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly ordersService: OrdersService,
    private readonly orderStatusService: OrderStatusService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  private buildConfigurationSnapshot(savedConfig: {
    kartModelId: string;
    graphicsDesignId: string;
    primaryColour: string;
    secondaryColour: string;
    accentColour: string;
    driverName: string | null;
    raceNumber: string | null;
    countryCode: string | null;
    finish: string;
    specialInstructions: string | null;
    logoPlacements: {
      uploadedAssetId: string;
      bodyworkRegion: string;
      x: number;
      y: number;
      scale: number;
      rotationDegrees: number;
    }[];
  }): KitConfiguration {
    return {
      schemaVersion: CURRENT_CONFIGURATION_SCHEMA_VERSION as 1,
      kartModelId: savedConfig.kartModelId,
      graphicsDesignId: savedConfig.graphicsDesignId,
      colours: {
        primary: savedConfig.primaryColour,
        secondary: savedConfig.secondaryColour,
        accent: savedConfig.accentColour,
      },
      driver: {
        name: savedConfig.driverName ?? undefined,
        number: savedConfig.raceNumber ?? undefined,
        countryCode: savedConfig.countryCode ?? undefined,
      },
      finish: savedConfig.finish as KitConfiguration['finish'],
      logos: savedConfig.logoPlacements.map((lp) => ({
        uploadedAssetId: lp.uploadedAssetId,
        bodyworkRegion: lp.bodyworkRegion,
        x: lp.x,
        y: lp.y,
        scale: lp.scale,
        rotationDegrees: lp.rotationDegrees,
      })),
      specialInstructions: savedConfig.specialInstructions ?? undefined,
    };
  }

  async createCheckoutSession(
    owner: OwnerContext,
    contactEmail: string,
    shippingAddressId?: string,
  ): Promise<CheckoutResult> {
    if (!owner.userId && !owner.guestSessionId) {
      // Defensive — GuestSessionMiddleware always sets one of these, but
      // never fall through to an unfiltered Cart lookup if it somehow didn't.
      throw new BadRequestException('No user or guest session context available');
    }
    const cartWhere = owner.userId
      ? { userId: owner.userId }
      : { guestSessionId: owner.guestSessionId };
    const cart = await this.prisma.cart.findFirst({
      where: cartWhere,
      include: {
        items: {
          include: {
            product: true,
            savedConfiguration: { include: { logoPlacements: true, graphicsDesign: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Recompute every line server-side at checkout — never trust the cart's
    // stored unitPriceMinorUnits (it may be stale if admin pricing changed).
    let subtotal = 0;
    let shipping = 0;
    let currency = cart.currency;
    const lineItems: {
      productId: string;
      quantity: number;
      unitPriceMinorUnits: number;
      totalPriceMinorUnits: number;
      configurationSnapshot: KitConfiguration;
    }[] = [];

    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(`Product ${item.product.name} is no longer available`);
      }
      const breakdown = await this.pricingService.priceConfiguration(
        item.productId,
        item.savedConfiguration.finish,
        item.savedConfiguration.graphicsDesign.tier,
      );
      currency = breakdown.currency;
      subtotal += breakdown.total.amountMinorUnits * item.quantity;
      shipping = Math.max(shipping, breakdown.shipping.amountMinorUnits);
      lineItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceMinorUnits: breakdown.total.amountMinorUnits,
        totalPriceMinorUnits: breakdown.total.amountMinorUnits * item.quantity,
        configurationSnapshot: this.buildConfigurationSnapshot(item.savedConfiguration),
      });
    }

    const total = subtotal + shipping;
    const orderNumber = await this.ordersService.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: owner.userId,
          guestSessionId: owner.guestSessionId,
          contactEmail,
          shippingAddressId,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          subtotalMinorUnits: subtotal,
          shippingMinorUnits: shipping,
          totalMinorUnits: total,
          currency,
        },
      });

      await tx.orderItem.createMany({
        data: lineItems.map((li) => ({
          orderId: createdOrder.id,
          productId: li.productId,
          quantity: li.quantity,
          unitPriceMinorUnits: li.unitPriceMinorUnits,
          totalPriceMinorUnits: li.totalPriceMinorUnits,
          currency,
          configurationSnapshot: li.configurationSnapshot,
        })),
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: createdOrder.id,
          fromStatus: null,
          toStatus: 'PENDING_PAYMENT',
          actor: 'system',
        },
      });

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          provider: 'stripe',
          status: 'PENDING',
          amountMinorUnits: total,
          currency,
        },
      });

      // Converting the cart to an order consumes it.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    const session = await this.paymentProvider.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountMinorUnits: total,
      currency,
      customerEmail: contactEmail,
    });

    await this.prisma.payment.updateMany({
      where: { orderId: order.id },
      data: { providerSessionId: session.sessionId },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutSessionId: session.sessionId,
      checkoutUrl: session.url,
    };
  }

  /**
   * Dev-only shortcut standing in for the Stripe webhook when
   * DevPaymentAdapter is active (no real Stripe account configured).
   * NEVER wire this up in production — see CheckoutController#devConfirm.
   */
  async devConfirmPayment(orderId: string): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { orderId },
      data: { status: 'SUCCEEDED' },
    });
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.SUCCEEDED },
    });
    await this.orderStatusService.transition(
      orderId,
      'PAID',
      'dev:confirm',
      'Dev payment adapter confirmation',
    );
  }
}
