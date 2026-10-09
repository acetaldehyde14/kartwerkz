import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@kartwerkz/shared';
import { Order } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isRevisionApprovedForProduction } from '../artwork/artwork-approval.util';

const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];

/**
 * The ONLY place allowed to change Order.status. Every module that moves an
 * order forward (checkout, webhooks, artwork, suppliers, admin) must call
 * `transition()` — never `prisma.order.update({ data: { status } })`
 * directly elsewhere.
 */
@Injectable()
export class OrderStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async transition(
    orderId: string,
    toStatus: OrderStatus,
    actor: string,
    note?: string,
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');

      const currentStatus = order.status as OrderStatus;
      const allowedNext = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
      const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
      const isCancelFromNonTerminal = toStatus === 'CANCELLED' && !isTerminal;

      if (!allowedNext.includes(toStatus) && !isCancelFromNonTerminal) {
        throw new BadRequestException(
          `Cannot transition order ${orderId} from ${currentStatus} to ${toStatus}`,
        );
      }

      if (toStatus === 'SENT_TO_SUPPLIER') {
        const approved = await isRevisionApprovedForProduction(tx, orderId);
        if (!approved) {
          throw new BadRequestException(
            'Order cannot be sent to supplier: the latest artwork revision has not been approved',
          );
        }
      }

      const updated = await tx.order.update({ where: { id: orderId }, data: { status: toStatus } });
      await tx.orderStatusEvent.create({
        data: { orderId, fromStatus: currentStatus, toStatus, actor, note },
      });
      return updated;
    });
  }
}
