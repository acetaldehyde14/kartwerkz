import { Skeleton } from '@kartwerkz/ui';

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
