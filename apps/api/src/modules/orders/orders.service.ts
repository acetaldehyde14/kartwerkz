import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Order } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OwnerContext } from '../configurations/configurations.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** KW-YYYYMMDD-XXXXXX, with a short retry loop against the unique constraint. */
  async generateOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = randomBytes(4).toString('hex').toUpperCase();
      const candidate = `KW-${datePart}-${randomPart}`;
      const existing = await this.prisma.order.findUnique({ where: { orderNumber: candidate } });
      if (!existing) return candidate;
    }
    throw new Error('Failed to generate a unique order number after 5 attempts');
  }

  async listForUser(userId: string): Promise<Order[]> {
    return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Ownership for guest orders ties access to the current browser's guest
   * session cookie. LIMITATION (documented, not hardened in this MVP): if
   * the guest clears cookies or switches browsers they lose access to the
   * order. TODO: add an email-link verification token sent at checkout as
   * a secondary access path for guest order lookup.
   */
  async findForOwner(orderId: string, owner: OwnerContext) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusEvents: { orderBy: { createdAt: 'asc' } },
        payments: true,
        shipment: true,
        supplierOrder: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.userId) {
      if (order.userId !== owner.userId) {
        throw new ForbiddenException('This order does not belong to you');
      }
    } else {
      if (!owner.guestSessionId || order.guestSessionId !== owner.guestSessionId) {
        throw new ForbiddenException('This order does not belong to your guest session');
      }
    }
    return order;
  }
}
