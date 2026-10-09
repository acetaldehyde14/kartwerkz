import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@kartwerkz/ui';

export const metadata: Metadata = {
  title: 'Order Confirmed',
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <CheckCircle2 className="h-14 w-14 text-success" aria-hidden="true" />
      <h1 className="mt-6 font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Order Confirmed
      </h1>
      <p className="mt-4 text-sm text-foreground-muted">
        Payment received. We&apos;ll email you as soon as your artwork proof is ready for approval.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button asChild variant="accent">
          <Link href="/account/orders">VIEW MY ORDERS</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">BACK HOME</Link>
        </Button>
      </div>
    </div>
  );
}
