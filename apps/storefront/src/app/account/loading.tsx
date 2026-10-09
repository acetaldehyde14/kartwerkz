import { Skeleton } from '@kartwerkz/ui';

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
