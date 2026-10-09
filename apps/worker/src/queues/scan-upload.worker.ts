import { Worker, type Job } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { prisma } from '../prisma';

export interface ScanUploadJobPayload {
  uploadedAssetId: string;
}

export const SCAN_UPLOAD_QUEUE = 'scan-upload';

/**
 * STUB malware scanning. Real scanning (e.g. ClamAV via clamscan/clamdscan,
 * or an external scanning API) is NOT implemented — this is a documented
 * boundary so the upload pipeline has somewhere to plug it in later without
 * changing the UploadedAsset state machine (PENDING_SCAN -> CLEAN/QUARANTINED).
 * TODO(security): integrate a real scanner before accepting production
 * traffic — until then, every upload is unconditionally marked CLEAN after
 * a short artificial delay (simulating scan latency for UI testing).
 */
export function createScanUploadWorker(
  connection: ConnectionOptions,
): Worker<ScanUploadJobPayload> {
  return new Worker<ScanUploadJobPayload>(
    SCAN_UPLOAD_QUEUE,
    async (job: Job<ScanUploadJobPayload>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await prisma.uploadedAsset.update({
        where: { id: job.data.uploadedAssetId },
        data: { status: 'CLEAN' },
      });
    },
    { connection },
  );
}
