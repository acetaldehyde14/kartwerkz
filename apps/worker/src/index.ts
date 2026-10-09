/**
 * Kartwerkz background worker — entrypoint.
 *
 * DESIGN CHOICE: plain Node + TypeScript, NOT a Nest application. This
 * process does exactly one thing (run BullMQ Workers against two fixed
 * queues) with no HTTP surface, no controllers, and no dependency
 * injection graph worth the overhead of bootstrapping Nest's module
 * system. Keeping it a lightweight script makes the Docker image smaller
 * and startup faster, and avoids pulling @nestjs/* into a process that
 * never serves a request.
 */
import { Redis } from 'ioredis';
import { createSendEmailWorker } from './queues/send-email.worker';
import { createScanUploadWorker } from './queues/scan-upload.worker';
import { prisma } from './prisma';

async function main(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required');
  }

  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  const sendEmailWorker = createSendEmailWorker(connection);
  const scanUploadWorker = createScanUploadWorker(connection);

  for (const worker of [sendEmailWorker, scanUploadWorker]) {
    worker.on('completed', (job) => {
      console.log(`[${worker.name}] job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
      console.error(`[${worker.name}] job ${job?.id} failed:`, err);
    });
  }

  console.log('Kartwerkz worker started — listening on queues: send-email, scan-upload');

  const shutdown = async (): Promise<void> => {
    console.log('Shutting down worker...');
    await Promise.all([sendEmailWorker.close(), scanUploadWorker.close()]);
    await prisma.$disconnect();
    connection.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal error starting worker', err);
  process.exit(1);
});
