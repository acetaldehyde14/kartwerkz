import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicting utility classes the way
 * the last one wins (via tailwind-merge) while still allowing conditional
 * classes (via clsx). Standard shadcn/ui-style helper.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
