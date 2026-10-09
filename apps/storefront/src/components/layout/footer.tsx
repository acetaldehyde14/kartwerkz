import Link from 'next/link';
import { Instagram, Facebook, Youtube } from 'lucide-react';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/returns', label: 'Returns' },
  { href: '/customization-policy', label: 'Customization Policy' },
] as const;

const EXPLORE_LINKS = [
  { href: '/custom-graphics', label: 'Custom Graphics' },
  { href: '/configurator', label: 'Configurator' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-black uppercase tracking-[0.2em] text-foreground">
              KARTWERKZ
            </p>
            <p className="mt-3 max-w-xs text-sm text-foreground-muted">
              Custom kart graphics. Built around your identity.
            </p>
            <div className="mt-6 flex items-center gap-3 text-foreground-muted">
              {/* Placeholder social links — swap for real handles before launch. */}
              <Instagram className="h-4 w-4" aria-hidden="true" />
              <Facebook className="h-4 w-4" aria-hidden="true" />
              <Youtube className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Social links placeholder</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Legal
            </p>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Support
            </p>
            <p className="mt-4 text-sm text-foreground-muted">
              support@kartwerkz.example.com
              <br />
              Mon–Fri, 9am–6pm SGT
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-border pt-6 text-xs text-foreground-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Kartwerkz. All rights reserved.</p>
          <p>Singapore</p>
        </div>
      </div>
    </footer>
  );
}
