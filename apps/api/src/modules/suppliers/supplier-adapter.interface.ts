export interface ProductionPackage {
  orderId: string;
  orderNumber: string;
  kartModel: { manufacturer: string; model: string };
  graphicsDesign: { name: string; tier: string };
  colours: { primary: string; secondary: string; accent: string };
  finish: string;
  driver?: { name?: string; number?: string; countryCode?: string };
  specialInstructions?: string;
  approvedArtworkObjectKey: string;
  notes?: string;
}

export interface SupplierAdapterResult {
  submittedAt: Date;
  productionPackageObjectKey?: string;
}

/**
 * Strategy interface keyed by Supplier.integrationMethod. Only MANUAL is
 * implemented for the MVP (per spec: "implement manual adapter first,
 * architect for Email/API/Webhook/Portal later"); the others are stubs.
 */
export interface SupplierAdapter {
  submitProductionPackage(pkg: ProductionPackage): Promise<SupplierAdapterResult>;
}
