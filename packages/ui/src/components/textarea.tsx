import * as React from 'react';
import { cn } from '../lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[7rem] w-full rounded-[var(--radius)] border border-[rgb(var(--surface-border))] bg-[rgb(var(--surface))] px-4 py-3 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground-muted))] transition-colors',
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
Textarea.displayName = 'Textarea';
