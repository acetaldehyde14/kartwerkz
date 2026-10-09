'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConfirmDevPayment } from '@kartwerkz/api-client';
import { Button } from '@kartwerkz/ui';
import { AlertTriangle } from 'lucide-react';

/**
 * Dev-only stand-in for Stripe's hosted checkout page. `checkoutUrl` only
 * ever points here when `DevPaymentAdapter` issued the session (no
 * STRIPE_SECRET_KEY configured) — see docs/architecture.md#payments. The
 * API hard-disables the confirmation endpoint this page calls outside
 * development, so this page is a dead end (shows an error) in production
 * even if somehow reached.
 */
function DevConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('order');
  const confirmDevPayment = useConfirmDevPayment();
  const [error, setError] = React.useState<string | null>(null);
  const attempted = React.useRef(false);

  React.useEffect(() => {
    if (!orderId || attempted.current) return;
    attempted.current = true;
    confirmDevPayment.mutate(orderId, {
      onSuccess: () => router.replace(`/checkout/success?order=${orderNumber ?? ''}`),
      onError: () => setError('Could not confirm the dev payment. The API may be unreachable.'),
    });
    // confirmDevPayment is a fresh mutation object every render; only orderId should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <AlertTriangle className="h-12 w-12 text-warning" aria-hidden="true" />
        <h1 className="mt-6 text-xl font-bold uppercase tracking-wide text-foreground">
          Missing order
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">No order id was provided to confirm.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
        <h1 className="mt-6 text-xl font-bold uppercase tracking-wide text-foreground">
          Payment confirmation failed
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">{error}</p>
        <Button variant="outline" className="mt-8" onClick={() => router.push('/cart')}>
          BACK TO CART
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
      <h1 className="mt-6 text-xl font-bold uppercase tracking-wide text-foreground">
        Confirming dev payment…
      </h1>
      <p className="mt-3 max-w-sm text-sm text-foreground-muted">
        This stands in for Stripe&apos;s hosted checkout — no real payment is taken. Configure{' '}
        <code className="rounded bg-surface-raised px-1 py-0.5 text-xs">STRIPE_SECRET_KEY</code> to
        use real Stripe Checkout instead.
      </p>
    </div>
  );
}

export default function DevConfirmPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
        </div>
      }
    >
      <DevConfirmContent />
    </React.Suspense>
  );
}
