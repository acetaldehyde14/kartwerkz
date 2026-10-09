import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

/** Thin wrapper around the S3-compatible object store (MinIO in dev). */
@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      region: this.config.get<string>('S3_REGION', 'us-east-1'),
      forcePathStyle: this.config.get<boolean>('S3_FORCE_PATH_STYLE', true),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  /** Never derive the key from the client-supplied filename. */
  generateObjectKey(originalFilename: string): string {
    const ext = originalFilename.includes('.') ? originalFilename.split('.').pop() : undefined;
    const safeExt = ext && /^[a-zA-Z0-9]{1,8}$/.test(ext) ? `.${ext.toLowerCase()}` : '';
    return `${randomUUID()}${safeExt}`;
  }

  async putObject(bucket: string, key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async getSignedGetUrl(bucket: string, key: string, expiresInSeconds = 300): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
