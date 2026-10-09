import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@kartwerkz/ui';
import { KartHero } from '@/components/three/kart-hero';

export const metadata: Metadata = {
  title: 'Custom Kart Graphics, Built Around Your Identity',
  description:
    'Design your own karting livery in a live 3D configurator — colours, driver number, sponsor logos, and finish — then ship it straight to production.',
};

/**
 * Server-rendered hero (headline, copy, CTAs) for SEO/no-JS/first-paint,
 * followed by the interactive scroll-driven 3D kart animation
 * (`KartHero`, client-only, dynamically imported — see
 * src/components/three/kart-hero.tsx) which does the actual
 * plain-bodywork-to-full-livery reveal described in the product spec.
 */
export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-surface-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-36">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Kartwerkz / Custom Livery Studio
          </p>
          <h1 className="font-display text-display-xl font-black uppercase tracking-tight text-foreground">
            MAKE IT YOURS.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground-muted">
            Custom kart graphics. Built around your identity.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href="/configurator">DESIGN YOUR KIT</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/gallery">EXPLORE GRAPHICS</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="kart-hero-mount">
        <KartHero />
      </section>
    </>
  );
}
