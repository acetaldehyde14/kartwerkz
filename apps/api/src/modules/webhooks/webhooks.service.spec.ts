import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatusService } from '../orders/order-status.service';
import { PaymentProvider } from '../checkout/payment-provider.interface';
import { Queue } from 'bullmq';
import { SendEmailJobPayload } from '../queues/jobs.types';

/**
 * Proves Stripe webhook handling is idempotent: replaying the same event id
 * must not re-apply payment effects (no second order transition, no second
 * confirmation email). Manual mocks, no live DB/Stripe needed.
 */
describe('WebhooksService idempotency', () => {
  const fakeEvent = {
    id: 'evt_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        client_reference_id: 'order-1',
        payment_intent: 'pi_test_123',
        metadata: {},
      },
    },
  };

  function buildService() {
    let processedEventIds: string[] = [];
    const payment = { id: 'payment-1', orderId: 'order-1', processedEventIds: [] as string[] };

    const tx = {
      payment: {
        findFirst: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve({ ...payment, processedEventIds: [...processedEventIds] }),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: { processedEventIds?: { push: string } } }) => {
            if (data.processedEventIds?.push) {
              processedEventIds = [...processedEventIds, data.processedEventIds.push];
            }
            return Promise.resolve({ ...payment });
          }),
      },
      order: {
        update: jest.fn().mockResolvedValue({ id: 'order-1' }),
      },
    };

    const prisma = {
      $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          orderNumber: 'KW-TEST-0001',
          contactEmail: 'customer@example.com',
          totalMinorUnits: 89900,
          currency: 'SGD',
        }),
      },
    } as unknown as PrismaService;

    const orderStatusService = {
      transition: jest.fn().mockResolvedValue({}),
    } as unknown as OrderStatusService;

    const paymentProvider = {
      verifyWebhookSignature: jest.fn().mockReturnValue(fakeEvent),
      createCheckoutSession: jest.fn(),
    } as unknown as PaymentProvider;

    const emailQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    } as unknown as Queue<SendEmailJobPayload>;

    const service = new WebhooksService(prisma, orderStatusService, paymentProvider, emailQueue);

    return { service, orderStatusService, emailQueue, tx };
  }

  it('applies payment success effects on the first delivery of an event', async () => {
    const { service, orderStatusService, emailQueue, tx } = buildService();

    await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

    expect(tx.payment.update).toHaveBeenCalledTimes(1);
    expect(orderStatusService.transition).toHaveBeenCalledTimes(1);
    expect(orderStatusService.transition).toHaveBeenCalledWith('order-1', 'PAID', 'webhook:stripe');
    expect(emailQueue.add).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the same event id is replayed', async () => {
    const { service, orderStatusService, emailQueue, tx } = buildService();

    await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
    await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

    // Only the first delivery should have mutated anything.
    expect(tx.payment.update).toHaveBeenCalledTimes(1);
    expect(orderStatusService.transition).toHaveBeenCalledTimes(1);
    expect(emailQueue.add).toHaveBeenCalledTimes(1);
  });
});
