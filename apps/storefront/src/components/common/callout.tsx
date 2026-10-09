import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Callout({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="note"
      className={cn(
        'mb-10 flex items-start gap-3 rounded border border-warning/30 bg-warning/10 p-4 text-sm text-warning',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
