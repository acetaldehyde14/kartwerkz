import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../../common/s3/s3.service';
import {
  ProductionPackage,
  SupplierAdapter,
  SupplierAdapterResult,
} from '../supplier-adapter.interface';

/**
 * The only real adapter implemented for the MVP. "Manual" means an ops
 * person actually places the order with the supplier outside this system
 * (phone/email/portal by hand) — this adapter's only job is to persist a
 * durable, retrievable production package for them to work from, recorded
 * as an object key on the SupplierOrder row.
 */
@Injectable()
export class ManualFulfillmentAdapter implements SupplierAdapter {
  constructor(
    private readonly s3: S3Service,
    private readonly config: ConfigService,
  ) {}

  async submitProductionPackage(pkg: ProductionPackage): Promise<SupplierAdapterResult> {
    const bucket = this.config.get<string>('S3_BUCKET_ARTWORK', 'kartwerkz-artwork');
    const objectKey = `supplier-packages/${pkg.orderId}.json`;
    await this.s3.putObject(
      bucket,
      objectKey,
      Buffer.from(JSON.stringify(pkg, null, 2)),
      'application/json',
    );
    return { submittedAt: new Date(), productionPackageObjectKey: objectKey };
  }
}
