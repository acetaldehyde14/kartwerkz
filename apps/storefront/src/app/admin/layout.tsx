'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@kartwerkz/api-client';
import { UserRole } from '@kartwerkz/shared';
import { Spinner } from '@kartwerkz/ui';

/**
 * Client-side ADMIN gate. This is UX only — it redirects non-admins away
 * so they don't see the dashboard flash, but it is NOT a security
 * boundary. The API MUST independently enforce role checks on every
 * admin-scoped endpoint; a user could otherwise bypass this by calling
 * the API directly.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.ADMIN)) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
