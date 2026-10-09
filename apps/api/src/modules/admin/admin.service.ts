import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface PaginatedOrders {
  data: Order[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminDashboard {
  totalOrders: number;
  pendingPayment: number;
  awaitingArtwork: number;
  awaitingApproval: number;
  approved: number;
  inProduction: number;
  shipped: number;
  salesSummaryMinorUnits: number;
  currency: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(status?: OrderStatus, page = 1, pageSize = 20): Promise<PaginatedOrders> {
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, page, pageSize, total };
  }

  async dashboard(): Promise<AdminDashboard> {
    const [
      totalOrders,
      pendingPayment,
      awaitingArtwork,
      awaitingApproval,
      approved,
      inProduction,
      shipped,
      paidOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      this.prisma.order.count({
        where: { status: { in: ['ARTWORK_IN_PROGRESS', 'PROOF_READY'] } },
      }),
      this.prisma.order.count({ where: { status: 'AWAITING_APPROVAL' } }),
      this.prisma.order.count({ where: { status: 'APPROVED' } }),
      this.prisma.order.count({ where: { status: 'IN_PRODUCTION' } }),
      this.prisma.order.count({ where: { status: 'SHIPPED' } }),
      this.prisma.order.findMany({
        where: {
          status: {
            in: [
              'PAID',
              'ARTWORK_IN_PROGRESS',
              'PROOF_READY',
              'AWAITING_APPROVAL',
              'REVISION_REQUESTED',
              'APPROVED',
              'SENT_TO_SUPPLIER',
              'IN_PRODUCTION',
              'SHIPPED',
              'DELIVERED',
            ],
          },
        },
        select: { totalMinorUnits: true, currency: true },
      }),
    ]);

    const currency = paidOrders[0]?.currency ?? 'SGD';
    const salesSummaryMinorUnits = paidOrders.reduce((sum, o) => sum + o.totalMinorUnits, 0);

    return {
      totalOrders,
      pendingPayment,
      awaitingArtwork,
      awaitingApproval,
      approved,
      inProduction,
      shipped,
      salesSummaryMinorUnits,
      currency,
    };
  }
}
