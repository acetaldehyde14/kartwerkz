import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Minimal append-only audit trail. Call from any mutation that an operator
 * might later need to answer "who did this and when" about: admin status
 * changes, proof approvals, send-to-supplier, pricing rule changes.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: (metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  }
}
