/**
 * Shapes of jobs enqueued onto BullMQ queues that apps/worker consumes.
 * Duplicated (not shared via a package) between apps/api and apps/worker
 * on purpose — these two processes are deliberately decoupled deployables
 * and the payloads are small/stable enough that duplication is cheaper
 * than introducing a shared runtime package for just this.
 */

export type EmailJobType =
  | 'password-reset'
  | 'order-confirmation'
  | 'payment-confirmation'
  | 'proof-ready'
  | 'revision-request-received'
  | 'artwork-approved'
  | 'production-started'
  | 'order-shipped';

export interface SendEmailJobPayload {
  type: EmailJobType;
  to: string;
  data: Record<string, unknown>;
}

export interface ScanUploadJobPayload {
  uploadedAssetId: string;
}
