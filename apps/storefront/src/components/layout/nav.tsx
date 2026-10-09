'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingCart, User } from 'lucide-react';
import { useCart, useCurrentUser } from '@kartwerkz/api-client';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@kartwerkz/ui';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/custom-graphics', label: 'Custom Graphics' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Cart/user queries fail gracefully (API may not be running) — the
  // badge/account link just degrade to their logged-out defaults.
  const { data: cart } = useCart();
  const { data: user } = useCurrentUser();

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-black uppercase tracking-[0.2em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          KARTWERKZ
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-xs font-semibold uppercase tracking-wide text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                pathname === link.href && 'text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={user ? '/account' : '/login'}
            className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted transition-colors hover:text-foreground sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            {user ? 'Account' : 'Login'}
          </Link>

          <Button asChild variant="ghost" size="icon" aria-label={`Cart, ${itemCount} items`}>
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4" aria-label="Mobile">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold uppercase tracking-wide text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-surface-border" />
                <Link
                  href={user ? '/account' : '/login'}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold uppercase tracking-wide text-foreground"
                >
                  {user ? 'Account' : 'Login'}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
