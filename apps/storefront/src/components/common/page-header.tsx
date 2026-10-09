import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        {title}
      </h1>
      {description ? <p className="mt-4 text-base text-foreground-muted">{description}</p> : null}
    </div>
  );
}
