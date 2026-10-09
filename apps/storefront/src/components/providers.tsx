'use client';

import * as React from 'react';
import { QueryClientProvider } from '@kartwerkz/api-client';
import { TooltipProvider } from '@kartwerkz/ui';

/**
 * Client-side provider tree. Kept as a single small wrapper so
 * `app/layout.tsx` (a Server Component) only needs one 'use client'
 * boundary rather than importing each provider individually.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
