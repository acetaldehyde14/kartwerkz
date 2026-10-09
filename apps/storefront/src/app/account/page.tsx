'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useLogout } from '@kartwerkz/api-client';
import { Button, Card, CardContent, Skeleton } from '@kartwerkz/ui';

export default function AccountPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
          You&apos;re not signed in
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">Log in to view your account.</p>
        <Button asChild className="mt-8" variant="accent">
          <Link href="/login">LOG IN</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        My Account
      </h1>

      <Card className="mt-10">
        <CardContent className="space-y-1 pt-6">
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">{user.name}</p>
          <p className="text-sm text-foreground-muted">{user.email}</p>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/account/orders">
          <Card className="h-full transition-colors hover:border-accent">
            <CardContent className="pt-6">
              <p className="text-sm font-bold uppercase tracking-wide text-foreground">Orders</p>
              <p className="mt-1 text-xs text-foreground-muted">
                View your order history and status
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/configurator">
          <Card className="h-full transition-colors hover:border-accent">
            <CardContent className="pt-6">
              <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                Saved Configurations
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                Resume a design in the configurator
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Button
        variant="outline"
        className="mt-10"
        loading={logout.isPending}
        onClick={async () => {
          await logout.mutateAsync();
          router.push('/');
        }}
      >
        LOG OUT
      </Button>
    </div>
  );
}
