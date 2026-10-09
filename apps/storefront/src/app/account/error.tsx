'use client';

import { useEffect } from 'react';
import { Button } from '@kartwerkz/ui';

export default function AccountError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Account page error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-foreground-muted">We couldn&apos;t load your account.</p>
      <Button className="mt-8" variant="accent" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
