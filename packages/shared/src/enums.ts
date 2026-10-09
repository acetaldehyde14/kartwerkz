// Mirrors apps/api/prisma/schema.prisma enums. Keep in sync manually — these
// are also re-exported by Prisma's generated client on the API side, but the
// storefront has no Prisma dependency, so this is the source of truth for
// client-side code.

export const MaterialFinish = {
  GLOSS: 'GLOSS',
  MATTE: 'MATTE',
  CHROME: 'CHROME',
  HOLOGRAPHIC: 'HOLOGRAPHIC',
} as const;
export type MaterialFinish = (typeof MaterialFinish)[keyof typeof MaterialFinish];

export const GraphicsDesignTier = {
  PREMADE: 'PREMADE',
  SEMI_CUSTOM: 'SEMI_CUSTOM',
  FULL_CUSTOM: 'FULL_CUSTOM',
} as const;
export type GraphicsDesignTier = (typeof GraphicsDesignTier)[keyof typeof GraphicsDesignTier];

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  ARTWORK_IN_PROGRESS: 'ARTWORK_IN_PROGRESS',
  PROOF_READY: 'PROOF_READY',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  APPROVED: 'APPROVED',
  SENT_TO_SUPPLIER: 'SENT_TO_SUPPLIER',
  IN_PRODUCTION: 'IN_PRODUCTION',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/**
 * Valid forward transitions for the order state machine. Enforced by
 * OrderStatusService on the API — this copy lets the admin UI grey out
 * invalid actions without a round trip. CANCELLED is reachable from any
 * non-terminal state and is intentionally omitted from each list below;
 * it's checked separately.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['ARTWORK_IN_PROGRESS', 'CANCELLED'],
  ARTWORK_IN_PROGRESS: ['PROOF_READY', 'CANCELLED'],
  PROOF_READY: ['AWAITING_APPROVAL', 'CANCELLED'],
  AWAITING_APPROVAL: ['APPROVED', 'REVISION_REQUESTED', 'CANCELLED'],
  REVISION_REQUESTED: ['ARTWORK_IN_PROGRESS', 'CANCELLED'],
  APPROVED: ['SENT_TO_SUPPLIER', 'CANCELLED'],
  SENT_TO_SUPPLIER: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ArtworkApprovalStatus = {
  APPROVED: 'APPROVED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
} as const;
export type ArtworkApprovalStatus =
  (typeof ArtworkApprovalStatus)[keyof typeof ArtworkApprovalStatus];

export const SupplierOrderStatus = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SupplierOrderStatus = (typeof SupplierOrderStatus)[keyof typeof SupplierOrderStatus];

export const ShipmentStatus = {
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
