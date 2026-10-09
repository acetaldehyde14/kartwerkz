import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ACCEPTED_ARTWORK_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  isPreviewRenderable,
} from '@kartwerkz/shared';
import { UploadedAsset } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/s3/s3.service';
import { SCAN_UPLOAD_QUEUE } from '../queues/queue.module';
import { ScanUploadJobPayload } from '../queues/jobs.types';
import { OwnerContext } from '../configurations/configurations.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
    @InjectQueue(SCAN_UPLOAD_QUEUE) private readonly scanQueue: Queue<ScanUploadJobPayload>,
  ) {}

  async upload(file: Express.Multer.File, owner: OwnerContext): Promise<UploadedAsset> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!(ACCEPTED_ARTWORK_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds maximum size of ${MAX_UPLOAD_SIZE_BYTES} bytes`);
    }

    const objectKey = this.s3.generateObjectKey(file.originalname);
    const bucket = this.config.get<string>('S3_BUCKET_UPLOADS', 'kartwerkz-uploads');
    await this.s3.putObject(bucket, objectKey, file.buffer, file.mimetype);

    const asset = await this.prisma.uploadedAsset.create({
      data: {
        userId: owner.userId,
        guestSessionId: owner.guestSessionId,
        originalFilename: file.originalname,
        objectKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: 'PENDING_SCAN',
        previewRenderable: isPreviewRenderable(file.mimetype),
      },
    });

    // NOTE: real malware scanning (e.g. ClamAV) is NOT implemented. This
    // just enqueues a stub job — see apps/worker/src/queues/scan-upload.worker.ts.
    await this.scanQueue.add(SCAN_UPLOAD_QUEUE, { uploadedAssetId: asset.id });

    return asset;
  }

  async getSignedUrl(
    id: string,
    owner: OwnerContext,
  ): Promise<{ url: string; expiresInSeconds: number }> {
    const asset = await this.prisma.uploadedAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Upload not found');

    const ownedByUser = owner.userId && asset.userId === owner.userId;
    const ownedByGuest = owner.guestSessionId && asset.guestSessionId === owner.guestSessionId;
    if (!ownedByUser && !ownedByGuest) {
      throw new ForbiddenException('This upload does not belong to you');
    }

    const bucket = this.config.get<string>('S3_BUCKET_UPLOADS', 'kartwerkz-uploads');
    const expiresInSeconds = 300;
    const url = await this.s3.getSignedGetUrl(bucket, asset.objectKey, expiresInSeconds);
    return { url, expiresInSeconds };
  }
}
