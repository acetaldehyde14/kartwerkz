import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatusService } from '../orders/order-status.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../checkout/payment-provider.interface';
import { SEND_EMAIL_QUEUE } from '../queues/queue.module';
import { SendEmailJobPayload } from '../queues/jobs.types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderStatusService: OrderStatusService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    @InjectQueue(SEND_EMAIL_QUEUE) private readonly emailQueue: Queue<SendEmailJobPayload>,
  ) {}

  async handleStripeWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): Promise<{ received: true }> {
    if (!signatureHeader) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.paymentProvider.verifyWebhookSignature(rawBody, signatureHeader) as Stripe.Event;
    } catch (err) {
      this.logger.warn(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      await this.applyPaymentSuccess(event);
    }

    return { received: true };
  }

  /**
   * Idempotent by construction: checks Payment.processedEventIds before
   * applying any effect, and appends the event id afterwards, all inside
   * one transaction. A replayed event id is a guaranteed no-op.
   */
  private async applyPaymentSuccess(event: Stripe.Event): Promise<void> {
    const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
    const orderId =
      'client_reference_id' in object && object.client_reference_id
        ? object.client_reference_id
        : (object.metadata?.orderId as string | undefined);

    if (!orderId) {
      this.logger.warn(
        `Stripe event ${event.id} had no orderId in metadata/client_reference_id — ignoring`,
      );
      return;
    }

    const orderIdForConfirmation = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({ where: { orderId } });
      if (!payment) {
        this.logger.warn(`No Payment row found for order ${orderId} — ignoring event ${event.id}`);
        return null;
      }

      if (payment.processedEventIds.includes(event.id)) {
        // Already processed — idempotent no-op.
        return null;
      }

      const intentId =
        'payment_intent' in object && typeof object.payment_intent === 'string'
          ? object.payment_intent
          : object.id;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          providerIntentId: intentId,
          processedEventIds: { push: event.id },
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.SUCCEEDED },
      });

      return orderId;
    });

    if (!orderIdForConfirmation) return;

    await this.orderStatusService.transition(orderIdForConfirmation, 'PAID', 'webhook:stripe');

    const order = await this.prisma.order.findUnique({ where: { id: orderIdForConfirmation } });
    if (order) {
      await this.emailQueue.add(SEND_EMAIL_QUEUE, {
        type: 'payment-confirmation',
        to: order.contactEmail,
        data: {
          orderNumber: order.orderNumber,
          totalMinorUnits: order.totalMinorUnits,
          currency: order.currency,
        },
      });
    }
  }
}
