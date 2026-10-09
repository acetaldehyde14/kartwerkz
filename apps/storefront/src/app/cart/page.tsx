'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatMoney, money } from '@kartwerkz/shared';
import { cartSubtotal, useCart, useRemoveCartItem, useUpdateCartItem } from '@kartwerkz/api-client';
import { Button, Card, CardContent, Input, Skeleton } from '@kartwerkz/ui';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !cart) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
          We couldn&apos;t load your cart
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          The API may not be reachable right now. Try refreshing, or start building a kit below.
        </p>
        <Button asChild className="mt-8" variant="accent">
          <Link href="/configurator">DESIGN YOUR KIT</Link>
        </Button>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Build a kit in the configurator and it&apos;ll show up here.
        </p>
        <Button asChild className="mt-8" variant="accent">
          <Link href="/configurator">DESIGN YOUR KIT</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Your Cart
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded bg-surface text-[10px] text-foreground-muted">
                  Kit preview
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {item.product?.name ?? 'Custom Kart Graphics Kit'}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {item.savedConfiguration
                      ? `Finish: ${item.savedConfiguration.finish} · Driver #${item.savedConfiguration.raceNumber ?? '—'}`
                      : 'Configuration summary unavailable'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Decrease quantity"
                    disabled={item.quantity <= 1 || updateItem.isPending}
                    onClick={() =>
                      updateItem.mutate({ itemId: item.id, input: { quantity: item.quantity - 1 } })
                    }
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    readOnly
                    value={item.quantity}
                    className="h-11 w-14 text-center"
                    aria-label="Quantity"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Increase quantity"
                    disabled={updateItem.isPending}
                    onClick={() =>
                      updateItem.mutate({ itemId: item.id, input: { quantity: item.quantity + 1 } })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <p className="w-24 text-right text-sm font-semibold text-foreground">
                  {formatMoney(money(item.unitPriceMinorUnits * item.quantity, item.currency))}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove item"
                  disabled={removeItem.isPending}
                  onClick={() => removeItem.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
              Order Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span>{formatMoney(cartSubtotal(cart))}</span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-surface-border pt-2 text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatMoney(cartSubtotal(cart))}</span>
              </div>
            </div>
            <Button asChild variant="accent" size="lg" className="w-full">
              <Link href="/checkout">PROCEED TO CHECKOUT</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
