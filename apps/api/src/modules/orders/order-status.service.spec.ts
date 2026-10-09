import { BadRequestException } from '@nestjs/common';
import { OrderStatusService } from './order-status.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Manual mock of PrismaService — just enough of the Prisma Client surface
 * (`$transaction`, `order.findUnique/update`, `orderStatusEvent.create`,
 * `artworkProof.findFirst`) for OrderStatusService's logic. No live DB
 * needed for this unit test, no extra mocking library required.
 */
function createMockPrisma(initialStatus: string) {
  const order = { id: 'order-1', status: initialStatus };
  const orderStatusEvents: unknown[] = [];

  const tx = {
    order: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...order })),
      update: jest.fn().mockImplementation(({ data }: { data: { status: string } }) => {
        order.status = data.status;
        return Promise.resolve({ ...order });
      }),
    },
    orderStatusEvent: {
      create: jest.fn().mockImplementation(({ data }: { data: unknown }) => {
        orderStatusEvents.push(data);
        return Promise.resolve(data);
      }),
    },
    artworkProof: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  const prisma = {
    $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
  } as unknown as PrismaService;

  return { prisma, order, orderStatusEvents, tx };
}

describe('OrderStatusService', () => {
  it('allows a valid forward transition and records an OrderStatusEvent', async () => {
    const { prisma, order, orderStatusEvents } = createMockPrisma('PENDING_PAYMENT');
    const service = new OrderStatusService(prisma);

    const updated = await service.transition('order-1', 'PAID', 'webhook:stripe');

    expect(updated.status).toBe('PAID');
    expect(order.status).toBe('PAID');
    expect(orderStatusEvents).toHaveLength(1);
    expect(orderStatusEvents[0]).toMatchObject({
      orderId: 'order-1',
      fromStatus: 'PENDING_PAYMENT',
      toStatus: 'PAID',
      actor: 'webhook:stripe',
    });
  });

  it('throws on an invalid transition', async () => {
    const { prisma } = createMockPrisma('PENDING_PAYMENT');
    const service = new OrderStatusService(prisma);

    await expect(service.transition('order-1', 'SHIPPED', 'admin:1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it("allows CANCELLED from a non-terminal state even though it is not in that state's explicit list", async () => {
    const { prisma, order } = createMockPrisma('IN_PRODUCTION');
    const service = new OrderStatusService(prisma);

    const updated = await service.transition(
      'order-1',
      'CANCELLED',
      'admin:1',
      'Customer requested cancellation',
    );

    expect(updated.status).toBe('CANCELLED');
    expect(order.status).toBe('CANCELLED');
  });

  it('does not allow CANCELLED from a terminal state (DELIVERED)', async () => {
    const { prisma } = createMockPrisma('DELIVERED');
    const service = new OrderStatusService(prisma);

    await expect(service.transition('order-1', 'CANCELLED', 'admin:1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
