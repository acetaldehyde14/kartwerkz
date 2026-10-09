import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { ArtworkApproval, ArtworkProof, ArtworkRevision } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/s3/s3.service';
import { OrderStatusService } from '../orders/order-status.service';
import { OrdersService } from '../orders/orders.service';
import { OwnerContext } from '../configurations/configurations.service';
import { SEND_EMAIL_QUEUE } from '../queues/queue.module';
import { SendEmailJobPayload } from '../queues/jobs.types';
import { isRevisionApprovedForProduction } from './artwork-approval.util';

@Injectable()
export class ArtworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
    private readonly orderStatusService: OrderStatusService,
    private readonly ordersService: OrdersService,
    @InjectQueue(SEND_EMAIL_QUEUE) private readonly emailQueue: Queue<SendEmailJobPayload>,
  ) {}

  // --- Admin --------------------------------------------------------------

  /**
   * Lazily creates the ArtworkProof for this order using the client-supplied
   * `proofId` the first time a revision is uploaded against it (admin UIs
   * generate a draft proof id up front) — see module docblock in the
   * controller for the route contract.
   */
  async addRevision(
    orderId: string,
    proofId: string,
    file: Express.Multer.File,
    notes?: string,
    previewImageUrl?: string,
  ): Promise<ArtworkRevision> {
    if (!file) throw new BadRequestException('No artwork file provided');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const bucket = this.config.get<string>('S3_BUCKET_ARTWORK', 'kartwerkz-artwork');
    const objectKey = this.s3.generateObjectKey(file.originalname);
    await this.s3.putObject(bucket, objectKey, file.buffer, file.mimetype);

    return this.prisma.$transaction(async (tx) => {
      let proof: ArtworkProof | null = await tx.artworkProof.findFirst({
        where: { id: proofId, orderId },
      });
      if (!proof) {
        proof = await tx.artworkProof.create({ data: { id: proofId, orderId } });
      }

      const latest = await tx.artworkRevision.findFirst({
        where: { artworkProofId: proof.id },
        orderBy: { revisionNumber: 'desc' },
      });
      const revisionNumber = (latest?.revisionNumber ?? 0) + 1;

      return tx.artworkRevision.create({
        data: {
          artworkProofId: proof.id,
          revisionNumber,
          fileObjectKey: objectKey,
          previewImageUrl,
          notes,
        },
      });
    });
  }

  async sendRevisionToCustomer(
    orderId: string,
    proofId: string,
    revisionId: string,
  ): Promise<ArtworkRevision> {
    const revision = await this.prisma.artworkRevision.findFirst({
      where: { id: revisionId, artworkProofId: proofId, artworkProof: { orderId } },
    });
    if (!revision) throw new NotFoundException('Artwork revision not found');

    const updated = await this.prisma.artworkRevision.update({
      where: { id: revisionId },
      data: { sentToCustomerAt: new Date() },
    });

    await this.orderStatusService.transition(
      orderId,
      'AWAITING_APPROVAL',
      'admin',
      'Proof sent to customer',
    );

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      await this.emailQueue.add(SEND_EMAIL_QUEUE, {
        type: 'proof-ready',
        to: order.contactEmail,
        data: { orderNumber: order.orderNumber, revisionNumber: updated.revisionNumber },
      });
    }

    return updated;
  }

  // --- Customer -------------------------------------------------------------

  async getProofsForOrder(orderId: string, owner: OwnerContext) {
    await this.ordersService.findForOwner(orderId, owner);
    return this.prisma.artworkProof.findMany({
      where: { orderId },
      include: { revisions: { orderBy: { revisionNumber: 'desc' }, include: { approvals: true } } },
    });
  }

  private async getOwnedProof(
    orderId: string,
    proofId: string,
    owner: OwnerContext,
  ): Promise<ArtworkProof> {
    const order = await this.ordersService.findForOwner(orderId, owner);
    const proof = await this.prisma.artworkProof.findFirst({
      where: { id: proofId, orderId: order.id },
    });
    if (!proof) throw new NotFoundException('Artwork proof not found');
    return proof;
  }

  private async getLatestRevision(proofId: string) {
    const revision = await this.prisma.artworkRevision.findFirst({
      where: { artworkProofId: proofId },
      orderBy: { revisionNumber: 'desc' },
    });
    if (!revision) throw new NotFoundException('No artwork revision found for this proof');
    return revision;
  }

  async approve(
    orderId: string,
    proofId: string,
    owner: OwnerContext,
    userId: string | undefined,
  ): Promise<ArtworkApproval> {
    const order = await this.ordersService.findForOwner(orderId, owner);
    if (order.status !== 'AWAITING_APPROVAL') {
      throw new BadRequestException(
        `Order must be AWAITING_APPROVAL to approve artwork (current: ${order.status})`,
      );
    }
    await this.getOwnedProof(orderId, proofId, owner);
    const latestRevision = await this.getLatestRevision(proofId);

    const approval = await this.prisma.artworkApproval.create({
      data: {
        artworkRevisionId: latestRevision.id,
        userId,
        guestContactEmail: userId ? undefined : order.contactEmail,
        status: 'APPROVED',
      },
    });

    await this.orderStatusService.transition(
      orderId,
      'APPROVED',
      userId ? `customer:${userId}` : 'guest',
      'Artwork approved',
    );

    await this.emailQueue.add(SEND_EMAIL_QUEUE, {
      type: 'artwork-approved',
      to: order.contactEmail,
      data: { orderNumber: order.orderNumber },
    });

    return approval;
  }

  async requestRevision(
    orderId: string,
    proofId: string,
    owner: OwnerContext,
    userId: string | undefined,
    comment: string,
  ): Promise<ArtworkApproval> {
    const order = await this.ordersService.findForOwner(orderId, owner);
    if (order.status !== 'AWAITING_APPROVAL') {
      throw new BadRequestException(
        `Order must be AWAITING_APPROVAL to request a revision (current: ${order.status})`,
      );
    }
    await this.getOwnedProof(orderId, proofId, owner);
    const latestRevision = await this.getLatestRevision(proofId);

    const approval = await this.prisma.artworkApproval.create({
      data: {
        artworkRevisionId: latestRevision.id,
        userId,
        guestContactEmail: userId ? undefined : order.contactEmail,
        status: 'REVISION_REQUESTED',
        comment,
      },
    });

    await this.orderStatusService.transition(
      orderId,
      'REVISION_REQUESTED',
      userId ? `customer:${userId}` : 'guest',
      comment,
    );

    await this.emailQueue.add(SEND_EMAIL_QUEUE, {
      type: 'revision-request-received',
      to: order.contactEmail,
      data: { orderNumber: order.orderNumber, comment },
    });

    return approval;
  }

  async isApprovedForProduction(orderId: string): Promise<boolean> {
    return isRevisionApprovedForProduction(this.prisma, orderId);
  }

  /** Returns the latest artwork revision only if it is approved for production, else null. */
  async getApprovedRevisionForProduction(orderId: string): Promise<ArtworkRevision | null> {
    const approved = await this.isApprovedForProduction(orderId);
    if (!approved) return null;
    const proof = await this.prisma.artworkProof.findFirst({ where: { orderId } });
    if (!proof) return null;
    return this.getLatestRevision(proof.id);
  }
}
