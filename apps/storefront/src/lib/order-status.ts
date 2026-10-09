import { OrderStatus } from '@kartwerkz/shared';
import type { BadgeProps } from '@kartwerkz/ui';

/** Maps an order status to a Badge colour variant for consistent display. */
export function orderStatusVariant(status: OrderStatus): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case OrderStatus.DELIVERED:
    case OrderStatus.APPROVED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'destructive';
    case OrderStatus.AWAITING_APPROVAL:
    case OrderStatus.REVISION_REQUESTED:
    case OrderStatus.PROOF_READY:
      return 'warning';
    default:
      return 'default';
  }
}

/** Ordered list used to render a status timeline on the order detail page. */
export const ORDER_STATUS_TIMELINE: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.ARTWORK_IN_PROGRESS,
  OrderStatus.PROOF_READY,
  OrderStatus.AWAITING_APPROVAL,
  OrderStatus.APPROVED,
  OrderStatus.SENT_TO_SUPPLIER,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];
