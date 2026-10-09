import { Worker, type Job } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { sendEmail } from '../email/mailer';
import type { EmailJobType } from '../email/templates';

export interface SendEmailJobPayload {
  type: EmailJobType;
  to: string;
  data: Record<string, unknown>;
}

export const SEND_EMAIL_QUEUE = 'send-email';

export function createSendEmailWorker(connection: ConnectionOptions): Worker<SendEmailJobPayload> {
  return new Worker<SendEmailJobPayload>(
    SEND_EMAIL_QUEUE,
    async (job: Job<SendEmailJobPayload>) => {
      await sendEmail(job.data.type, job.data.to, job.data.data);
    },
    { connection },
  );
}
