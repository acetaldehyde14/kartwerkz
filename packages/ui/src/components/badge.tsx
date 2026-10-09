import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--foreground))]',
        accent: 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]',
        outline: 'border border-[rgb(var(--surface-border))] text-[rgb(var(--foreground-muted))]',
        success: 'bg-[rgb(var(--success))]/15 text-[rgb(var(--success))]',
        warning: 'bg-[rgb(var(--warning))]/15 text-[rgb(var(--warning))]',
        destructive: 'bg-[rgb(var(--destructive))]/15 text-[rgb(var(--destructive))]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
