import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-semibold uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
  {
    variants: {
      variant: {
        primary:
          'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:bg-[rgb(var(--accent-hover))]',
        accent:
          'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:bg-[rgb(var(--accent-hover))]',
        secondary:
          'bg-[rgb(var(--surface-raised))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-border))]',
        outline:
          'border border-[rgb(var(--surface-border))] bg-transparent text-[rgb(var(--foreground))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]',
        ghost: 'bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-raised))]',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    // Radix's Slot requires exactly one React element child — it clones its
    // props onto that single child rather than rendering its own DOM node.
    // Branching here (rather than always rendering an optional loading icon
    // alongside `children`) keeps asChild callers (e.g. <Button asChild><Link/></Button>)
    // passing Slot exactly one child; the loading spinner only applies to a
    // real <button>, since there's no sensible way to inject it into an
    // arbitrary child element.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
