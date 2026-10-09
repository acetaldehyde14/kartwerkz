import { PrismaService } from '../../prisma/prisma.service';

/** Duck-typed so Prisma `$transaction` callback clients (which are not
 * instances of PrismaService) can be passed in without an unsafe cast. */
export type ArtworkProofReader = Pick<PrismaService, 'artworkProof'>;

/**
 * Plain utility function (not an injectable) shared between ArtworkService
 * and OrderStatusService. Kept as a free function rather than a provider on
 * ArtworkModule to avoid a circular module dependency: OrderStatusService
 * must enforce this check on the SENT_TO_SUPPLIER transition, but
 * ArtworkService also needs OrderStatusService to drive order transitions.
 *
 * True only if the order's latest artwork revision has an APPROVED
 * ArtworkApproval scoped to that exact revision id. Uploading a newer
 * revision naturally invalidates prior approvals — we never delete old
 * ArtworkApproval rows, we just stop matching "latest revision".
 */
export async function isRevisionApprovedForProduction(
  prisma: ArtworkProofReader,
  orderId: string,
): Promise<boolean> {
  const proof = await prisma.artworkProof.findFirst({
    where: { orderId },
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
        take: 1,
        include: { approvals: true },
      },
    },
  });
  const latestRevision = proof?.revisions[0];
  if (!latestRevision) return false;
  return latestRevision.approvals.some((a) => a.status === 'APPROVED');
}
