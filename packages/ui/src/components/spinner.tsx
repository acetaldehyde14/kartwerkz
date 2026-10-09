import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: number;
}

export function Spinner({ className, size = 20, ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      width={size}
      height={size}
      className={cn('animate-spin text-[rgb(var(--accent))]', className)}
      {...props}
    />
  );
}
