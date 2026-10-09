import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@kartwerkz/ui';

export const metadata: Metadata = {
  title: 'Checkout Cancelled',
};

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <XCircle className="h-14 w-14 text-foreground-muted" aria-hidden="true" />
      <h1 className="mt-6 font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Checkout Cancelled
      </h1>
      <p className="mt-4 text-sm text-foreground-muted">
        No payment was taken. Your cart is still saved if you&apos;d like to try again.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button asChild variant="accent">
          <Link href="/cart">RETURN TO CART</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">BACK HOME</Link>
        </Button>
      </div>
    </div>
  );
}
