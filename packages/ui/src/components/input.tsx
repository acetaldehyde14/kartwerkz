import * as React from 'react';
import { cn } from '../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-[var(--radius)] border border-[rgb(var(--surface-border))] bg-[rgb(var(--surface))] px-4 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground-muted))] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:border-[rgb(var(--accent))]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-[rgb(var(--destructive))]',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
