import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  ProductionPackage,
  SupplierAdapter,
  SupplierAdapterResult,
} from '../supplier-adapter.interface';

/**
 * Stubs for integration methods not yet built. Kept as separate classes
 * (rather than one shared stub) so each can be fleshed out independently
 * without touching the strategy selection logic in SupplierFulfillmentService.
 */

@Injectable()
export class EmailFulfillmentAdapter implements SupplierAdapter {
  submitProductionPackage(_pkg: ProductionPackage): Promise<SupplierAdapterResult> {
    throw new NotImplementedException('Email supplier integration is not implemented yet');
  }
}

@Injectable()
export class ApiFulfillmentAdapter implements SupplierAdapter {
  submitProductionPackage(_pkg: ProductionPackage): Promise<SupplierAdapterResult> {
    throw new NotImplementedException('API supplier integration is not implemented yet');
  }
}

@Injectable()
export class WebhookFulfillmentAdapter implements SupplierAdapter {
  submitProductionPackage(_pkg: ProductionPackage): Promise<SupplierAdapterResult> {
    throw new NotImplementedException('Webhook supplier integration is not implemented yet');
  }
}

@Injectable()
export class PortalFulfillmentAdapter implements SupplierAdapter {
  submitProductionPackage(_pkg: ProductionPackage): Promise<SupplierAdapterResult> {
    throw new NotImplementedException('Portal supplier integration is not implemented yet');
  }
}
