import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SEND_EMAIL_QUEUE = 'send-email';
export const SCAN_UPLOAD_QUEUE = 'scan-upload';

/**
 * Registers the BullMQ queues the API *produces* jobs onto. The worker
 * process (apps/worker) owns the Workers that consume these — this module
 * only needs producer-side registration so services can `@InjectQueue(...)`.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: SEND_EMAIL_QUEUE }, { name: SCAN_UPLOAD_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
