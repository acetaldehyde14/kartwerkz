'use client';

import * as React from 'react';
import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query';

let browserQueryClient: QueryClient | undefined;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** One QueryClient per server request, one shared instance in the browser. */
function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(getQueryClient);
  return <TanstackQueryClientProvider client={client}>{children}</TanstackQueryClientProvider>;
}
