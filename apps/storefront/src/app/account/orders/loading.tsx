import { Skeleton } from '@kartwerkz/ui';

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
