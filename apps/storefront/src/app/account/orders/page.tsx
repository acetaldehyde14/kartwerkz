'use client';

import Link from 'next/link';
import { formatMoney, money } from '@kartwerkz/shared';
import { useOrders } from '@kartwerkz/api-client';
import { Badge, Card, CardContent, Skeleton } from '@kartwerkz/ui';
import { orderStatusVariant } from '@/lib/order-status';

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Order History
      </h1>

      {isLoading ? (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError || !orders ? (
        <p className="mt-10 text-sm text-foreground-muted">
          We couldn&apos;t load your orders right now. Please try again shortly.
        </p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-sm text-foreground-muted">
          You haven&apos;t placed any orders yet.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`}>
              <Card className="transition-colors hover:border-accent">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-SG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge variant={orderStatusVariant(order.status)}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                  <p className="text-sm font-semibold text-foreground">
                    {formatMoney(money(order.totalMinorUnits, order.currency))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
